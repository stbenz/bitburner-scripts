import { NS } from '@ns';
import { algorithmicStockTrader4 } from 'contracts/algorithmic-stock-trader';

/** @param {NS} ns */
export async function main(ns: NS) {
  if (ns.args.length > 0) {
    const res = algorithmicStockTrader4(JSON.parse(ns.args[0].toString()));
    ns.tprint(res);
  }
}