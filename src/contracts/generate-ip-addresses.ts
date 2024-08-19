import { NS } from "@ns";

/**
 * solve Array Jumping Game
 * 
 * @param {string} data the contract data
 * @return {string[]} the contract answer
 */
export function generateIpAddresses(data: string): string[] {
  const getNext = (s: string, n: number): string[] => {
    const r = new Array<string>();
    if (s.length - 1 <= (3 - n) * 3 && (n < 3 || s.length == 1)) {
      r.push(s.charAt(0));
    }
    let m;
    if (s.length - 2 <= (3 - n) * 3 && (n < 3 || s.length == 2)) {
      if ((m = /^[1-9][0-9]/.exec(s)) !== null) {
        r.push(m[0]);
      }
    }
    if (s.length - 3 <= (3 - n) * 3 && (n < 3 || s.length == 3)) {
      if ((m = /^(25[0-5]|(2[0-4]|1\d)\d)/.exec(s)) !== null) {
        r.push(m[0]);
      }
    }
    return r;
  };

  let possible: [string[],string][] = [[[], data]];
  for (let i = 0; i <= 3; i++) {
    const tmp = possible;
    possible = [];
    while (tmp.length > 0) {
      const [ip, remain] = tmp.shift()!;
      const next = getNext(remain, i);
      for (const n of next) {
        possible.push([ip.concat([n]), remain.substring(n.length)]);
      }
    }
  }
  
  return possible.map(([ip]) => ip.join("."));
}

/** @param {NS} ns */
export async function main(ns: NS) {
  if (ns.args.length > 0) {
    const res = generateIpAddresses(ns.args[0].toString());
    ns.tprint(res);
  }
}