import { NS } from "@ns";

/** @param {NS} ns */
export async function main(ns: NS) {
  for (const t of ns.codingcontract.getContractTypes()) {
    ns.tprintf(t);
  }
}