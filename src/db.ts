import { MongoClient, ObjectId, type Db, type Collection } from 'mongodb';

// stricter env helper
function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === '') {
    throw new Error(`Missing ${name} in .env (or not loaded)`);
  }
  return v;
}

const uri = requiredEnv('MONGODB_URI');
const dbName = requiredEnv('DB_NAME');

let _client: MongoClient | null = null;
let _db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (_db) return _db;
  if (!_client) {
    _client = new MongoClient(uri);
    await _client.connect();
  }
  _db = _client.db(dbName);
  return _db;
}

/* ----------------------- Users ----------------------- */

export interface UserDoc {
  _id: ObjectId;    
  email: string;
  name: string;
   passwordHash?: string; 
  createdAt: Date;
}

export async function usersCol(): Promise<Collection<UserDoc>> {
  const db = await getDb();
  return db.collection<UserDoc>('users');
}

export function toUserGql(u: UserDoc) {
  return {
    id: u._id.toString(),
    email: u.email,
    name: u.name,
    createdAt: u.createdAt.toISOString()
  };
}

/* ----------------------- Accounts ----------------------- */

export type AccountType = "checking" | "savings" | "credit";

export interface AccountDoc {
  _id: ObjectId;
  userId: ObjectId;
  type: AccountType;
  balanceCents: number;
  createdAt: Date;
}

export async function accountsCol(): Promise<Collection<AccountDoc>> {
  const db = await getDb();
  return db.collection<AccountDoc>('accounts');
}

export function toAccountGql(a: AccountDoc) {
  return {
    id: a._id.toString(),
    userId: a.userId.toString(),
    type: a.type,
    balanceCents: a.balanceCents,
    createdAt: a.createdAt.toISOString(),
  };
}
/* ----------------------- Cards ----------------------- */
export type CardStatus = "active"|"locked"|"cancelled";
export interface CardDoc {
  _id:ObjectId;
  accountId:ObjectId;
  token:string;
  last4:string;
  status:CardStatus;
  createdAt:Date;
  updatedAt:Date;  
}
export async function cardsCol(): Promise<Collection<CardDoc>> {
  const db = await getDb();
  return db.collection<CardDoc>('cards');
}
export function toCardGql(c: CardDoc) {
  return {
    id: c._id.toString(),
    accountId: c.accountId.toString(),
    last4: c.last4,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

/** Generate a fake 16-digit token and derive last4.
 * In production you would use a tokenization service/HSM.
 */
export function genCardToken(): { token: string; last4: string } {
  const digits = Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('');
  return { token: digits, last4: digits.slice(-4) };
}



/* ----------------------- Transactions ----------------------- */

export type TransactionType = "credit" | "debit";

export interface TransactionDoc {
  _id: ObjectId;
  accountId: ObjectId;
  type: TransactionType;
  amountCents: number;        // positive integer
  balanceAfterCents: number;  // snapshot after applying tx
  description?: string;
  requestId?: string;         // idempotency key
  createdAt: Date;
}

export async function transactionsCol(): Promise<Collection<TransactionDoc>> {
  const db = await getDb();
  return db.collection<TransactionDoc>('transactions');
}

export function toTransactionGql(t: TransactionDoc) {
  return {
    id: t._id.toString(),
    accountId: t.accountId.toString(),
    type: t.type,
    amountCents: t.amountCents,
    balanceAfterCents: t.balanceAfterCents,
    description: t.description ?? null,
    createdAt: t.createdAt.toISOString(),
  };
}

/* ----------------------- Helpers ----------------------- */

export function oid(id: string): ObjectId {
  try {
    return new ObjectId(id);
  } catch {
    throw new Error('Invalid ID format');
  }
}


