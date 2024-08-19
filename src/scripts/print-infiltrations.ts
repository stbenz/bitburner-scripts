import { NS } from "@ns";

/** @param {NS} ns */
export async function main(ns: NS) {
  const locs = ns.infiltration.getPossibleLocations();

  const green = "\u001b[32m";
  const red = "\u001b[31m";
  const yellow = "\u001b[33m";
  const magenta = "\u001b[35m";
  const reset = "\u001b[0m";

  const difficulties = [
    [green, "Trivial"],
    [yellow, "Normal"],
    [red, "Hard"],
    [magenta, "Impossible"]
  ];

  ns.tprintf("%-10s  %-25s  %-10s  %3s  %9s  %8s", "CITY", "LOCATION", "DIFFICULTY", "LVL", "CASH", "REP");
  ns.tprintf("-".repeat(75));
  for (const i of locs.map((l) => ns.infiltration.getInfiltration(l.name)).sort((a, b) => b.reward.tradeRep - a.reward.tradeRep)) {
    const d = difficulties[Math.floor(i.difficulty)];
    ns.tprintf("%s%-10s  %-25s  %-10s  %3d  %9s  %8s%s", 
      d[0],
      i.location.city, i.location.name,
      d[1],
      i.maxClearanceLevel,
      "$" + ns.formatNumber(i.reward.sellCash),
      ns.formatNumber(i.reward.tradeRep),
      reset);
  }
}