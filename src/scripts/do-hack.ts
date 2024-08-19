import { NS } from "@ns";
import { IHackLogEntry } from "lib/interfaces";

/** @param {NS} ns */
export async function main(ns: NS) {
  if (ns.args.length > 1 && typeof ns.args[1] === "number") {
    await ns.sleep(ns.args[1]);
  }
  if (ns.args.length > 0 && typeof ns.args[0] === "string") {
    const m = await ns.hack(ns.args[0]);
    ns.writePort(100, { ts: Date.now(), server: ns.args[0], money: m } as IHackLogEntry);
  }
}
