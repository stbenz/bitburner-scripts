import { NS } from "@ns";

const gCorpName = "CORPA";
const gAggricultureDivision = "AGRIC";

/** @param {NS} ns */
export async function main(ns: NS) {
  ns.corporation.upgradeOfficeSize(gAggricultureDivision, ns.enums.CityName.Sector12, 1);
  ns.corporation.upgradeOfficeSize(gAggricultureDivision, ns.enums.CityName.Aevum, 1);
  ns.corporation.upgradeOfficeSize(gAggricultureDivision, ns.enums.CityName.Volhaven, 1);
  ns.corporation.upgradeOfficeSize(gAggricultureDivision, ns.enums.CityName.Chongqing, 1);
  ns.corporation.upgradeOfficeSize(gAggricultureDivision, ns.enums.CityName.NewTokyo, 1);
  ns.corporation.upgradeOfficeSize(gAggricultureDivision, ns.enums.CityName.Ishima, 1);
}