import { NS } from "@ns";

/** @param {NS} ns */
export async function main(ns: NS) {
  if (ns.args.length > 1 && typeof ns.args[1] === "number") {
    await ns.sleep(ns.args[1]);
  }
  if (ns.args.length > 0 && typeof ns.args[0] === "string") {
    await ns.grow(ns.args[0]);
  }
}
