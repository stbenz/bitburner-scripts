import { NS } from '@ns';
import { networkTree } from 'lib/targetlib'
import { INetworkTree } from 'lib/interfaces';

function printServer(ns: NS, server: INetworkTree, indent: number) {
  let color = "\u001b[32m";
  const serverInfo = ns.getServer(server.name);
  if (!serverInfo.hasAdminRights) {
    color = "\u001b[31m";
  } else if (Object.hasOwn(serverInfo, "backdoorInstalled") && serverInfo.backdoorInstalled === false) {
    color = "\u001b[33m";
  }
  ns.tprintf("%s%s%s\u001b[0m", " ".repeat(indent), color, server.name);
  for (const c of server.children) {
    printServer(ns, c, indent + 1);
  }
}

/** @param {NS} ns */
export async function main(ns: NS) {
  const tree = networkTree(ns, 'home');
  printServer(ns, tree, 0);
}