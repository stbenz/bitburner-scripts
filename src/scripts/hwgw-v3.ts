import { NS, ScriptArg } from '@ns';
import {
  gainRoot,
  getAvailableResources,
  getAvailableHackTargets
} from 'lib/targetlib';
import { IResource } from '/lib/interfaces';

// how much money in percent of max money should remain on the target after hack (starting value)
const gHackRemainMoneyRatio = 0.5;

// how much money in percent of max money should remain on the target after hack (max value)
const gHackMaxRemainMoneyRatio = 0.95;

// how much money in percent of max money should remain on the target after hack (min value)
const gHackMinRemainMoneyRatio = 0.1;

// increase factor for remaining money ratio per error
const gHackRemainErrorIncrease = 0.005;

// decrease factor for remaining money ratio for successful starts
const gHackRemainSuccessDecrease = 0.005;

// how much money in percent of max money must be available to hack
const gHackMinMoneyRatio = 0.8;

// time buffer in ms between end of parallel processes
const gTimeBuffer = 500;

// minimum chance to consider target for growing
const gMinChanceForGrow = 0.85;

// minimum chance to consider target for hacking
const gMinChanceForHack = 0.9;

// max number of pure weaken processes
const gMaxWeakenProcesses = 10;

// max number of grow+weaken processes
const gMaxGrowProcesses = 10;

// max number of parallel hack+weaken+grow+weaken processes per target
const gMaxPrallelHackProcesses = 100;

// max number of hack targets (-1 for no limit)
const gMaxHackTargets = -1;

// min share process RAM
const gMinShareRam = 8 * 1024;

// tail verbosity
const gVerbosity = 0;

interface IReservation {
  res: IResource;
  ram: number;
  script: string;
  threads: number;
}

type IReservationWithArgs = [IReservation|null, ScriptArg[]]

interface IProcess extends IReservation {
  pid: number;
}

interface IScript {
  script: string;
  threads: number;
  args: ScriptArg[];
}

/**
 * reserve RAM to run script on suitable server
 * 
 * @param {NS} ns netscript interface
 * @param {IResource[]} resources resources as returned by getAvailableResources
 * @param {String} script the script to start
 * @param {Number} numThreads number of threads
 * @param {Boolean} allowLess allow less threads than specified
 * @return {IReservation|null} information about reservation or null in case of error
 */
function reserveScriptRam(ns: NS, resources: IResource[], script: string, numThreads: number, allowLess = false): IReservation|null {
  // get required RAM to run numThreads of script
  let scriptRam = ns.getScriptRam(script) * numThreads;

  // get suitable servers sorted by RAM ascending
  let suitable = resources
    .filter((s) => s.ram >= scriptRam);

  // if less is allowed, find the maximum number of threads
  while (allowLess && numThreads > 1 && suitable.length == 0) {
    scriptRam = ns.getScriptRam(script) * (--numThreads);
    suitable = resources
      .filter((s) => s.ram >= scriptRam);
  }
  
  if (suitable.length > 0) {
    const tgt = suitable[0];
    tgt.ram -= scriptRam;
    return {
        res: tgt,
        ram: scriptRam,
        script: script,
        threads: numThreads
    }
  }

  ns.printf("WARN " + "no suitable server, RAM needed for %s (%d threads): %s", 
    script, numThreads, ns.formatRam(scriptRam));

  return null;
}

/**
 * start script based on reservation
 * 
 * @param {NS} ns netscript interface
 * @param {IReservation} reservation the reserved resource
 * @param {...ScriptArg[]} scriptArgs arguments for script
 * @return {IProcess|null} information about started process or null in case of error
 */
function startReservation(ns: NS, reservation: IReservation, ...scriptArgs: ScriptArg[]): IProcess|null {
  if (!ns.fileExists(reservation.script, reservation.res.name)) {
    ns.scp(reservation.script, reservation.res.name);
  }
  const p = ns.exec(reservation.script, reservation.res.name, 
    reservation.threads, ...scriptArgs);
  if (p != 0) {
    return Object.assign({ pid: p }, reservation);
  } else {
    ns.print("ERROR " + "failed to start script on " + reservation.res.name);

    reservation.res.ram += reservation.ram;
    return null;
  }
}

