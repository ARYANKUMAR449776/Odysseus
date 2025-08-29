// Resolvers = functions that actually return the data for each field in the schema.
// For now we’ll return in-memory demo data (no database yet).

type User = {
  id: string;
  email: string;
  name: string;
  createdAt: string;  // ISO string for GraphQL
};

type Account = {
  id: string;
  userId: string;
  type: "checking" | "savings" | "credit";
  balanceCents: number;
  createdAt: string;
};

// demo data (later we will use MongoDB)
const users: User[] = [
  { id: "u1", email: "aryan@example.com", name: "Aryan Kumar", createdAt: new Date().toISOString() },
  { id: "u2", email: "alice@example.com", name: "Alice", createdAt: new Date().toISOString() }
];

const accounts: Account[] = [
  { id: "a1", userId: "u1", type: "checking", balanceCents: 25000, createdAt: new Date().toISOString() },
  { id: "a2", userId: "u1", type: "savings",  balanceCents: 500000, createdAt: new Date().toISOString() },
  { id: "a3", userId: "u2", type: "checking", balanceCents: 10000, createdAt: new Date().toISOString() }
];

export const resolvers = {
  Query: {
    health: () => "ok",
    users: () => users,
    accountsByUser: (_parent: unknown, args: { userId: string }) =>
      accounts.filter(a => a.userId === args.userId),
  },
  Mutation: {
    noop: () => true
  }
};
