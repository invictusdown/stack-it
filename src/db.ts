import Dexie, { Table } from 'dexie';

export interface Transaction {
  id?: number;
  usdAmount: number;
  bitcoinAmount: number;
  date: Date;
}

export class MySubClassedDexie extends Dexie {
  transactions!: Table<Transaction>;

  constructor() {
    super('BitcoinStackingDB');
    this.version(1).stores({
      transactions: '++id, usdAmount, bitcoinAmount, date'
    });
  }
}

export const db = new MySubClassedDexie();