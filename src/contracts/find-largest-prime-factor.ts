import { NS } from "@ns";

/**
 * solve Find Largest Prime Factor
 * 
 * @param {number} data the contract data
 * @return {number} the contract answer
 */
export function findLargestPrimeFactor(data: number): number {
  const factors = [];
  let d = 2;
  while (data > 1) {
    while (data % d == 0) {
      factors.push(d);
      data /= d;
    }
    d++;
  }
  return Math.max(...factors);
}

/** @param {NS} ns */
export async function main(ns: NS) {
  if (ns.args.length > 0 && typeof ns.args[0] === "number") {
    const res = findLargestPrimeFactor(ns.args[0]);
    ns.tprint(res);
  }
}