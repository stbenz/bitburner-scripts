import { NS } from "@ns";

/** @param {NS} ns */
export async function main(ns: NS) {
  let target = 100;
  if (ns.args.length > 0 && typeof ns.args[0] === "number") {
    target = ns.args[0];
  }

  ns.singularity.travelToCity("Sector-12");
  ns.singularity.gymWorkout("Powerhouse Gym", "Strength");
  while (ns.getPlayer().skills.strength < target) {
    await ns.sleep(10000);
  }

  ns.singularity.travelToCity("Sector-12");
  ns.singularity.gymWorkout("Powerhouse Gym", "Defense");
  while (ns.getPlayer().skills.defense < target) {
    await ns.sleep(10000);
  }

  ns.singularity.travelToCity("Sector-12");
  ns.singularity.gymWorkout("Powerhouse Gym", "Dexterity");
  while (ns.getPlayer().skills.dexterity < target) {
    await ns.sleep(10000);
  }

  ns.singularity.travelToCity("Sector-12");
  ns.singularity.gymWorkout("Powerhouse Gym", "Agility");
  while (ns.getPlayer().skills.agility < target) {
    await ns.sleep(10000);
  }

  ns.singularity.stopAction();
}