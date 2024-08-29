import { NS } from "@ns";

const gCorpName = "CORPA";
const gAggricultureDivision = "AGRIC";

/** @param {NS} ns */
export async function main(ns: NS) {
  ns.corporation.expandCity(gAggricultureDivision, ns.enums.CityName.Aevum);
  ns.corporation.expandCity(gAggricultureDivision, ns.enums.CityName.Volhaven);
  ns.corporation.expandCity(gAggricultureDivision, ns.enums.CityName.Chongqing);
  ns.corporation.expandCity(gAggricultureDivision, ns.enums.CityName.NewTokyo);
  ns.corporation.expandCity(gAggricultureDivision, ns.enums.CityName.Ishima);
}