import { NS } from '@ns';
import { gainRoot } from 'lib/targetlib';

/** @param {NS} ns */
export async function main(ns: NS) {
  // get all servers with root access
  const servers = gainRoot(ns, "home", true);

  const cyan = "\u001b[36m";
  const reset = "\u001b[0m";

  // find "cct" files on servers
  for (const s of servers) {
    const files = ns.ls(s, ".cct");
    if (files.length > 0) {
      ns.tprintf(cyan + s + reset);
      for (const f of files) {
        ns.tprintf("- " + f);
        ns.tprintf("  " + ns.codingcontract.getContractType(f, s));
      }
    }
  }
}