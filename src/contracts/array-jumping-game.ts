import { NS } from "@ns";

/**
 * solve Array Jumping Game
 * 
 * @param {number[]} data the contract data
 * @return 0|1 the contract answer
 */
export function arrayJumpingGame(data: number[]): 0|1 {
  let toCheck = [data];
  while (toCheck.length > 0) {
    const c = toCheck.shift()!;
    for (let i = 1; i <= c[0]; i++) {
      if (i == c.length - 1) {
        return 1;
      }
      if (c[i] != 0) {
        toCheck.push(c.slice(i));
      }
    }
  }

  return 0;
}

/**
 * solve Array Jumping Game II
 * 
 * @param {number[]} data the contract data
 * @return {number}] the contract answer
 */
export function arrayJumpingGame2(data: number[]): number {
  let toCheck: [[number, number[]]] = [[0, data]];
  const jumps = [];
  while (toCheck.length > 0) {
    const [j, c] = toCheck.shift()!;
    if (jumps.length > 0 && j >= Math.min(...jumps)) {
      break;
    }
    for (let i = 1; i <= c[0]; i++) {
      if (i == c.length - 1) {
        jumps.push(j + 1);
        break;
      }
      if (c[i] != 0) {
        toCheck.push([j + 1, c.slice(i)]);
      }
    }
  }

  return jumps.length > 0 ? Math.min(...jumps) : 0;
}

/** @param {NS} ns */
export async function main(ns: NS) {
  if (ns.args.length > 0) {
    const res = arrayJumpingGame(JSON.parse(ns.args[0].toString()));
    ns.tprint(res);
  }
}