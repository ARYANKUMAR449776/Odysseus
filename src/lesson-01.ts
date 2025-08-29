// Odysseus — Lesson 01: TypeScript inside the real project

// 1) typed variables (string/boolean/number)
let bankName: string = "Odysseus Bank";
let supportsLoans = true;          // inferred boolean
let customerCount = 0;             // inferred number

// 2) domain types (type aliases)
type AccountType = "checking" | "savings" | "credit";

type User = {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
};

type Account = {
  id: string;
  userId: string;
  type: AccountType;
  balanceCents: number; // store money as integer cents (safer than floats)
  createdAt: Date;
};

// 3) functions with typed params + returns
function formatMoney(cents: number, currency: "CAD" | "USD" = "CAD"): string {
  return `${currency} ${(cents / 100).toFixed(2)}`;
}

// open a new account for a user
function openAccount(userId: string, type: AccountType, openingCents: number = 0): Account {
  return {
    id: randomId(),
    userId,
    type,
    balanceCents: openingCents,
    createdAt: new Date()
  };
}

// 4) union + narrowing (accept number OR string input)
function centsFrom(value: number | string): number {
  if (typeof value === "number") return Math.round(value * 100);
  // here TypeScript knows value is string
  const parsed = Number(value);
  if (Number.isNaN(parsed)) throw new Error("Amount must be numeric");
  return Math.round(parsed * 100);
}

// 5) tiny "demo flow" so you see output
const u: User = {
  id: randomId(),
  email: "aryan@example.com",
  name: "Aryan Kumar",
  createdAt: new Date()
};

const a = openAccount(u.id, "checking", centsFrom(250)); // $250 opening
customerCount += 1;

console.log("Bank:", bankName);
console.log("Customers:", customerCount);
console.log("Supports loans:", supportsLoans);
console.log("User:", u.email, "-", u.name);
console.log("Opened account:", a.type, "with balance", formatMoney(a.balanceCents));

// helper: simple id generator (fine for lessons; later we’ll use real UUIDs)
function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}
