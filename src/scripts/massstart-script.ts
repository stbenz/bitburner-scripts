import { NS } from '@ns';
import { gainRoot } from 'lib/targetlib';

/** @param {NS} ns */
export async function main(ns: NS) {
  // script must be provided as first arg
  if (ns.args.length < 1) {
    ns.tprint("script requires the script to run as argument");
    return;
  }

  // get arguments and script
  let arg = ns.args;
  const script = arg.shift()?.toString() ?? "undefined";

  // check script exists
  if (!ns.fileExists(script)) {
    ns.tprint("script not found");
    return;
  }

  // get servers with root access and calculate free ram
  const servers = gainRoot(ns, 'home', true);
  const resources = servers.map((s) => ({ 
    name: s,
    ram: ns.getServerMaxRam(s) - ns.getServerUsedRam(s)
  }));

  // get script RAM requirement
  const scriptRam = ns.getScriptRam(script);

  // copy nad execute script on all servers with enough free RAM
  for (const r of resources) {
    if (r.ram > scriptRam) {
      ns.scp(script, r.name);
      ns.exec(script, r.name, Math.floor(r.ram / scriptRam), ...arg)
    }
  }
}