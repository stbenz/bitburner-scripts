import { NS } from "@ns";

// triggers for buying and selling long stocks
const gBuyLongTrigger = 0.6;
const gSellLongTrigger = 0.5;

// minimum transaction
const gMinTransaction = 5_000_000;

class StockInfo {
  sym: string;
  askPrice: number = 0;
  bidPrice: number = 0;
  price: number = 0;
  maxShares: number = 0;
  longNum: number = 0;
  longBuyPrice: number = 0;
  shortNum: number = 0;
  shortBuyPrice: number = 0;
  forecast: number = 0;
  volatility: number = 0;

  /**
   * constructor
   * 
   * @param {String} sym stock symbol
   */
	constructor(sym: string) {
		this.sym = sym;
	}

  /**
   * update stock data
   * 
   * @param {NS} ns netscript interface
   */
	update(ns: NS) {
		// Obtain prices and other stock metrics
		this.askPrice = ns.stock.getAskPrice(this.sym);
		this.bidPrice = ns.stock.getBidPrice(this.sym);
		this.price = ns.stock.getPrice(this.sym);
		this.maxShares = ns.stock.getMaxShares(this.sym);

		// Get current position on longs and shorts
		[this.longNum, this.longBuyPrice, this.shortNum, this.shortBuyPrice] = ns.stock.getPosition(this.sym);

		// Get volatility and forecast if available
    this.forecast = ns.stock.getForecast(this.sym);
    this.volatility = ns.stock.getVolatility(this.sym);
	}

  /**
   * get price paid for stocks
   */
	getPricePaid() {
		return this.longNum * this.longBuyPrice + this.shortNum * this.shortBuyPrice;
	}

	getValue() {
		return this.longNum * this.bidPrice + this.shortNum * this.askPrice;
	}

	getProfit() {
		return this.getValue() - this.getPricePaid();
	}
}

/** @param {NS} ns */
export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.setTitle("STONKS");

  // stock constants
  const sc = ns.stock.getConstants();

  // buy access to stock market
  if (!ns.stock.hasWSEAccount() || !ns.stock.hasTIXAPIAccess() || 
      !ns.stock.has4SData() || !ns.stock.has4SDataTIXAPI()) {
    ns.print("ERROR: missing WSE API components");
    return;
  }

  // contains all stock data
  const stocks = ns.stock.getSymbols().map((s) => new StockInfo(s));

  // stock capital
  let cash = 0;
  let capital = 0;

  // keep track of paid commissions
  let commission = 0;

  // port to receive budget
  const port = ns.getPortHandle(200);
  
  while (true) {
    // wait for next update
    await ns.stock.nextUpdate();

    // get budget from port
    while (!port.empty()) {
      const b = port.read() as number;
      ns.print("INFO: increased capital by " + ns.formatNumber(b));
      cash += b;
      capital += b;
    }

    // update stock data
    stocks.forEach((s) => s.update(ns));

    // print stock info
    const stockValue = stocks.reduce((a, c) => a + c.getValue(), 0);
    const stockProfit = stocks.reduce((a, c) => a + c.getProfit(), 0);
    ns.printf("capital:             %9s", "$" + ns.formatNumber(capital));
    ns.printf("cash:                %9s", "$" + ns.formatNumber(cash));
    ns.printf("stock value:         %9s", "$" + ns.formatNumber(stockValue));
    ns.printf("stock profit:        %9s", "$" + ns.formatNumber(stockProfit));
    ns.printf("commissions:         %9s", "$" + ns.formatNumber(commission));
    ns.printf("net profit:          %9s", "$" + ns.formatNumber(cash + stockValue - capital - commission));
    
    // sell stocks
    const sellStocks = stocks
      .filter((s) => s.longNum + s.shortNum > 0 && s.forecast < gSellLongTrigger);
    for (let s of sellStocks) {
      // sell stock and update capital
      let sharePrice = ns.stock.sellStock(s.sym, s.longNum);
      if (sharePrice > 0) {
        cash += s.longNum * sharePrice - sc.StockMarketCommission;
        commission += sc.StockMarketCommission;
      }
    }

    // full capital might not be available
    let budget = Math.min(cash, ns.getServerMoneyAvailable("home"));

    // buy stocks
    const buyStocks = stocks
      .filter((s) => s.forecast >= gBuyLongTrigger)
      .sort((a, b) => b.forecast - a.forecast);
    for (let s of buyStocks) {
      // calculate number of shares to buy (as much as possible)
      const numShares = Math.min(
        ns.stock.getMaxShares(s.sym) - s.longNum - s.shortNum, 
        Math.floor((budget - sc.StockMarketCommission) / s.askPrice));

      // either max amount of shares already bought, out of budget or transaction too small
      if (numShares * s.askPrice < gMinTransaction) {
        continue;
      }

      // buy stock and update capital and budget
      let sharePrice = ns.stock.buyStock(s.sym, numShares);
      if (sharePrice > 0) {
        budget -= numShares * sharePrice + sc.StockMarketCommission;
        cash -= numShares * sharePrice + sc.StockMarketCommission;
        commission += sc.StockMarketCommission;
      }
    }
  }
}