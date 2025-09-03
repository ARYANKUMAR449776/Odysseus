import { usersCol, accountsCol } from './db';

export async function ensureDbIndexes() {
  // users: enforce unique emails
  const users = await usersCol();
  await users.createIndex({ email: 1 }, { unique: true, name: 'uniq_email' });

  // accounts: we query by userId often; also sort by createdAt
  const accounts = await accountsCol();
  await accounts.createIndex({ userId: 1, createdAt: -1 }, { name: 'by_user_created' });
}
