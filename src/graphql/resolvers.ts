import { z } from 'zod';
import type { Filter } from 'mongodb';
import { 
  usersCol, toUserGql, type UserDoc,
  accountsCol, toAccountGql, type AccountDoc, oid
} from '../db';

const CreateUserSchema = z.object({
  email: z.string().email().toLowerCase(),
  name: z.string().min(2, "Name must be at least 2 characters long")
});

const CreateAccountSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(["checking", "savings", "credit"]),
  openingCents: z.number().int().nonnegative().default(0),
});

export const resolvers = {
  Query: {
    health: () => "ok",

    // users from Mongo
    users: async () => {
      const col = await usersCol();
      const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
      return docs.map(toUserGql);
    },

    // accounts from Mongo (replaced in-memory array)
    accountsByUser: async (_: unknown, args: { userId: string }) => {
      const col = await accountsCol();
      const docs = await col.find({ userId: oid(args.userId) }).sort({ createdAt: -1 }).toArray();
      return docs.map(toAccountGql);
    },
  },

  Mutation: {
    noop: () => true,

    // create user (unchanged logic, now with stricter UserDoc typing)
    createUser: async (_: unknown, args: { input: { email: string; name: string } }) => {
      const parsed = CreateUserSchema.safeParse(args.input);
      if (!parsed.success) {
        const msg = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
        throw new Error(`Invalid input: ${msg}`);
      }
      const { email, name } = parsed.data;

      const col = await usersCol();
      try {
        const doc: Omit<UserDoc, '_id'> = { email, name, createdAt: new Date() };
        const result = await col.insertOne(doc as any);
        const created = await col.findOne({ _id: result.insertedId } as Filter<UserDoc>);
        if (!created) throw new Error('Failed to load newly created user');
        return toUserGql(created);
      } catch (err: any) {
        if (err?.code === 11000) throw new Error('Email already in use');
        throw err;
      }
    },

    // create account (NEW)
    createAccount: async (_: unknown, args: { input: { userId: string; type: "checking" | "savings" | "credit"; openingCents?: number } }) => {
      // 1) validate
      const parsed = CreateAccountSchema.safeParse(args.input);
      if (!parsed.success) {
        const msg = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
        throw new Error(`Invalid input: ${msg}`);
      }
      const { userId, type, openingCents } = parsed.data;

      // 2) ensure user exists
      const ucol = await usersCol();
      const user = await ucol.findOne({ _id: oid(userId) } as Filter<UserDoc>);
      if (!user) throw new Error('User not found');

      // 3) create account
      const acol = await accountsCol();
      const doc: Omit<AccountDoc, '_id'> = {
        userId: oid(userId),
        type,
        balanceCents: openingCents ?? 0,
        createdAt: new Date(),
      };
      const result = await acol.insertOne(doc as any);
      const created = await acol.findOne({ _id: result.insertedId } as Filter<AccountDoc>);
      if (!created) throw new Error('Failed to load newly created account');
      return toAccountGql(created);
    }
  }
};
