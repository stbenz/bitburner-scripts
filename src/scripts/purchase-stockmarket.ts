import { NS } from "@ns";

/** @param {NS} ns */
export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.setTitle("purchase WSE account");

  // buy access to stock market
  if (!ns.stock.hasWSEAccount() && !ns.stock.purchaseWseAccount()) {
    ns.print("ERROR: failed to purchase WSE account");
    return;
  }
  if (!ns.stock.hasTIXAPIAccess() && !ns.stock.purchaseTixApi()) {
    ns.print("ERROR: failed to purchase TIX API access");
    return;
  }
  if (!ns.stock.has4SData() && !ns.stock.purchase4SMarketData()) {
    ns.print("ERROR: failed to purchase 4S data");
    return;
  }
  if (!ns.stock.has4SDataTIXAPI() && !ns.stock.purchase4SMarketDataTixApi()) {
    ns.print("ERROR: failed to purchase 4S data TIX API");
    return;
  }
}