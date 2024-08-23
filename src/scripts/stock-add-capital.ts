import { NS } from "@ns";

/** @param {NS} ns */
export async function main(ns: NS) {
  let capital = 0;
  if (ns.args.length > 0) {
    if (typeof ns.args[0] === "number") {
      capital = Math.round(ns.args[0]);
    } else if (typeof ns.args[0] === "string") {
      capital = parseInt(ns.args[0]);
    }
  }
  if (capital > 0) {
    ns.writePort(200, capital);
  }
}