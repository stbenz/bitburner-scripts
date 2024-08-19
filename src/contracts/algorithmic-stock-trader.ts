/**
 * solve Algorithmic Stock Trader I
 * 
 * @param {number[]} data the contract data
 * @return {number} the contract answer
 */
export function algorithmicStockTrader1(data: number[]): number {
  let best = 0;
  for (let i = 0; i < data.length - 1; i++) {
    best = Math.max(best, Math.max(...data.slice(i + 1)) - data[i]);
  }
  return best;
}

/**
 * solve Algorithmic Stock Trader II
 * 
 * @param {number[]} data the contract data
 * @return {number} the contract answer
 */
export function algorithmicStockTrader2(data: number[]): number {
  let profit = 0;
  let low = data[0];
  let rising = true;
  for (let i = 1; i < data.length; i++) {
    const r = data[i] >= data [i-1];
    if (rising && !r) {
      profit += (data[i-1] - low);
    } else if (!rising && r) {
      low = data[i-1];
    }
    rising = r;
  }
  if (rising) {
    profit += (data[data.length-1] - low);
  }
  return profit;
}

/**
 * solve Algorithmic Stock Trader III
 * 
 * @param {number[]} data the contract data
 * @return {number} the contract answer
 */
export function algorithmicStockTrader3(data: number[]): number {
  let best = 0;
  for (let i = 0; i < data.length - 1; i++) {
    for (let j = i + 1; j < data.length; j++) {
      let p1 = data[j] - data[i];
      let p2 = 0;
      for (let k = j + 1; k < data.length - 1; k++) {
        p2 = Math.max(p2, Math.max(...data.slice(k + 1)) - data[k])
      }
      best = Math.max(best, p1 + p2);
    }
  }
  return best;
}

/**
 * solve Algorithmic Stock Trader IV
 * 
 * @param {[number,number[]]} data the contract data
 * @return {number} the contract answer
 */
export function algorithmicStockTrader4(data: [number, number[]]): number {
  const bestProfitRemaining = (d: number[], n: number) => {
    let best = 0;
    for (let i = 0; i < d.length - 1; i++) {
      for (let j = i + 1; j < d.length; j++) {
        let p1 = d[j] - d[i];
        if (p1 < 0)
          continue;
        let p2 = 0;
        if (n > 1 && d.length - j > 2) {
          p2 = bestProfitRemaining(d.slice(j + 1), n - 1);
        }
        best = Math.max(best, p1 + p2);
      }
    }
    return best;
  }
  const [n, d] = data;
  return bestProfitRemaining(d, n);
}
