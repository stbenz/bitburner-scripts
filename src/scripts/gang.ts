import { GangGenInfo, GangMemberInfo, GangTaskStats, NS } from "@ns";

// max possible number of members
const MAX_NUM_MEMBERS = 12;

// if all ascension stat multipliers multiplied is larger than this, ascend
const ASCEND_MULT = 30;

// only buy equipment if available money is larger than the equipment cost multiplied by this
const EQUIP_MONEY_MULT = 10;

// gang is powerful enough if power multiplied by this is larget than power of strongest gang
const WARFARE_MIN_WIN_CHANCE = 0.65;

// start lowering wanted level when above this penalty
const WANTED_PENALTY_THRES_HIGH = 0.95;

// stop lowering wanted level when below this penalty
const WANTED_PENALTY_THRES_LOW = 0.99;

// absolute minimum stats sum (always train below this)
const MIN_STATS_SUM_ABS = 300;

// relative minimum stats sum factor (start train below this)
const MIN_STATS_SUM_FACTOR = 0.6;

// relative maximum stats sum factor (stop train above this)
const MAX_STATS_SUM_FACTOR = 0.7;

// combat stat weight
const COMBAT_STAT_WEIGHT = 10;

// hacking stat weight
const HACKING_STAT_WEIGHT = 1.2;

// charisma stat weight
const CHARISMA_STAT_WEIGTH = 1;

const TASK_UNASSIGNED = "Unassigned";
const TASK_WARFARE = "Territory Warfare";
const TASK_VIGILANTE = "Vigilante Justice";

interface ITrainTask {
  name: string;
  weight: number;
  statlvl: (i: GangMemberInfo) => number;
}

const gTrainTasksCombat: ITrainTask[] = [
  { name: "Train Combat", weight: COMBAT_STAT_WEIGHT, statlvl: (i) => (i.str + i.def + i.dex + i.agi) / 4 },
  { name: "Train Hacking", weight: HACKING_STAT_WEIGHT, statlvl: (i) => i.hack },
  { name: "Train Charisma", weight: CHARISMA_STAT_WEIGTH, statlvl: (i) => i.cha }
];

enum GangTaskType {
  Unassigned,
  Warfare,
  Vigilante,
  Train,
  Respect,
  Money,
}

function memberHasEquipment(ns: NS, member: string, equip: string): boolean {
  const info = ns.gang.getMemberInformation(member);
  return info.upgrades.includes(equip) || info.augmentations.includes(equip);
}

function memberStatSum(info: GangMemberInfo): number {
  return info.hack + info.str + info.def + info.dex + info.agi + info.cha;
}

function isMemberTooWeak(info: GangMemberInfo, maxStatSum: number): boolean {
  const s = memberStatSum(info);
  return s < MIN_STATS_SUM_ABS || s < MIN_STATS_SUM_FACTOR * maxStatSum;
}

function isMemberStrongEnough(info: GangMemberInfo, maxStatSum: number): boolean {
  const s = memberStatSum(info);
  return s > MIN_STATS_SUM_ABS && s > MAX_STATS_SUM_FACTOR * maxStatSum;
}

function isGangStrongEnough(ns: NS, gi: GangGenInfo) {
  return Object.entries(ns.gang.getOtherGangInformation()).every(([n]) => n == gi.faction || ns.gang.getChanceToWinClash(n) > WARFARE_MIN_WIN_CHANCE);
}

function getBestTrainTask(info: GangMemberInfo): string {
  let newTask: string|null = null;

  // if current task is training and stat level hasn't reached stat level of training task with highest weight
  // continue doing that training task
  const curTask = gTrainTasksCombat.find((t) => t.name == info.task);
  if (curTask) {
    const maxWeightTask = gTrainTasksCombat.sort((t1, t2) => t2.weight - t1.weight).at(0)!;
    if (curTask.name != maxWeightTask.name && curTask.statlvl(info) / Math.sqrt(curTask.weight) < maxWeightTask.statlvl(info) / Math.sqrt(maxWeightTask.weight)) {
      newTask = curTask.name;
    }
  }

  // find training task for lowest weighted stats
  if (newTask === null) {
    const lowestTask = gTrainTasksCombat.sort((t1, t2) => t1.statlvl(info) / t1.weight - t2.statlvl(info) / t2.weight).at(0)!;
    newTask = lowestTask.name;
  }

  return newTask;
}

function getBestRespectTask(ns: NS, gi: GangGenInfo, gmi: GangMemberInfo): string {
  let newTask = TASK_WARFARE;
  const tasks = ns.gang.getTaskNames().map((t): [string,GangTaskStats] => [t, ns.gang.getTaskStats(t)]);
  if (ns.fileExists("FORMULAS.exe", "home")) {
    // use formulas interface to exactly get best task to gain respect
    let max = 0;
    tasks.forEach(([tn, ts]) => {
      const g = ns.formulas.gang.respectGain(gi, gmi, ts);
      if (g > max) {
        max = g;
        newTask = tn;
      }
    });
  } else {
    // use simplified formula to get best task to gain respect
    let max = 0;
    tasks.forEach(([tn, ts]) => {
      const g = Math.max(0, memberStatSum(gmi) / 6 - ts.difficulty) * ts.baseRespect;
      if (g > max) {
        max = g;
        newTask = tn;
      }
    });
  }
  return newTask;
}

