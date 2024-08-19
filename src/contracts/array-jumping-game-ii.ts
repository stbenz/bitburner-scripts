import { NS } from '@ns';
import { arrayJumpingGame2 } from 'contracts/array-jumping-game'

/** @param {NS} ns */
export async function main(ns: NS) {
  if (ns.args.length > 0) {
    const res = arrayJumpingGame2(JSON.parse(ns.args[0].toString()));
    ns.tprint(res);
  }
}