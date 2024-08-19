import { NS } from "@ns";

class Stock {
  sym: string;
  org: string;
  price: number;
  forecast: number;
  volatility: number;
  constructor(ns: NS, sym: string) {
    this.sym = sym;
    this.org = ns.stock.getOrganization(sym);
    this.price = ns.stock.getPrice(sym);
    this.forecast = ns.stock.getForecast(sym);
    this.volatility = ns.stock.getVolatility(sym);
  }
}

/** @param {NS} ns */
export async function main(ns: NS) {
  // contains all stock data
  const stocks = ns.stock.getSymbols().map((s) => new Stock(ns, s)).sort((a, b) => b.forecast - a.forecast);

  for (const s of stocks) {
		ns.tprintf("%-5s  %-25s  %9s  %8s  %8s",
      s.sym, s.org, "$" + ns.formatNumber(s.price), 
      ns.formatPercent(s.forecast), ns.formatPercent(s.volatility));
  }
}