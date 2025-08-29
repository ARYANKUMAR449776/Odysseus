import { usersCol } from './db';

export async function ensureDbIndexes() {
  const users = await usersCol();
  await users.createIndex({ email: 1 }, { unique: true, name: 'uniq_email' });
}
