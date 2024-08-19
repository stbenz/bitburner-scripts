import { NS } from "@ns";

/** @param {NS} ns */
export async function main(ns: NS) {
  // parse flags
  const data = ns.flags([
    ['p', -1],
    ['m', ''],
    ['s', ''],
    ['title', ''],
    ['r', false],
    ['o', false],
    ['c', false]
  ]);

  // use own pid if not specified
  if (data.p == -1) {
    data.p = ns.pid;
    ns.print("pid not specified, using own: " + data.p);
  }

  if (typeof data.p !== "number") {
    ns.print("invalid pid specified");
    return;
  }

  // open/close tail
  if (data.o) {
    ns.print("opening tail");
    ns.tail(data.p);
  } else if (data.c) {
    ns.print("closing tail");
    ns.closeTail(data.p);
  }

  // set tail title
  if (typeof data.title === "string" && data.title.length > 0) {
    ns.print("setting tail title: " + data.title);
    ns.setTitle(data.title, data.p);
  }

  // move tail
  const m = /^(\d+),(\d+)$/.exec(data.m.toString());
  if (m != null) {
    let [x, y] = [parseInt(m[1]), parseInt(m[2])];
    if (data.r) {
      const [ww, wh] = ns.ui.windowSize();
      x = ww - x;
      y = wh - y;
    }
    ns.printf("moving tail to %d,%d", x, y);
    ns.moveTail(x, y, data.p);
  }

  // resize tail
  const s = /^(\d+),(\d+)$/.exec(data.s.toString());
  if (s != null) {
    const [w, h] = [parseInt(s[1]), parseInt(s[2])];
    ns.printf("resizing tail to %dx%d", w, h);
    ns.resizeTail(w, h, data.p);
  }
}