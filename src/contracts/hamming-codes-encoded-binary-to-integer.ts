import { NS } from '@ns';
import { hammingCodesEncodedBinaryToInteger } from 'contracts/hamming-codes';

/** @param {NS} ns */
export async function main(ns: NS) {
  if (ns.args.length > 0) {
    const res = hammingCodesEncodedBinaryToInteger(ns.args[0].toString());
    ns.tprint(res);
  }
}