function getBestMoneyTask(ns: NS, gi: GangGenInfo, gmi: GangMemberInfo): string {
  let newTask = TASK_WARFARE;
  const tasks = ns.gang.getTaskNames().map((t): [string,GangTaskStats] => [t, ns.gang.getTaskStats(t)]);
  if (ns.fileExists("FORMULAS.exe", "home")) {
    // use formulas interface to exactly get best task to gain money
    let max = 0;
    tasks.forEach(([tn, ts]) => {
      const g = ns.formulas.gang.moneyGain(gi, gmi, ts);
      if (g > max) {
        max = g;
        newTask = tn;
      }
    });
  } else {
    // use simplified formula to get best task to gain money
    let max = 0;
    tasks.forEach(([tn, ts]) => {
      const g = Math.max(0, memberStatSum(gmi) / 6 - ts.difficulty) * ts.baseMoney;
      if (g > max) {
        max = g;
        newTask = tn;
      }
    });
  }
  return newTask;
}

/** @param {NS} ns */
export async function main(ns: NS) {
  ns.disableLog("ALL");

  let taskType: GangTaskType = GangTaskType.Vigilante;

  // wait until in a gang
  while (!ns.gang.inGang()) {
    ns.print("ERROR: not in a gang");
    await ns.sleep(60000);
  }

  while (true) {
    // get current member list
    let members = ns.gang.getMemberNames();

    // add members if possible
    while (ns.gang.canRecruitMember()) {
      const newMember = ns.sprintf("gm-%02d", members.length);
      if (ns.gang.recruitMember(newMember)) {
        ns.print(`INFO: recruited member "${newMember}"`);
        members.push(newMember);
      }
    }

    // ascend members
    for (const m of members) {
      const ar = ns.gang.getAscensionResult(m);
      if (ar && ar.hack * ar.str * ar.def * ar.dex * ar.agi * ar.cha > ASCEND_MULT) {
        if (ns.gang.ascendMember(m)) {
          ns.print(`INFO: ascended member "${m}"`);
        }
      }
    }

    // buy equipment
    let money = ns.getServerMoneyAvailable("home");
    for (const e of ns.gang.getEquipmentNames()) {
      const ec = ns.gang.getEquipmentCost(e);
      while (money > ec * EQUIP_MONEY_MULT) {
        const member = members.find((m) => !memberHasEquipment(ns, m, e));
        if (!member)
          break;
        if (ns.gang.purchaseEquipment(member, e)) {
          ns.print(`INFO: purchased "${e}" for "${member}"`);
          money -= ec;
        }
      }
    }

    // get gang info
    const gangInfo = ns.gang.getGangInformation();

    // check if powerful enough for gang warfare
    const powerfulEnough = isGangStrongEnough(ns, gangInfo);
    ns.gang.setTerritoryWarfare(powerfulEnough);

    // get highest member stat sum
    const maxStatSum = Math.max(...members.map((m) => memberStatSum(ns.gang.getMemberInformation(m))));

    // decide general gang task
    if (gangInfo.wantedPenalty < WANTED_PENALTY_THRES_HIGH) {
      // wanted penalty too high, do vigilante justice
      taskType = GangTaskType.Vigilante;
    } else if (gangInfo.wantedPenalty > WANTED_PENALTY_THRES_LOW) {
      // wanted penalty low enough, do other task
      if (members.length < MAX_NUM_MEMBERS) {
        // maximum number of members not reached, gain respect
        taskType = GangTaskType.Respect;
      } else if (!powerfulEnough) {
        // not powerful enough, engage in warfare to gain power
        taskType = GangTaskType.Warfare;
      } else {
        // gain money
        taskType = GangTaskType.Money;
      }
    }

    // assign member tasks
    for (const m of members) {
      const i = ns.gang.getMemberInformation(m);
      let task = i.task;
      if (isMemberTooWeak(i, maxStatSum)) {
        // train if member too weak
        task = getBestTrainTask(i);
      } else if (isMemberStrongEnough(i, maxStatSum)) {
        // do general task type if strong enough
        switch (taskType) {
          case GangTaskType.Respect:
            task = getBestRespectTask(ns, gangInfo, i);
            break;
          case GangTaskType.Warfare:
            task = TASK_WARFARE;
            break;
          case GangTaskType.Money:
            task = getBestMoneyTask(ns, gangInfo, i);
            break;
          case GangTaskType.Vigilante:
            task = TASK_VIGILANTE;
            break;
        }
      }
      if (task != i.task) {
        if (ns.gang.setMemberTask(m, task)) {
          ns.print(`switch task for "${m}" to "${task}"`);
        }
      }
    }

    // wait for next update
    if (ns.gang.getBonusTime() > 0) {
      await ns.sleep(1000);
    } else {
      await ns.gang.nextUpdate();
    }
  }
}