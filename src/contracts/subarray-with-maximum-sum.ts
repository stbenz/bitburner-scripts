import { NS } from "@ns";

/**
 * solve Subarray With Maximum Sum
 * 
 * @param {number[]} data the contract data
 * @return {number} the contract answer
 */
export function subarrayWithMaximumSum(data: number[]): number {
  let max = Number.NEGATIVE_INFINITY;
  let l = data.length;
  while (l > 0) {
    for (let i = 0; i < data.length - l; i++) {
      let sum = data.slice(i, i + l).reduce((a, c) => a + c, 0);
      if (sum > max) {
        max = sum;
      }
    }
    l--;
  }
  return max;
}

/** @param {NS} ns */
export async function main(ns: NS) {
  if (ns.args.length > 0) {
    const res = subarrayWithMaximumSum(JSON.parse(ns.args[0].toString()));
    ns.tprint(res);
  }
}