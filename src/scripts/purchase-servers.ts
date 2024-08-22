import { NS } from "@ns";

/** @param {NS} ns */
export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.setTitle("purchase servers");

  // don't spend more than 50% of available money
  const spendRatio = 0.5;

  // initial ram size to purchase
  let ram = 64;

  // max ram size to purchase
  let maxRam = -1;

  if (ns.args.length > 0) {
    // convert arg to integer
    let arg = 0;
    if (typeof ns.args[0] === "string") {
      arg = parseInt(ns.args[0]);
    } else if (typeof ns.args[0] === "number") {
      arg = Math.round(ns.args[0]);
    }

    // only use arg if larger than initial ram size and power of 2
    if (arg > ram && (arg & (arg - 1)) == 0) {
      maxRam = arg;
    }
  }

  // iterator for buying loop,
  // start at number of servers in case the script is killed
  let i = ns.getPurchasedServers().length;

  // max number of servers
  const maxServers = ns.getPurchasedServerLimit();

  // Continuously try to purchase servers until we've reached the maximum
  // amount of servers
  while (i < maxServers) {
    // purchase a server if enough money available
    if (ns.getServerMoneyAvailable("home") * spendRatio > ns.getPurchasedServerCost(ram)) {
      const hostname = ns.purchaseServer(ns.sprintf("pserv-%02d", i), ram);
      ++i;

      ns.print("bought " + hostname + " (" + ns.formatRam(ram) + ")");
    } else {
      await ns.sleep(1000);
    }
  }

  ns.print("--- all servers purchased");

  // double RAM for upgrade
  ram *= 2;

  while (maxRam == -1 || ram <= maxRam) {
    // get servers to upgrade
    const servers = ns.getPurchasedServers().filter((s) => ns.getServerMaxRam(s) < ram);

    // if all servers upgraded, increase RAM and start from ebginning of loop
    if (servers.length == 0) {
      ns.print("--- all servers upgraded");

      ram *=2;
      continue;
    }

    while (servers.length > 0) {
      // upgrade a server if enough money available
      if (ns.getServerMoneyAvailable("home") * spendRatio > ns.getPurchasedServerUpgradeCost(servers[0], ram)) {
        ns.upgradePurchasedServer(servers[0], ram)

        ns.print("upgraded " + servers[0] + " (" + ns.formatRam(ram) + ")");

        // remove upgraded server from list
        servers.shift();
      } else {
        await ns.sleep(1000);
      }
    }
  }

  ns.print("=== max RAM reached");
}