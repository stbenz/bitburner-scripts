import { NS } from '@ns';
import { compression1RleCompression } from 'contracts/compression'

/** @param {NS} ns */
export async function main(ns: NS) {
  if (ns.args.length > 1) {
    const res = compression1RleCompression(ns.args[0].toString());
    ns.tprint(res);
  }
}