import { NS } from '@ns';
import { hammingCodesIntegerToEncodedBinary } from 'contracts/hamming-codes';


/** @param {NS} ns */
export async function main(ns: NS) {
  if (ns.args.length > 0 && typeof ns.args[0] === "number") {
    const res = hammingCodesIntegerToEncodedBinary(ns.args[0]);
    ns.tprint(res);
  }
}