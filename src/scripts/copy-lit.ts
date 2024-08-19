import { NS } from '@ns';
import { gainRoot } from 'lib/targetlib';

/** @param {NS} ns */
export async function main(ns: NS) {
  ns.disableLog("ALL");

  // get all servers with root access
  const servers = gainRoot(ns, "home", true);

  // find "lit" files on servers an copy to home
  for (const s of servers) {
    const files = ns.ls(s, ".lit");
    if (files.length > 0) {
      ns.print(s);
      for (const f of files) {
        ns.print("- " + f);
        ns.scp(f, "home", s);
      }
    }
  }
}