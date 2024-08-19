import { NS } from '@ns';
import { gainRoot } from 'lib/targetlib'

/** @param {NS} ns */
export async function main(ns: NS) {
  ns.disableLog("ALL");
  
  let hackTarget = "n00dles";
  if (ns.args.length > 0 && typeof ns.args[0] === "string") {
    hackTarget = ns.args[0];
  }

  if (gainRoot(ns, hackTarget).length) {
    let now = Date.now();
    const t = ns.getWeakenTime(hackTarget);
    let end = now + t;
    let n = Math.ceil((ns.getServerSecurityLevel(hackTarget) - ns.getServerMinSecurityLevel(hackTarget)) / 0.05);
    let p = ns.run("scripts/do-weaken.js", n, hackTarget);
    while (p == 0 && n >= 2) {
      n = Math.floor(n / 2);
      p = ns.run("scripts/do-weaken.js", n, hackTarget);
    }
    if (p == 0) {
      ns.tprintf("failed to start weaken script");
      return;
    }
    await ns.sleep(100);
    while (ns.isRunning(p)) {
      now = Date.now();
      ns.print("estimated time left: " + ns.tFormat(end - now));
      await ns.sleep(1000);
    }
    ns.print("weaken finished");
  } else {
    ns.tprint("can't gain root on " + hackTarget);
  }
}