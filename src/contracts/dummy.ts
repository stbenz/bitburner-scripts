import { NS } from '@ns';
import { solveContract } from 'contracts/solve';

/** @param {NS} ns */
export async function main(ns: NS) {
  if (ns.args.length > 0) {
    const f = ns.codingcontract.createDummyContract(ns.args[0].toString());
    if (!solveContract(ns, f, ns.getHostname())) {
      //ns.rm(f);
    }
  }
}