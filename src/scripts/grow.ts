import { NS } from '@ns';
import { gainRoot } from 'lib/targetlib';

/** @param {NS} ns */
export async function main(ns: NS) {
  ns.disableLog("ALL");
  
  let hackTarget = "n00dles";
  if (ns.args.length > 0 && typeof ns.args[0] === "string") {
    hackTarget = ns.args[0];
  }

  let runTarget = "home";
  if (ns.args.length > 1 && typeof ns.args[1] === "string") {
    runTarget = ns.args[1];
  }

  if (!gainRoot(ns, hackTarget).length) {
    ns.tprint("can't gain root on " + hackTarget);
    return;
  }
  
  if (runTarget != "home" && !gainRoot(ns, runTarget).length) {
    ns.tprint("can't gain root on " + runTarget);
    return;
  }
  
  let now = Date.now();
  const t = ns.getGrowTime(hackTarget);
  let end = now + t;
  let n = Math.ceil(ns.growthAnalyze(hackTarget, ns.getServerMaxMoney(hackTarget) / Math.max(1, ns.getServerMoneyAvailable(hackTarget))));
  if (!ns.fileExists("scripts/do-grow.js", runTarget)) {
    ns.scp("scripts/do-grow.js", runTarget);
  }
  let p = ns.exec("scripts/do-grow.js", runTarget, n, hackTarget);
  while (p == 0 && --n >= 1) {
    p = ns.exec("scripts/do-grow.js", runTarget, n, hackTarget);
  }
  if (p == 0) {
    ns.tprintf("failed to start grow script");
    return;
  }
  await ns.sleep(100);
  while (ns.isRunning(p)) {
    now = Date.now();
    ns.print("estimated time left: " + ns.tFormat(end - now));
    await ns.sleep(1000);
  }
  ns.print("grow finished");
}