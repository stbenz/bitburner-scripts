import { NS } from "@ns";

/**
 * solve Shortest Path In A Grid
 * 
 * @param {number[][]} data the contract data
 * @return {string} the contract answer
 */
export function shortestPathInAGrid(data: number[][]): string {
  // best paths
  const paths: [[number,number],string|null][] = [];

  // remaining vertices
  let vertices: [number,number][] = [];

  // grid dimensions
  const h = data.length;
  const w = data[0].length;

  // helper functions for paths
  const getPathStr = (pos: [number,number,string?]): string|null => paths.find((path) => path[0][0] == pos[0] && path[0][1] == pos[1])![1];
  const setPathStr = (pos: [number,number,string?], str: string) => paths.find((path) => path[0][0] == pos[0] && path[0][1] == pos[1])![1] = str;

  // helper function for path distance
  const getPathDist = (pos: [number,number,string?]) => {
    const pstr = getPathStr(pos);
    return pstr === null ? Number.POSITIVE_INFINITY : pstr.length;
  }

  // fill paths and vertices
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      if (data[y][x] == 0) {
        paths.push([[x, y], x == 0 && y == 0 ? "" : null]);
        vertices.push([x, y]);
      }
    }
  }

  while (vertices.length > 0) {
    // get next vertice with shortes path
    vertices = vertices.sort((a, b) => getPathDist(a) - getPathDist(b));
    const u = vertices.shift()!;

    // if vertice has no path yet, it isn't reachable
    if (getPathDist(u) == Number.POSITIVE_INFINITY) {
      return "";
    }

    // return path when end node found
    if (u[0] == w - 1 && u[1] == h - 1) {
      return getPathStr(u) ?? "";
    }

    // find possible neighbors not visited yet
    const neighbors: [number,number,string][] = [
      <[number,number,string]>[u[0] - 1, u[1], "L"],
      <[number,number,string]>[u[0] + 1, u[1], "R"],
      <[number,number,string]>[u[0], u[1] - 1, "U"],
      <[number,number,string]>[u[0], u[1] + 1, "D"]
    ].filter((p) => vertices.find((v) => p[0] == v[0] && p[1] == v[1]));

    for (const n of neighbors) {
      // possible path to neighbor
      const alt = getPathStr(u)! + n[2];
      // set as path if shorter than known path
      if (alt.length < getPathDist(n)) {
        setPathStr(n, alt);
      }
    }
  }

  return "";
}

/** @param {NS} ns */
export async function main(ns: NS) {
  if (ns.args.length > 0) {
    const res = shortestPathInAGrid(JSON.parse(ns.args[0].toString()));
    ns.tprint(res);
  }
}