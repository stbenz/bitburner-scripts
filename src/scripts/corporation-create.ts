import { NS } from "@ns";

const gCorpName = "CORPA";
const gAggricultureDivision = "AGRIC";

/** @param {NS} ns */
export async function main(ns: NS) {
  ns.corporation.createCorporation(gCorpName, false);
}