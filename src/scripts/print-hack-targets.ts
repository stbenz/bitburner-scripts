import { NS } from '@ns';
import { gainRoot, getAvailableHackTargets } from 'lib/targetlib';

/** @param {NS} ns */
export async function main(ns: NS) {
  // get all servers with root access
  const servers = gainRoot(ns, "home", true);

  // get possible hacking targets with stats
  const targets = getAvailableHackTargets(ns, servers); 

  const cyan = "\u001b[36m";
  const green = "\u001b[32m";
  const red = "\u001b[31m";
  const reset = "\u001b[0m";

  // get min security on all servers
  ns.tprintf("HOSTNAME              MINSEC  CURSEC  REQLVL  CURMONEY  MAXMONEY   CHANCE");
  ns.tprintf("-------------------------------------------------------------------------")
  for (const t of targets) {
    ns.tprintf("%-20s %s%7.2f%s %s%7.2f%s %s%7.2f%s %s%9s%s %s%9s%s %s%8s%s", t.name, 
      cyan, t.minSecurity, reset,
      (t.curSecurity > t.minSecurity ? red : green ), t.curSecurity, reset,
      (t.reqLevel > ns.getHackingLevel() ? red : green ), t.reqLevel, reset,
      (t.maxMoney > t.curMoney ? red : green ), ns.formatNumber(t.curMoney), reset,
      cyan, ns.formatNumber(t.maxMoney), reset,
      (t.chance < 1 ? red : green ), ns.formatPercent(t.chance), reset);
  }
}