import { NS } from "@ns";

/** @param {NS} ns */
export async function main(ns: NS) {
  const servers = ["home", ...ns.getPurchasedServers()];
  
  const cyan = "\u001b[36m";
  const green = "\u001b[32m";
  const red = "\u001b[31m";
  const yellow = "\u001b[33m";
  const reset = "\u001b[0m";

  ns.tprintf("%-20s%9s%9s%9s", "HOSTNAME", "TOTAL", "FREE", "USED")
  ns.tprintf("-".repeat(20+9+9+9));
  for (const s of servers) {
    const maxRam = ns.getServerMaxRam(s);
    const usedRam = ns.getServerUsedRam(s);
    const freeRam = maxRam - usedRam;
    const ramColor = (freeRam / maxRam) < 0.1 ? red : (freeRam / maxRam) < 0.5 ? yellow : green;
    ns.tprintf("%-20s %s%8s%s %s%8s%s %s%8s%s", s,
      cyan, ns.formatRam(maxRam), reset,
      ramColor, ns.formatRam(freeRam), reset,
      ramColor, ns.formatRam(usedRam), reset);
  }
}