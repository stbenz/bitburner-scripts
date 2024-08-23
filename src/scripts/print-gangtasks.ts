import { NS } from "@ns";

/** @param {NS} ns */
export async function main(ns: NS) {
  ns.tprintf("%-25s %4s %4s %4s %4s %4s %4s %7s %8s %8s %7s %8s %8s %5s %4s", 
    "NAME", "HACK", "STR", "DEF", "DEX", "AGI", "CHA", 
    "MONEY", "RESP", "WANT", "TMONEY", "TRESP", "TWANT", "DIFF", "TYPE");
  ns.tprintf("-".repeat(118));
  for (const t of ns.gang.getTaskNames().map((n) => ns.gang.getTaskStats(n))) {
    ns.tprintf("%-25s %4d %4d %4d %4d %4d %4d %7.2f %8.5f %8.5f %7.2f %8.5f %8.5f %5.1f %4s",
      t.name,
      t.hackWeight, t.strWeight, t.defWeight, t.dexWeight, t.agiWeight, t.chaWeight,
      t.baseMoney, t.baseRespect, t.baseWanted,
      t.territory.money, t.territory.respect, t.territory.wanted,
      t.difficulty,
      (t.isCombat ? "C" : "") + (t.isHacking ? "H" : "")
    );
  }
}