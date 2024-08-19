import { NS } from "@ns";

/**
 * solve Proper 2-Coloring Of A Graph
 * 
 * @param {[number,[number,number][]]} data the contract data
 * @return {number[]} the contract answer
 */
export function proper2ColoringOfAGraph(data: [number,[number,number][]]): number[] {
  let res = Array(data[0]).fill(-1);
  //let sorted = data[1].sort((x, y) => data[1].filter(([a, b]) => a == y || b == y).length - data[1].filter(([a, b]) => a == x || b == x).length)
  let indices = new Array<number>();
  let indexCount = new Array<number>();
  for (let i = 0; i < data[0]; i++) {
    indices.push(i);
    indexCount[i] = data[1].filter(([a, b]) => a == i || b == i).length;
  }
  indices = indices.sort((a, b) => indexCount[b] - indexCount[a]);
  for (let i of indices) {
    let adjacent = data[1]
      .filter(([a, b]) => a == i || b == i)
      .flat()
      .sort()
      .filter((item, pos, ary) => item != i && (!pos || item != ary[pos - 1]));
    if (res[i] == -1) {
      if (adjacent.length) {
        if (adjacent.findIndex((item) => res[item] == 0) != -1 &&
            adjacent.findIndex((item) => res[item] == 1) != -1) {
          res = [];
          break;
        } else if (adjacent.findIndex((item) => res[item] == 1) != -1) {
          adjacent.forEach((item) => res[item] = 1);
          res[i] = 0;
        } else if (adjacent.findIndex((item) => res[item] == 0) != -1) {
          adjacent.forEach((item) => res[item] = 0);
          res[i] = 1;
        } else if (res.slice(i).every((item) => item == -1)) {
          adjacent.forEach((item) => res[item] = 1);
          res[i] = 0;
        } else if (indexCount[i] == 1) {
          adjacent.forEach((item) => res[item] = 1);
          res[i] = 0;
        }
      } else {
        res[i] = 0;
      }
    } else if (adjacent.length) {
      if (adjacent.findIndex((item) => res[item] == res[i]) != -1) {
        res = [];
        break;
      }
      adjacent.forEach((item) => res[item] = res[i] ^ 1);
    }
  }

  return res;
}

/** @param {NS} ns */
export async function main(ns: NS) {
  if (ns.args.length > 0) {
    const res = proper2ColoringOfAGraph(JSON.parse(ns.args[0].toString()));
    ns.tprint(res);
  }
}