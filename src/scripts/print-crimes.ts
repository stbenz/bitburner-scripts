import { CrimeType, NS } from '@ns';
import { gainRoot } from 'lib/targetlib';

/** @param {NS} ns */
export async function main(ns: NS) {
  const cyan = "\u001b[36m";
  const reset = "\u001b[0m";

  ns.tprintf("%-20s %7s %7s %9s %8s %8s", "CRIME", "CHANCE", "TIME", "MONEY/s", "KARMA/s", "KILLS/s");
  ns.tprintf("=".repeat(63));
  for (const c in ns.enums.CrimeType) {
    const chance = ns.singularity.getCrimeChance(c as CrimeType);
    const stats = ns.singularity.getCrimeStats(c as CrimeType);
    ns.tprintf("%-20s %7s %6.1fs %9s %8s %8s", stats.type,
      ns.formatPercent(chance), stats.time / 1000, 
      "$" + ns.formatNumber(stats.money / stats.time * 1000), 
      ns.formatNumber(stats.karma / stats.time * 1000), 
      ns.formatNumber(stats.kills / stats.time * 1000));
  }
}