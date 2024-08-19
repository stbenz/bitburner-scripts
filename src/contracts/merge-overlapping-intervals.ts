import { NS } from "@ns";

/**
 * solve Merge Overlapping Intervals
 * 
 * @param {[number,number][]} data the contract data
 * @return {[number,number][]} the contract answer
 */
export function mergeOverlappingIntervals(data: [number,number][]): [number,number][] {
  // sort
  data = data.sort(([x1], [x2]) => x1 - x2);

  let p = 0;
  while (p < data.length - 1) {
    let overlapping = [];
    let other = [];
    for (let i = p + 1; i < data.length; i++) {
      if ((data[i][0] <= data[p][1] && data[i][1] >= data[p][0])) {
        overlapping.push(data[i]);
      } else {
        other.push(data[i]);
      }
    }
    if (overlapping.length) {
      overlapping.push(data[p]);
      data = data.slice(0, p)
        .concat([[
          Math.min(...overlapping.map((e) => e[0])),
          Math.max(...overlapping.map((e) => e[1]))
        ]])
        .concat(other);
    } else {
      p++;
    }
  }

  return data;
}

/** @param {NS} ns */
export async function main(ns: NS) {
  if (ns.args.length > 0) {
    const res = mergeOverlappingIntervals(JSON.parse(ns.args[0].toString()));
    ns.tprint(res);
  }
}