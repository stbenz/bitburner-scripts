import { NS } from "@ns";

function findServer(ns: NS, name: string, path: string[] = ["home"]): string[]|null {
  const s = path[path.length - 1];
  const p = path.length > 1 ? path[path.length - 2] : null;
  if (s == name) {
    return path;
  }
  const children = ns.scan(s).filter((n) => n != p);
  for (const c of children) {
    const ret = findServer(ns, name, path.concat([c]));
    if (ret !== null)
      return ret;
  }
  return null;
}

/** @param {NS} ns */
export async function main(ns: NS) {
  for (const s of ns.args) {
    let path = findServer(ns, s.toString());
    if (!path)
      continue;
  
    const connects = new Array<string>();
  
    if (ns.getServer(path[path.length - 1]).backdoorInstalled)
      continue;
  
    let str = "";
    while (path.length > 0) {
      const s = path.pop()!;
      str = `connect ${s}; ${str}`
      if (ns.getServer(s).backdoorInstalled)
        break;
    }
  
    str = "home; " + str + "backdoor";
  
    ns.tprint(str);
  }
}