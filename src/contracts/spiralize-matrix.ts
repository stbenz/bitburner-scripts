import { NS } from "@ns";

/**
 * solve Spiralize Matrix
 * 
 * @param {number[][]} data the contract data
 * @return {number[]} the contract answer
 */
export function spiralizeMatrix(data: number[][]): number[] {
  let xl = 0;
  let xr = data[0].length - 1;
  let yt = 0;
  let yb = data.length - 1;
  let x = xl;
  let y = yt;
  const res = [];
  while (true) {
    for (x = xl; x <= xr; x++) {
      res.push(data[yt][x]);
    }
    if (yt == yb) break;
    yt++;
    for (y = yt; y <= yb; y++) {
      res.push(data[y][xr]);
    }
    if (xr == xl) break;
    xr--;
    for (x = xr; x >= xl; x--) {
      res.push(data[yb][x]);
    }
    if (yb == yt) break;
    yb--;
    for (y = yb; y >= yt; y--) {
      res.push(data[y][xl]);
    }
    if (xl == xr) break;
    xl++;
  }
  return res;
}

/** @param {NS} ns */
export async function main(ns: NS) {
  if (ns.args.length > 0) {
    const res = spiralizeMatrix(JSON.parse(ns.args[0].toString()));
    ns.tprint(res);
  }
}