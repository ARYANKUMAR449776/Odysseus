// Shared in-memory data (temporary; MongoDB next milestone)
export type User = {
  id: string;
  email: string;
  name: string;
  createdAt: string; // ISO
};

export type Account = {
  id: string;
  userId: string;
  type: "checking" | "savings" | "credit";
  balanceCents: number;
  createdAt: string; // ISO
};

export const users: User[] = [
  { id: "u1", email: "aryan@example.com", name: "Aryan Kumar", createdAt: new Date().toISOString() },
  { id: "u2", email: "alice@example.com", name: "Alice", createdAt: new Date().toISOString() }
];

export const accounts: Account[] = [
  { id: "a1", userId: "u1", type: "checking", balanceCents: 25000, createdAt: new Date().toISOString() },
  { id: "a2", userId: "u1", type: "savings",  balanceCents: 500000, createdAt: new Date().toISOString() },
  { id: "a3", userId: "u2", type: "checking", balanceCents: 10000, createdAt: new Date().toISOString() }
];
