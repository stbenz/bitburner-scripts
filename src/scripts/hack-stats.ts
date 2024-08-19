import { NS } from "@ns";
import { IHackLogEntry } from "/lib/interfaces";

/** @param {NS} ns */
export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.setTitle("HACKING $/s");
  let port = ns.getPortHandle(100);
  let start = Date.now();
  let logs = new Array<IHackLogEntry>();
  let targets = new Array<string>();
  while (true) {
    while (!port.empty()) {
      let data = port.read() as IHackLogEntry;
      logs.push(data);
      if (!targets.includes(data.server)) {
        targets.push(data.server);
      }
    }

    let now = Date.now();
    if (now - start > 5000) {
      logs = logs.filter((l) => l.ts > now - 300000);
      const stats: {[index: string]: number} = {};
      let sum = 0;
      for (const t of targets.sort()) {
        stats[t] = 0;
      }
      for (const l of logs) {
        stats[l.server] += l.money;
        sum += l.money;
      }
      ns.print("-".repeat(30));
      for (const [s, m] of Object.entries(stats).sort(
        ([s1, m1], [s2, m2]) =>  (m1 == m2) ? 0 : (m1 > m2) ? -1 : 1
      )) {
        ns.printf("%-19s %10s", s, "$" + ns.formatNumber(m / 300));
      }
      ns.printf("%-19s %10s", "===== SUM =====", "$" + ns.formatNumber(sum / 300));
      start = now;
    }

    await port.nextWrite();
  }
}