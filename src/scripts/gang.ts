import { GangGenInfo, GangMemberInfo, GangTaskStats, NS } from "@ns";

// max possible number of members
const MAX_NUM_MEMBERS = 12;

// if all ascension stat multipliers multiplied is larger than this, ascend
const ASCEND_MULT = 30;

// only buy equipment if available money is larger than the equipment cost multiplied by this
const EQUIP_MONEY_MULT = 20;

// gang is powerful enough if power multiplied by this is larget than power of strongest gang
const WARFARE_MIN_WIN_CHANCE = 0.50;

// start lowering wanted level when above this penalty
const WANTED_PENALTY_THRES = 0.95;

// gain respect when below this
const MIN_RESPECT = 100;

// absolute minimum stats sum for small gang (always train below this)
const MIN_STATS_SUM_ABS_SMALL = 300;

// absolute minimum stats sum for big gang (always train below this)
const MIN_STATS_SUM_ABS_BIG = 900;

// relative minimum stats sum factor (start train below this)
const MIN_STATS_SUM_FACTOR = 0.5;

// relative maximum stats sum factor (stop train above this)
const MAX_STATS_SUM_FACTOR = 0.6;

// combat stat weight
const MAIN_STAT_WEIGHT = 100;

// hacking stat weight
const SECONDARY_STAT_WEIGHT = 1.5;

// charisma stat weight
const TETRIARY_STAT_WEIGTH = 1;

const TASK_UNASSIGNED = "Unassigned";
const TASK_WARFARE = "Territory Warfare";
const TASK_VIGILANTE = "Vigilante Justice";
const TASK_ETHICAL = "Ethical Hacking";

const TASK_TRAIN_COMBAT = "Train Combat";
const TASK_TRAIN_HACKING = "Train Hacking";
const TASK_TRAIN_CHARISMA = "Train Charisma";

interface ITrainTask {
  name: string;
  weight: number;
  statlvl: (i: GangMemberInfo) => number;
}

// tail verbosity
const gVerbosity = 0;

const gTrainTasks = [TASK_TRAIN_COMBAT, TASK_TRAIN_HACKING, TASK_TRAIN_CHARISMA];

const gTrainTasksCombat: ITrainTask[] = [
  { name: TASK_TRAIN_COMBAT, weight: MAIN_STAT_WEIGHT, statlvl: (i) => (i.str + i.def + i.dex + i.agi) / 4 },
  { name: TASK_TRAIN_HACKING, weight: SECONDARY_STAT_WEIGHT, statlvl: (i) => i.hack },
  { name: TASK_TRAIN_CHARISMA, weight: TETRIARY_STAT_WEIGTH, statlvl: (i) => i.cha }
];

const gTrainTasksHacking: ITrainTask[] = [
  { name: TASK_TRAIN_COMBAT, weight: SECONDARY_STAT_WEIGHT, statlvl: (i) => (i.str + i.def + i.dex + i.agi) / 4 },
  { name: TASK_TRAIN_HACKING, weight: MAIN_STAT_WEIGHT, statlvl: (i) => i.hack },
  { name: TASK_TRAIN_CHARISMA, weight: TETRIARY_STAT_WEIGTH, statlvl: (i) => i.cha }
];

enum GangTaskType {
  Unassigned = "Unassigned",
  Warfare    = "Warfare",
  Vigilante  = "Justice",
  Train      = "Train",
  Respect    = "Respect",
  Money      = "Money",
}

/**
 * check if member has the upgrade or augmentation
 * 
 * @param ns netscript interface
 * @param member member name
 * @param equip equipment name
 * @returns whether the member has the equipment
 */
function memberHasEquipment(ns: NS, member: string, equip: string): boolean {
  const info = ns.gang.getMemberInformation(member);
  return info.upgrades.includes(equip) || info.augmentations.includes(equip);
}

/**
 * get sum of all gang member stats
 * 
 * @param info gang member info
 * @returns sum of all stats
 */
function memberStatSum(info: GangMemberInfo): number {
  return info.hack + info.str + info.def + info.dex + info.agi + info.cha;
}

/**
 * check if members stat sum is too low compared to max sum
 * 
 * @param info gang member info
 * @param maxStatSum max stat sum
 * @returns whether the member is too weak
 */
function isMemberTooWeak(ns: NS, info: GangMemberInfo, maxStatSum: number): boolean {
  const s = memberStatSum(info);
  return s < (ns.gang.getMemberNames().length <= 6 ? MIN_STATS_SUM_ABS_SMALL : MIN_STATS_SUM_ABS_BIG) || s < MIN_STATS_SUM_FACTOR * maxStatSum;
}

/**
 * check if members stat sum is high enough compared to max sum
 * 
 * @param info gang member info
 * @param maxStatSum max stat sum
 * @returns whether the member is strong enough
 */
function isMemberStrongEnough(ns: NS, info: GangMemberInfo, maxStatSum: number): boolean {
  const s = memberStatSum(info);
  return s > (ns.gang.getMemberNames().length <= 6 ? MIN_STATS_SUM_ABS_SMALL : MIN_STATS_SUM_ABS_BIG) && s > MAX_STATS_SUM_FACTOR * maxStatSum;
}

