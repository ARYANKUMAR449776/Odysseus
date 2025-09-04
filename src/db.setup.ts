import { usersCol, accountsCol, cardsCol, transactionsCol } from './db';

export async function ensureDbIndexes() {
  // users: unique email
  const users = await usersCol();
  await users.createIndex({ email: 1 }, { unique: true, name: 'uniq_email' });

  // accounts: query by userId
  const accounts = await accountsCol();
  await accounts.createIndex({ userId: 1, createdAt: -1 }, { name: 'by_user_created' });

  // cards 
  try {
    const cards = await cardsCol();
    await cards.createIndex({ accountId: 1, createdAt: -1 }, { name: 'by_account_created' });
    await cards.createIndex({ token: 1 }, { unique: true, name: 'uniq_token' });
  } catch {  }

  // transactions: query by account; idempotency key
  const tx = await transactionsCol();
  await tx.createIndex({ accountId: 1, createdAt: -1 }, { name: 'by_account_created' });
  await tx.createIndex({ requestId: 1 }, { unique: true, sparse: true, name: 'uniq_requestId' });
}