/**
 * release resources of reservation
 * 
 * @param {NS} ns netscript interface
 * @param {IReservation} reservation the reserved resource
 */
function freeReservation(ns: NS, reservation: IReservation) {
  reservation.res.ram += reservation.ram;
}

/**
 * stop process started with startReservation
 * 
 * @param {NS} ns netscript interface
 * @param {IProcess} process the process information
 */
function stopProcess(ns: NS, process: IProcess) {
  if (ns.kill(process.pid)) {
    process.res.ram += process.ram;
  } else {
    ns.print("ERROR " + "failed to stop PID " + process.pid);
  }
}

/**
 * start multipe scripts with reservation and cleanup on error
 * 
 * @param {NS} ns netscript interface
 * @param {IResource[]} resources resources as returned by getAvailableResources
 * @param {IScript[]} scripts scripts to start
 * @param {boolean} allowLess allow less threads than specified
 * @return {IProcess[]} information about started processes or null in case of error
 */
function startScripts(ns: NS, resources: IResource[], scripts: IScript[], allowLess: boolean = false): IProcess[] {
  // reserve resources
  const reservations = scripts
    .map((s): IReservationWithArgs => [
      reserveScriptRam(ns, resources, s.script, s.threads, allowLess), 
      s.args
    ]);

  // cleanup if not all resources reserved
  if (!reservations.every(([r]) => r != null)) {
    reservations
      .filter(([r]) => r != null)
      .forEach(([r]) => freeReservation(ns, r as IReservation));
    return [];
  }

  // start processes
  const processes = reservations
    .map(([r, a]) => startReservation(ns, r as IReservation, ...a));
  
  // clean up if not all processes started
  if (!processes.every((p) => p != null)) {
    processes
      .filter((p) => p != null)
      .forEach((p) => stopProcess(ns, p as IProcess));
    return [];
  }

  return processes as IProcess[];
}

interface IBatch {
  processes: IProcess[];
  start: number;
  end: number;
  latestStart?: number;
  earliestEnd?: number;
}

interface IContext {
  name: string;
  batches: IBatch[];
}