/**
 * check if gang power is high enough compared to other gangs
 * 
 * @param ns netscript interface
 * @param gi gang info
 * @returns whether gang power is high enough
 */
function isGangStrongEnough(ns: NS, gi: GangGenInfo) {
  return Object.entries(ns.gang.getOtherGangInformation()).every(([n]) => n == gi.faction || ns.gang.getChanceToWinClash(n) > WARFARE_MIN_WIN_CHANCE);
}

/**
 * find the best training task to perform for a member
 * 
 * @param ns netscript interface
 * @param gi gang info
 * @param gmi gang member info
 * @returns name of task to train
 */
function getBestTrainTask(ns: NS, gi: GangGenInfo, gmi: GangMemberInfo): string {
  let newTask: string|null = null;
  const trainTasks = gi.isHacking ? gTrainTasksHacking : gTrainTasksCombat;

  // if current task is training and stat level hasn't reached stat level of training task with highest weight
  // continue doing that training task
  const curTask = trainTasks.find((t) => t.name == gmi.task);
  if (curTask) {
    const maxWeightTask = trainTasks.sort((t1, t2) => t2.weight - t1.weight).at(0)!;
    if (curTask.name != maxWeightTask.name && curTask.statlvl(gmi) / Math.sqrt(curTask.weight) < maxWeightTask.statlvl(gmi) / Math.sqrt(maxWeightTask.weight)) {
      newTask = curTask.name;
    }
  }

  // find training task for lowest weighted stats
  if (newTask === null) {
    const lowestTask = trainTasks.sort((t1, t2) => t1.statlvl(gmi) / t1.weight - t2.statlvl(gmi) / t2.weight).at(0)!;
    newTask = lowestTask.name;
  }

  return newTask;
}

/**
 * find the best task to generate respect for a member
 * 
 * @param ns netscript interface
 * @param gi gang info
 * @param gmi gang member info
 * @returns the task that generates the most respect when done by the member
 */
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
      const g = Math.max(0, memberStatSum(gmi) / 30 - ts.difficulty) * ts.baseRespect;
      if (g > max) {
        max = g;
        newTask = tn;
      }
    });
  }
  return newTask;
}

/**
 * find the best task to generate money for a member
 * 
 * @param ns netscript interface
 * @param gi gang info
 * @param gmi gang member info
 * @returns the task that generates the most money when done by the member
 */
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
      const g = Math.max(0, memberStatSum(gmi) / 30 - ts.difficulty) * ts.baseMoney;
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
  ns.setTitle("GANG");

  let taskType: GangTaskType = GangTaskType.Respect;

  // wait until in a gang
  if (!ns.gang.inGang()) {
    ns.print("ERROR: not in a gang");
    return;
  }

  while (true) {
    // get current member list
    let members = ns.gang.getMemberNames();

    // add members if possible
    while (ns.gang.canRecruitMember()) {
      const newMember = ns.sprintf("gm-%02d", members.length);
      if (ns.gang.recruitMember(newMember)) {
        members.push(newMember);
        if (gVerbosity > 0) {
          ns.print(`INFO: recruited member "${newMember}"`);
        }
      }
    }

    // ascend members
    for (const m of members) {
      const ar = ns.gang.getAscensionResult(m);
      if (ar && ar.hack * ar.str * ar.def * ar.dex * ar.agi * ar.cha > ASCEND_MULT) {
        if (ns.gang.ascendMember(m) && gVerbosity > 0) {
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
          if (gVerbosity > 0) {
            ns.print(`INFO: purchased "${e}" for "${member}"`);
          }
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
    if (gangInfo.respect < MIN_RESPECT) {
      taskType = GangTaskType.Respect;
    } else if (gangInfo.wantedPenalty < WANTED_PENALTY_THRES && gangInfo.wantedLevel > 1) {
      // wanted penalty too high, do vigilante justice
      taskType = GangTaskType.Vigilante;
    } else {
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
      if (isMemberTooWeak(ns, i, maxStatSum)) {
        // train if member too weak
        task = getBestTrainTask(ns, gangInfo, i);
      } else if (isMemberStrongEnough(ns, i, maxStatSum) || !gTrainTasks.includes(task)) {
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
            task = gangInfo.isHacking ? TASK_ETHICAL : TASK_VIGILANTE;
            break;
        }
      }
      if (task != i.task) {
        if (ns.gang.setMemberTask(m, task) && gVerbosity > 0) {
          ns.print(`INFO: switch task for "${m}" to "${task}"`);
        }
      }
    }

    ns.printf("t: %-7s %8s  %9s", taskType, 
      ns.formatPercent(gangInfo.territory), 
      "$" + ns.formatNumber(gangInfo.moneyGainRate * 5));

    // wait for next update
    if (ns.gang.getBonusTime() > 0) {
      await ns.sleep(1000);
    } else {
      await ns.gang.nextUpdate();
    }
  }
}