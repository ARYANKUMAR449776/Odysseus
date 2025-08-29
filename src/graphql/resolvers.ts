import { z } from 'zod';
import { usersCol, toUserGql, type UserDoc } from '../db';
import { accounts } from './data'; // still in-memory for now

const CreateUserSchema = z.object({
  email: z.string().email().toLowerCase(),
  name: z.string().min(2, "Name must be at least 2 characters long")
});

export const resolvers = {
  Query: {
    health: () => "ok",

    users: async () => {
      const col = await usersCol();
      const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
      return docs.map(toUserGql);
    },

    accountsByUser: (_p: unknown, args: { userId: string }) =>
      accounts.filter(a => a.userId === args.userId),
  },

  Mutation: {
    noop: () => true,

    createUser: async (_p: unknown, args: { input: { email: string; name: string } }) => {
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
        const created = await col.findOne({ _id: result.insertedId });
        if (!created) throw new Error('Failed to load newly created user');
        return toUserGql(created);
      } catch (err: any) {
        if (err?.code === 11000) throw new Error('Email already in use');
        throw err;
      }
    }
  }
};
