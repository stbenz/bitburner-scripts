import { gainRoot } from 'lib/targetlib';
import {
  mergeOverlappingIntervals
} from 'contracts/merge-overlapping-intervals';
import {
  subarrayWithMaximumSum
} from 'contracts/subarray-with-maximum-sum';
import {
  compression1RleCompression
} from 'contracts/compression.js';
import {
  proper2ColoringOfAGraph
} from 'contracts/proper-2-coloring-of-a-graph';
import {
  hammingCodesEncodedBinaryToInteger,
  hammingCodesIntegerToEncodedBinary
} from 'contracts/hamming-codes';
import {
  arrayJumpingGame,
  arrayJumpingGame2
} from 'contracts/array-jumping-game';
import {
  algorithmicStockTrader1,
  algorithmicStockTrader2,
  algorithmicStockTrader3,
  algorithmicStockTrader4
} from 'contracts/algorithmic-stock-trader';
import {
  generateIpAddresses
} from 'contracts/generate-ip-addresses';
import {
  shortestPathInAGrid
} from 'contracts/shortest-path-in-a-grid';
import {
  findLargestPrimeFactor
} from 'contracts/find-largest-prime-factor';
import {
  spiralizeMatrix
} from 'contracts/spiralize-matrix';
import { NS } from '@ns';

/**
 * try to solve the contract
 * 
 * @param {NS} ns netscript interface
 * @param {string} file contract file
 * @param {string} host target server
 * @returns {boolean} whether the contract was solved
 */
export function solveContract(ns: NS, file: string, host: string): boolean {
  const t = ns.codingcontract.getContractType(file, host);
  const d = ns.codingcontract.getData(file, host);
  let answer = null;
  switch (t) {
    case "Subarray with Maximum Sum":
      answer = subarrayWithMaximumSum(d);
      break;
    case "Merge Overlapping Intervals":
      answer = mergeOverlappingIntervals(d);
      break;
    case "Compression I: RLE Compression":
      answer = compression1RleCompression(d);
      break;
    case "Proper 2-Coloring of a Graph":
      answer = proper2ColoringOfAGraph(d);
      break;
    case "HammingCodes: Encoded Binary to Integer":
      answer = hammingCodesEncodedBinaryToInteger(d);
      break;
    case "HammingCodes: Integer to Encoded Binary":
      answer = hammingCodesIntegerToEncodedBinary(d);
      break;
    case "Array Jumping Game":
      answer = arrayJumpingGame(d);
      break;
    case "Array Jumping Game II":
      answer = arrayJumpingGame2(d);
      break;
    case "Algorithmic Stock Trader I":
      answer = algorithmicStockTrader1(d);
      break;
    case "Algorithmic Stock Trader II":
      answer = algorithmicStockTrader2(d);
      break;
    case "Algorithmic Stock Trader III":
      answer = algorithmicStockTrader3(d);
      break;
    case "Algorithmic Stock Trader IV":
      answer = algorithmicStockTrader4(d);
      break;
    case "Generate IP Addresses":
      answer = generateIpAddresses(d);
      break;
    case "Shortest Path in a Grid":
      answer = shortestPathInAGrid(d);
      break;
    case "Find Largest Prime Factor":
      answer = findLargestPrimeFactor(d);
      break;
    case "Spiralize Matrix":
      answer = spiralizeMatrix(d);
      break;
  }
  if (answer !== null) {
    ns.tprintf("solving '%s' (%s) on %s with answer %s", t, file, host, JSON.stringify(answer));
    const res = ns.codingcontract.attempt(answer, file, host);
    if (res.length > 0) {
      ns.tprintf("SUCCESS: %s", res);
      return true;
    } else {
      ns.tprintf("ERROR: failed, %d tries remaining", ns.codingcontract.getNumTriesRemaining(file, host));
      return false;
    }
  } else {
    ns.tprintf("INFO: unable to solve '%s' (%s) on %s", t, file, host);
    return false;
  }
}

/** @param {NS} ns */
export async function main(ns: NS) {
  ns.disableLog("ALL");

  // get all servers with root access
  const servers = gainRoot(ns, "home", true);

  // find "cct" files on servers
  for (const s of servers) {
    const files = ns.ls(s, ".cct");
    if (files.length > 0) {
      for (const f of files) {
        solveContract(ns, f, s);
      }
    }
  }
}