/** @param {NS} ns */
export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.setTitle("HWGW v3");
  //ns.resizeTail(210, 200);

  let contexts = new Array<IContext>();
  let weakenRunning = new Array<string>();
  let growRunning = new Array<string>();
  let shareRunning = new Array<IProcess>();

  let hackRemainMoneyRatio = gHackRemainMoneyRatio;

  while (true) {
    // get servers with root access
    let servers = gainRoot(ns, "home", true);

    // get resources
    let resources = getAvailableResources(ns, servers);

    // get possible hack targets
    let targets = getAvailableHackTargets(ns, servers);

    // clean up contexts
    for (const ctx of contexts) {
      for (const b of ctx.batches) {
        b.processes = b.processes.filter((p) => ns.isRunning(p.pid));
      }
      ctx.batches = ctx.batches.filter((b) => b.processes.length > 0);
    }
    contexts = contexts.filter((ctx) => ctx.batches.length > 0);
    
    // clean up weaken targets
    weakenRunning = weakenRunning
      .filter((r) => contexts.find((ctx) => ctx.name == r));

    // clean up grow targets
    growRunning = growRunning
      .filter((r) => contexts.find((ctx) => ctx.name == r));

    // clean up share processes
    shareRunning = shareRunning
      .filter((r) => ns.isRunning(r.pid));

    // get current time
    const now = Date.now();

    // find targets to weaken
    // weaken is performed on targets not at min security
    // also don't run on targets with running processes
    // prioritize by lowest required hacking level
    const weakenTargets = targets
      .filter((t) => !contexts.find((ctx) => ctx.name == t.name))
      .filter((t) => t.curSecurity > t.minSecurity)
      .sort((a, b) => a.reqLevel - b.reqLevel);
    
    // start weaken processes
    while (weakenRunning.length < gMaxWeakenProcesses && weakenTargets.length > 0) {
      // take first weaken target
      const ht = weakenTargets.shift()!;

      // caluclate number of threads
      const numGrowWeaken = Math.ceil((ht.curSecurity - ht.minSecurity) / 0.05);
      
      // calculate runtime
      const timeWeaken = ns.getWeakenTime(ht.name);

      // prepare scripts to run
      const scripts: IScript[] = [
        {
          script: "scripts/do-weaken.js",
          threads: numGrowWeaken,
          args: [ht.name, 0]
        }
      ];

      // start batch
      const batch: IBatch = {
        processes: startScripts(ns, resources, scripts ,true),
        start: now,
        end: now + timeWeaken
      };

      if (batch.processes.length > 0) {
        // find or create context for target
        let ctx = contexts.find((c) => c.name == ht.name);
        if (!ctx) {
          ctx = {
            name: ht.name,
            batches: []
          };
          contexts.push(ctx);
        }

        // add batch to context
        ctx.batches.push(batch);

        // add to running
        weakenRunning.push(ht.name);
      }
    }
    
    // find targets to grow+weaken
    // grow is performed on targets with lacking money
    // only grow targets at min security and with high enough hacking chance
    // also don't run on targets with running processes
    // prioritize by highest hacking chance and most possible money
    const growTargets = targets
      .filter((t) => !contexts.find((ctx) => ctx.name == t.name))
      .filter((t) => 
        t.curMoney < t.maxMoney * gHackMinMoneyRatio && 
        t.chance >= gMinChanceForGrow &&
        t.curSecurity == t.minSecurity)
      .sort((a, b) => b.chance - a.chance != 0 ? b.chance - a.chance : b.maxMoney - a.maxMoney);
    
    // start grow processes
    while (growRunning.length < gMaxGrowProcesses && growTargets.length > 0) {
      // take first grow target
      const ht = growTargets.shift()!;

      // caluclate number of threads
      const numGrow = Math.max(1, Math.floor(ns.growthAnalyze(ht.name, ht.maxMoney / Math.max(1, ht.curMoney))));
      const growSecIncrease = ns.growthAnalyzeSecurity(numGrow);
      const numGrowWeaken = Math.ceil(growSecIncrease / 0.05);

      // calculate runtime
      const timeWeaken = ns.getWeakenTime(ht.name);
      const timeGrow = ns.getGrowTime(ht.name) + gTimeBuffer;
      const timeGrowWeaken = timeWeaken;
      const timeOverall = Math.max(
        timeGrow,
        timeGrowWeaken
      );

      // prepare scripts to run
      const scripts: IScript[] = [
        {
          script: "scripts/do-grow.js",
          threads: numGrow, 
          args: [ht.name, timeOverall - timeGrow]
        },
        {
          script: "scripts/do-weaken.js",
          threads: numGrowWeaken,
          args: [ht.name, timeOverall - timeGrowWeaken]
        }
      ];

      // start batch
      var batch: IBatch = {
        processes: startScripts(ns, resources, scripts, true),
        start: now,
        end: now + timeOverall
      };

      if (batch.processes.length > 0) {
        // find or create context for target
        let ctx = contexts.find((c) => c.name == ht.name);
        if (!ctx) {
          ctx = {
            name: ht.name,
            batches: []
          };
          contexts.push(ctx);
        }

        // add batch to context
        ctx.batches.push(batch);

        // add to running
        growRunning.push(ht.name);
      }
    }

    // find targets to hack+weaken+grow+weaken
    // hack is performed on targets with enough money
    // only hack targets at min security and with high enough hacking chance
    const hackTargets = targets
      .filter((t) => 
        t.curMoney >= t.maxMoney * gHackMinMoneyRatio && 
        t.chance >= gMinChanceForHack &&
        t.curSecurity == t.minSecurity &&
        !weakenRunning.includes(t.name) &&
        !growRunning.includes(t.name));
    
    // failed and successful hack starts
    let hacksStarted = 0;
    let hacksFailed = 0;

    // start hack processes
    for (const ht of hackTargets) {
      // calucalte number of threads
      const numHack = Math.max(1, Math.floor(ns.hackAnalyzeThreads(ht.name, ht.curMoney - hackRemainMoneyRatio * ht.maxMoney)));
      const hackSecIncrease = ns.hackAnalyzeSecurity(numHack);
      const numHackWeaken = Math.ceil(hackSecIncrease / 0.05);
      const numGrow = Math.max(1, Math.ceil(ns.growthAnalyze(ht.name, Math.max(1, 1 / hackRemainMoneyRatio))));
      const growSecIncrease = ns.growthAnalyzeSecurity(numGrow);
      const numGrowWeaken = Math.ceil(growSecIncrease / 0.05);

      // calculate runtime
      const timeWeaken = ns.getWeakenTime(ht.name);
      const timeHack = ns.getHackTime(ht.name) + gTimeBuffer * 3;
      const timeHackWeaken = timeWeaken + gTimeBuffer * 2;
      const timeGrow = ns.getGrowTime(ht.name) + gTimeBuffer;
      const timeGrowWeaken = timeWeaken;
      const timeOverall = Math.max(
        timeHack,
        timeHackWeaken,
        timeGrow,
        timeGrowWeaken
      );
      const latestStart = timeOverall - Math.min(
        timeHack,
        timeHackWeaken,
        timeGrow,
        timeGrowWeaken
      );
      const earliestEnd = timeOverall - gTimeBuffer * 3;

      // find context
      let ctx = contexts.find((c) => c.name == ht.name);
      if (ctx) {
        // only a max number of parallel batches allowed
        if (ctx.batches.length >= gMaxPrallelHackProcesses) {
          continue;
        }

        // for parallel batches to work
        // the latest function to start must start before any running batch ends and
        // the earliest function to end must end after any running batch ends
        if (ctx.batches.length > 0 && (
            now + latestStart + gTimeBuffer >= Math.min(...ctx.batches.map((b) => b.earliestEnd ?? 0)) ||
            now + earliestEnd - gTimeBuffer <= Math.max(...ctx.batches.map((b) => b.end)))) {
          continue;
        }
      } else {
        // check if maximum number of hack targets reached
        if (gMaxHackTargets != -1 && contexts.length - weakenRunning.length - growRunning.length >= gMaxHackTargets) {
          break;
        }
      }

      // prepare scripts to run
      const scripts: IScript[] = [
        {
          script: "scripts/do-hack.js",
          threads: numHack, 
          args: [ht.name, timeOverall - timeHack]
        },
        {
          script: "scripts/do-weaken.js",
          threads: numHackWeaken,
          args: [ht.name, timeOverall - timeHackWeaken]
        },
        {
          script: "scripts/do-grow.js",
          threads: numGrow, 
          args: [ht.name, timeOverall - timeGrow]
        },
        {
          script: "scripts/do-weaken.js",
          threads: numGrowWeaken,
          args: [ht.name, timeOverall - timeGrowWeaken]
        }
      ];

      // start batch
      var batch: IBatch = {
        processes: startScripts(ns, resources, scripts),
        start: now,
        end: now + timeOverall,
        latestStart: now + latestStart,
        earliestEnd: now + earliestEnd
      };

      if (batch.processes.length > 0) {
        // create context for target if not found
        if (!ctx) {
          ctx = {
            name: ht.name,
            batches: []
          };
          contexts.push(ctx);
        }

        // add batch to context
        ctx.batches.push(batch);

        hacksStarted++;
      } else {
        ns.printf("INFO: current remaining money ratio: %.2f", hackRemainMoneyRatio);
        hacksFailed++;
      }
    }

    // balance hack money ratio
    // increase remaining money ratio in case of errors
    // decrease remaining money ratio in case of started processes
    // lower remaining money ratio requires more threads to hack/grow
    if (hacksFailed) {
      hackRemainMoneyRatio = Math.min(
        gHackMaxRemainMoneyRatio, 
        hackRemainMoneyRatio + hacksFailed * gHackRemainErrorIncrease);
    } else if (hacksStarted) {
      hackRemainMoneyRatio = Math.max(
        gHackMinRemainMoneyRatio,
        hackRemainMoneyRatio - gHackRemainSuccessDecrease);
    }

    // prepare script for share
    // use half of min purchased server RAM per process but not less than 1TB
    const minPurchasedRam = Math.min(...ns.getPurchasedServers().map((s) => ns.getServerMaxRam(s)));
    const shareScriptRam = ns.getScriptRam("scripts/do-share.js");
    const shareThreads = Math.max(gMinShareRam, minPurchasedRam / 2) / shareScriptRam;
    const shareScripts: IScript[] = [
      {
        script: "scripts/do-share.js",
        threads: shareThreads,
        args: []
      }
    ];

    // start share processes until less than min purchased server RAM is used or start failed
    while (resources.reduce((a, c) => a + c.ram, 0) > Math.max(gMinShareRam, minPurchasedRam)) {
      const r = startScripts(ns, resources, shareScripts);
      if (r == null || r.length == 0) {
        ns.print("WARN " + "start share failed");
        break;
      }
      shareRunning.push(...r);
    }

    if (gVerbosity > 0) {
      ns.print("-".repeat(40));
      for (const ctx of contexts.sort((a, b) => a.name.localeCompare(b.name))) {
        if (gVerbosity >= 2) {
          let ch = "";
          if (weakenRunning.includes(ctx.name)) {
            ch = "[WEAKEN]";
          } else if (growRunning.includes(ctx.name)) {
            ch = "[GROW]";
          }
          ns.printf("%-20s %19s", ctx.name, ch);
          
          for (const batch of ctx.batches.sort((a, b) => a.end - b.end)) {
            let d = Math.max(0, batch.end - now);
            const hh = Math.floor(d / 3600000);
            d -= hh * 3600000;
            const mm = Math.floor(d / 60000);
            d -= mm * 60000;
            const ss = Math.floor(d / 1000);

            const plen = 25;
            const p = Math.round(Math.min(1, (now - batch.start) / (batch.end - batch.start)) * plen);
            ns.printf("   [%s%s] %02d:%02d:%02d",
              "#".repeat(p), "_".repeat(plen - p),
              hh, mm, ss);
          }
        } else {
          let ch = " ";
          if (weakenRunning.includes(ctx.name)) {
            ch = "W";
          } else if (growRunning.includes(ctx.name)) {
            ch = "G";
          }
          ns.printf("%s %-20s %3d b | %5d t", 
            ch, ctx.name,
            ctx.batches.length,
            ctx.batches.reduce((ba, bc) => ba + bc.processes
              .reduce((pa, pc) => pa + pc.threads, 0), 0));
        }
      }
      ns.print("-".repeat(40));
      const ramHack = contexts
        .reduce((ca, cc) => ca + cc.batches
          .reduce((ba, bc) => ba + bc.processes
            .reduce((pa, pc) => pa + pc.ram, 0), 0), 0);
      const ramShared = shareRunning.reduce((a, c) => a + c.ram, 0);
      const ramFree = resources.reduce((a, c) => a + c.ram, 0);
      ns.printf("RAM[h/s/f]: %8s /%8s /%8s",
        ns.formatRam(ramHack),
        ns.formatRam(ramShared), 
        ns.formatRam(ramFree));
    } else {
      ns.print("-".repeat(30));
      ns.printf("%3ds %2dw %2dg %4dh %10dt",
        contexts.length,
        weakenRunning.length,
        growRunning.length,
        contexts.reduce((ca, cc) => ca + cc.batches.length, 0 - weakenRunning.length - growRunning.length),
        contexts.reduce((ca, cc) => ca + cc.batches
          .reduce((ba, bc) => ba + bc.processes
            .reduce((pa, pc) => pa + pc.threads, 0), 0), 0));
            
      const ramHack = contexts
        .reduce((ca, cc) => ca + cc.batches
          .reduce((ba, bc) => ba + bc.processes
            .reduce((pa, pc) => pa + pc.ram, 0), 0), 0);
      const ramShared = shareRunning.reduce((a, c) => a + c.ram, 0);
      const ramFree = resources.reduce((a, c) => a + c.ram, 0);
      ns.printf(" %8sh %8ss %8sf",
        ns.formatRam(ramHack),
        ns.formatRam(ramShared), 
        ns.formatRam(ramFree));
    }

    await ns.sleep(1000);
  }
}