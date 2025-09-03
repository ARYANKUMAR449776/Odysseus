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
  _id: ObjectId;          // was 'any' before; make it exact
  email: string;
  name: string;
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

/* ----------------------- Helpers ----------------------- */

export function oid(id: string): ObjectId {
  try {
    return new ObjectId(id);
  } catch {
    throw new Error('Invalid ID format');
  }
}
