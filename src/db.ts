import { MongoClient, type Db, type Collection } from 'mongodb';

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === '') {
    throw new Error(`Missing ${name} in .env (or not loaded)`);
  }
  return v;
}

const uri = requiredEnv('MONGODB_URI');
const dbName = requiredEnv('DB_NAME');

if (!uri) throw new Error('Missing MONGODB_URI in .env');
if (!dbName) throw new Error('Missing DB_NAME in .env');

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

export type UserDoc = {
  _id: any;           // ObjectId
  email: string;
  name: string;
  createdAt: Date;
};

export async function usersCol() {
  const db = await getDb();
  return db.collection('users') as Collection<UserDoc>;
}

export function toUserGql(u: UserDoc) {
  return {
    id: u._id.toString(),
    email: u.email,
    name: u.name,
    createdAt: u.createdAt.toISOString()
  };
}
