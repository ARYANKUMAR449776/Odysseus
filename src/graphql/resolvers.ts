
import { z } from 'zod';
import type { Filter, FindOneAndUpdateOptions } from 'mongodb';
import {
  usersCol, toUserGql, type UserDoc,
  accountsCol, toAccountGql, type AccountDoc, oid,
  cardsCol, toCardGql, type CardDoc,
  transactionsCol, toTransactionGql, type TransactionDoc
} from '../db';
import {
  hashPassword, verifyPassword,
  signAccessToken, signRefreshToken, verifyRefresh
} from '../auth';

/* ----------------------- Validation ----------------------- */
const CreateUserSchema = z.object({
  email: z.string().email().toLowerCase(),
  name: z.string().min(2, "Name must be at least 2 characters long"),
});

const RegisterSchema = z.object({
  email: z.string().email().toLowerCase(),
  name: z.string().min(2),
  password: z.string().min(6),
});

const LoginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(6),
});

const CreateAccountSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(["checking", "savings", "credit"]),
  openingCents: z.number().int().nonnegative().default(0),
});

const IssueCardSchema = z.object({ accountId: z.string().min(1) });
const CardIdSchema   = z.object({ cardId: z.string().min(1) });

const MakeTransactionSchema = z.object({
  accountId: z.string().min(1),
  type: z.enum(["credit", "debit"]),
  amountCents: z.number().int().positive(),
  description: z.string().max(256).optional(),
  requestId: z.string().min(6).max(100).optional(),
});

/* ----------------------- Helpers ----------------------- */
type Ctx = { userId?: string | null };

function requireAuth(ctx: Ctx): string {
  if (!ctx.userId) throw new Error('Unauthenticated');
  return ctx.userId;
}

