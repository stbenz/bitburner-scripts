import { NS, ScriptArg } from "@ns";

/**
 * tail configuration
 */
class Tail {
  script: string;
  lines: number;
  args: ScriptArg[];

  /**
   * create tail
   * 
   * @param script the script file
   * @param lines number of tail lines
   * @param args optional arguments to the script
   */
  constructor(script: string, lines: number, args?: ScriptArg[]) {
    this.script = script;
    this.lines = lines;
    this.args = args ?? [];
  }

  /**
   * get PID of running script or start script
   * 
   * @param ns netscript interface
   * @returns PID
   */
  getOrStart(ns: NS): number {
    let info = ns.getRunningScript(this.script, ns.getHostname(), ...this.args);
    if (info != null) {
      ns.tprint("showing " + this.script);
      return info.pid;
    } else {
      ns.tprint("starting " + this.script);
      return ns.run(this.script, 1, ...this.args);
    }
  }
}

/** @param {NS} ns */
export async function main(ns: NS) {
  // tail sizes
  const tailWidth = 290;
  const tailHeightTitle = 33;
  const tailHeightLine = 24;

  // tail offsets
  const tailOffsetX = 20;
  const tailOffsetY = 50;

  // tail list
  const tailList = [
    new Tail("scripts/hack-stats.js", 1),
    new Tail("scripts/hwgw-v3.js", 2),
    new Tail("scripts/purchase-hacknet.js", 1),
    new Tail("scripts/purchase-servers.js", 1, [256 * 1024]),
    new Tail("scripts/stockmarket.js", 1),
    new Tail("scripts/gang.js", 1),
  ];

  let [x, y] = ns.ui.windowSize();
  x -= tailOffsetX;
  y -= tailOffsetY;

  for (const tail of tailList) {
    let p = tail.getOrStart(ns);
    if (!p) {
      ns.tprint("ERROR: failed to start " + tail.script);
    }
    await ns.sleep(500);
    if (ns.isRunning(p)) {
      const w = tailWidth;
      const h = tailHeightTitle + tail.lines * tailHeightLine;
      ns.tail(p);
      ns.moveTail(x - w, y - h, p);
      ns.resizeTail(w, h, p);
      y -= h;
    } else {
      ns.tprint("INFO: already finished " + tail.script);
    }
  }
}