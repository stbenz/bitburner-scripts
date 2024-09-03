import { NS, ScriptArg } from "@ns";
import { IResource, IHackTarget, IProcess, INetworkTree } from "lib/interfaces";

/**
 * gain root on target and optionally all targets reachable from target recursively
 * 
 * @param {NS} ns netscript interface
 * @param {string} target the target to gain root on
 * @param {boolean} recursive whether to gain root recursively on siblings of the target
 * @param {string|null} parent the parent of the target to exclude from siblings
 * @return {string[]} list of targets with root access
 */
export function gainRoot(ns: NS, target: string, recursive = false, parent: string|null = null) : string[] {
  let targets = new Array<string>();

  // check for root access
  let hasRoot = ns.hasRootAccess(target);
  
  // get number of ports required for root access
  let numPortsReq = ns.getServerNumPortsRequired(target);

  // don't include "home" in returned list
  if (target != "home") {
    // gain root access if required
    if (!hasRoot) {
      // 5 ports requires SQLInject.exe
      if (numPortsReq == 5 && ns.fileExists("SQLInject.exe", "home")) {
        ns.sqlinject(target);
        numPortsReq--;
      }

      // 4 ports requires HTTPWorm.exe
      if (numPortsReq == 4 && ns.fileExists("HTTPWorm.exe", "home")) {
        ns.httpworm(target);
        numPortsReq--;
      }

      // 3 ports requires relaySMTP.exe
      if (numPortsReq == 3 && ns.fileExists("relaySMTP.exe", "home")) {
        ns.relaysmtp(target);
        numPortsReq--;
      }

      // 2 ports requires FTPCrack.exe
      if (numPortsReq == 2 && ns.fileExists("FTPCrack.exe", "home")) {
        ns.ftpcrack(target);
        numPortsReq--;
      }

      // 1 port requires BruteSSH.exe
      if (numPortsReq == 1 && ns.fileExists("BruteSSH.exe", "home")) {
        ns.brutessh(target);
        numPortsReq--;
      }

      // gain root through NUKE.exe
      if (numPortsReq == 0 && ns.fileExists("NUKE.exe", "home") && 
          ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(target)) {
        ns.nuke(target);
        hasRoot = true;
      }
    }

    if (hasRoot) {
      // add target to result
      targets.push(target);
    }
  }

  if (recursive) {
    // find neighbors of target with parent filtered out
    let neighbors = ns.scan(target).filter((n) => n != parent);

    // recursively gain root on neighbors
    for (const n of neighbors) {
      targets = targets.concat(gainRoot(ns, n, recursive, target));
    }
  }

  return targets;
}

/**
 * get available resources of servers
 * 
 * filters out servers without RAM and sorts them by RAM ascending
 * 
 * @param {NS} ns netscript interface
 * @param {string[]} servers list of server names
 * @param {number} homeRamFactor how much RAM of "home" should be used
 * @return {IResource[]} list of availabel resources
 */
export function getAvailableResources(ns: NS, servers: string[], homeRamFactor = 0.5): IResource[] {
  let res = servers
    .map((s): IResource => ({ 
      name: s,
      ram: ns.getServerMaxRam(s) - ns.getServerUsedRam(s)
    }))
    .filter((s) => s.ram > 0)
    .sort((a, b) => a.ram - b.ram);
  res.push({
    name: 'home',
    ram: ns.getServerMaxRam('home') * homeRamFactor - ns.getServerUsedRam('home')
  });
  return res;
}

/**
 * get hack targets with various properties
 * 
 * filters out servers with required hacking level higher
 * than players hacking level and servers without money
 * 
 * @param {NS} ns netscript interface
 * @param {string[]} servers list of server names
 * @return {IHackTarget[]} list of available hack targets
 */
export function getAvailableHackTargets(ns: NS, servers: string[]): IHackTarget[] {
  let res = servers
    .map((s): IHackTarget => ({ 
      name: s,
      chance: ns.hackAnalyzeChance(s),
      minSecurity: ns.getServerMinSecurityLevel(s),
      curSecurity: ns.getServerSecurityLevel(s),
      maxMoney: ns.getServerMaxMoney(s),
      curMoney: ns.getServerMoneyAvailable(s),
      reqLevel: ns.getServerRequiredHackingLevel(s)
    }))
    .filter((s) => s.reqLevel <= ns.getHackingLevel() && s.maxMoney > 0);
  return res;
}

/**
 * start script threads on suitable server and 
 * update resource for server on which the script was started
 * 
 * @param {NS} ns netscript interface
 * @param {IResource[]} resources resources as returned by getAvailableResources
 * @param {string} script the script to start
 * @param {number} numThreads number of threads
 * @param {...ScriptArg[]} scriptArgs arguments for script
 * @return {IProcess|null} information about started process or null in case of error
 */
export function startScriptThreads(ns: NS, resources: IResource[], script: string, numThreads: number, ...scriptArgs: ScriptArg[]): IProcess|null {
  // get required RAM to run numThreads of script
  const scriptRam = ns.getScriptRam(script) * numThreads;

  // get suitable servers sorted by RAM ascending
  const suitable = resources
    .filter((s) => s.ram >= scriptRam)
    .sort((a, b) => a.ram - b.ram);
  
  if (suitable.length > 0) {
    const tgt = suitable[0];
    if (!ns.fileExists(script, tgt.name)) {
      ns.scp(script, tgt.name);
    }
    const p = ns.exec(script, tgt.name, numThreads, ...scriptArgs);
    if (p != 0) {
      tgt.ram -= scriptRam;
      return {
        pid: p,
        server: tgt.name,
        ram: scriptRam,
        threads: numThreads
      };
    }
  }

  return null;
}

/**
 * build a network tree
 * 
 * @param {NS} ns netscript interface
 * @param {string} start the target to start from
 * @param {number} maxDepth the max recursion depth (-1 for infinite)
 * @param {string} parent the parent of the start target to exclude from siblings
 * @param {number} depth the current depth
 * @return {INetworkTree} the network tree
 */
export function networkTree(ns: NS, start: string, maxDepth = -1, parent: string|null = null, depth = 0) {
  const children = new Array<INetworkTree>();
  
  // find neighbors of target with parent filtered out
  // and call networkTree recursively
  if (maxDepth == -1 || depth < maxDepth) {
    children.push(...ns.scan(start)
      .filter((n) => n != parent)
      .map((s) => networkTree(ns, s, maxDepth, start, depth + 1)));
  }

  return {
    name: start,
    children: children
  };
}
