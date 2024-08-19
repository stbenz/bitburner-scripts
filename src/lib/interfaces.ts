/**
 * server resources
 */
export interface IResource {
  /** server name */
  name: string,
  /** free RAM */
  ram: number
}

/**
 * hack target information
 */
export interface IHackTarget {
  /** server name */
  name: string;
  /** hack chance */
  chance: number;
  /** minimum security level */
  minSecurity: number;
  /** current security level */
  curSecurity: number;
  /** maximum money */
  maxMoney: number;
  /** current money */
  curMoney: number;
  /** required hacking level */
  reqLevel: number;
}

/**
 * started process
 */
export interface IProcess {
  /** PID */
  pid: number;
  /** server name */
  server: string;
  /** RAM used by process */
  ram: number;
  /** number of threads */
  threads: number;
}

/**
 * network tree node
 */
export interface INetworkTree {
  /** server name */
  name: string;
  /** children */
  children: INetworkTree[]
}

/**
 * hack log entry
 */
export interface IHackLogEntry {
  /** timestamp in ms */
  ts: number;
  /** server name of hack target */
  server: string;
  /** amount of money hacked */
  money: number;
}