/* ----------------------- Resolvers ----------------------- */
export const resolvers = {
  Query: {
    health: () => "ok",

    me: async (_: unknown, __: unknown, ctx: Ctx) => {
      if (!ctx.userId) return null;
      const col = await usersCol();
      const u = await col.findOne({ _id: oid(ctx.userId) } as Filter<UserDoc>);
      return u ? toUserGql(u) : null;
    },

    users: async () => {
      const col = await usersCol();
      const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
      return docs.map(toUserGql);
    },

    accountsByUser: async (_: unknown, args: { userId: string }) => {
      const col = await accountsCol();
      const docs = await col.find({ userId: oid(args.userId) }).sort({ createdAt: -1 }).toArray();
      return docs.map(toAccountGql);
    },

    cardsByAccount: async (_: unknown, args: { accountId: string }) => {
      const col = await cardsCol();
      const docs = await col.find({ accountId: oid(args.accountId) }).sort({ createdAt: -1 }).toArray();
      return docs.map(toCardGql);
    },

    transactionsByAccount: async (_: unknown, args: { accountId: string }) => {
      const col = await transactionsCol();
      const docs = await col.find({ accountId: oid(args.accountId) }).sort({ createdAt: -1 }).toArray();
      return docs.map(toTransactionGql);
    },
  },

  Mutation: {
    noop: () => true,

    /* ---------- Auth ---------- */
    registerUser: async (_: unknown, args: { input: { email: string; name: string; password: string } }) => {
      const parsed = RegisterSchema.safeParse(args.input);
      if (!parsed.success) {
        const msg = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
        throw new Error(`Invalid input: ${msg}`);
      }
      const { email, name, password } = parsed.data;

      const col = await usersCol();
      const existing = await col.findOne({ email } as Filter<UserDoc>);
      if (existing) throw new Error('Email already in use');

      const passwordHash = await hashPassword(password);
      const ins = await col.insertOne({ email, name, passwordHash, createdAt: new Date() } as Omit<UserDoc, '_id'> as any);

      const created = await col.findOne({ _id: ins.insertedId } as Filter<UserDoc>);
      if (!created) throw new Error('Failed to load newly created user');

      const userId = created._id.toString();
      return {
        accessToken:  signAccessToken(userId),
        refreshToken: signRefreshToken(userId),
        user: toUserGql(created),
      };
    },

    loginUser: async (_: unknown, args: { input: { email: string; password: string } }) => {
      const parsed = LoginSchema.safeParse(args.input);
      if (!parsed.success) {
        const msg = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
        throw new Error(`Invalid input: ${msg}`);
      }
      const { email, password } = parsed.data;

      const col = await usersCol();
      const user = await col.findOne({ email } as Filter<UserDoc>);
      if (!user || !user.passwordHash) throw new Error('Invalid credentials');

      const ok = await verifyPassword(password, user.passwordHash);
      if (!ok) throw new Error('Invalid credentials');

      const userId = user._id.toString();
      return {
        accessToken:  signAccessToken(userId),
        refreshToken: signRefreshToken(userId),
        user: toUserGql(user),
      };
    },

    refreshToken: async (_: unknown, args: { token: string }) => {
      const payload = verifyRefresh(args.token);
      const col = await usersCol();
      const user = await col.findOne({ _id: oid(payload.sub) } as Filter<UserDoc>);
      if (!user) throw new Error('User not found');
      const userId = user._id.toString();
      return {
        accessToken:  signAccessToken(userId),
        refreshToken: signRefreshToken(userId),
        user: toUserGql(user),
      };
    },

    /* ---------- Users (legacy) ---------- */
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

    /* ---------- Accounts ---------- */
    createAccount: async (_: unknown, args: { input: { userId: string; type: "checking" | "savings" | "credit"; openingCents?: number } }, ctx: Ctx) => {
      const parsed = CreateAccountSchema.safeParse(args.input);
      if (!parsed.success) {
        const msg = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
        throw new Error(`Invalid input: ${msg}`);
      }
      const { userId, type, openingCents } = parsed.data;

      // only the owner can create their account
      const authId = requireAuth(ctx);
      if (authId !== userId) throw new Error('Forbidden');

      const ucol = await usersCol();
      const user = await ucol.findOne({ _id: oid(userId) } as Filter<UserDoc>);
      if (!user) throw new Error('User not found');

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
    },

    /* ---------- Transactions (now authorized) ---------- */
    makeTransaction: async (_: unknown, args: { input: { accountId: string; type: "credit" | "debit"; amountCents: number; description?: string; requestId?: string } }, ctx: Ctx) => {
      const parsed = MakeTransactionSchema.safeParse(args.input);
      if (!parsed.success) {
        const msg = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
        throw new Error(`Invalid input: ${msg}`);
      }
      const { accountId, type, amountCents, description, requestId } = parsed.data;

      const acol = await accountsCol();
      const account = await acol.findOne({ _id: oid(accountId) } as Filter<AccountDoc>);
      if (!account) throw new Error('Account not found');

      // only the account owner can transact
      const authId = requireAuth(ctx);
      if (account.userId.toString() !== authId) throw new Error('Forbidden');

      // idempotency
      if (requestId) {
        const existing = await (await transactionsCol()).findOne({ requestId });
        if (existing) return toTransactionGql(existing);
      }

      // atomic update (Mongo v6 returns the doc directly)
      const inc = type === "credit" ? amountCents : -amountCents;
      const filter: Filter<AccountDoc> =
        type === "debit"
          ? ({ _id: account._id, balanceCents: { $gte: amountCents } } as unknown as Filter<AccountDoc>)
          : ({ _id: account._id } as Filter<AccountDoc>);

      const updated = await acol.findOneAndUpdate(
        filter,
        { $inc: { balanceCents: inc } },
        { returnDocument: 'after' } as FindOneAndUpdateOptions
      );

      if (!updated) throw new Error('Insufficient funds');

      // record the transaction
      const balanceAfter = updated.balanceCents;
      const tcol = await transactionsCol();
      const txDoc: Omit<TransactionDoc, '_id'> = {
        accountId: account._id,
        type,
        amountCents,
        balanceAfterCents: balanceAfter,
        description,
        requestId,
        createdAt: new Date(),
      };

      try {
        const ins = await tcol.insertOne(txDoc as any);
        const created = await tcol.findOne({ _id: ins.insertedId } as Filter<TransactionDoc>);
        return toTransactionGql(created as TransactionDoc);
      } catch (err: any) {
        if (err?.code === 11000 && requestId) {
          const existing = await tcol.findOne({ requestId });
          if (existing) return toTransactionGql(existing);
        }
        throw err;
      }
    },
  },
};
