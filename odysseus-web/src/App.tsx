import { useMutation, useQuery } from "@apollo/client";
import { useMemo, useState } from "react";
import { ACCOUNTS_BY_USER, CREATE_ACCOUNT, LOGIN, MAKE_TX, ME, REGISTER } from "./lib/gql";
import './App.css'
type Me = { id: string; email: string; name: string } | null;

export default function App() {
  const [email, setEmail] = useState("you@example.com");
  const [name, setName] = useState("You");
  const [password, setPassword] = useState("secret123");

  const { data: meData, refetch: refetchMe } = useQuery<{ me: Me }>(ME, {
    fetchPolicy: "cache-and-network",
  });
  const me = meData?.me ?? null;

  const [register] = useMutation(REGISTER);
  const [login] = useMutation(LOGIN);
  const [createAccount] = useMutation(CREATE_ACCOUNT);
  const [makeTx] = useMutation(MAKE_TX);

  const onAuth = (payload: any) => {
    const { accessToken, refreshToken } = payload || {};
    if (accessToken) localStorage.setItem("accessToken", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    refetchMe();
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    refetchMe();
  };

  const userId = me?.id;
  const { data: accountsData, refetch: refetchAccounts } = useQuery(
    ACCOUNTS_BY_USER,
    { skip: !userId, variables: { userId } }
  );

  const accounts = useMemo(() => accountsData?.accountsByUser ?? [], [accountsData]);

  const handleRegister = async () => {
    const res = await register({ variables: { input: { email, name, password } } });
    onAuth(res.data.registerUser);
  };

  const handleLogin = async () => {
    const res = await login({ variables: { input: { email, password } } });
    onAuth(res.data.loginUser);
  };

  const handleCreateAccount = async (type: "checking" | "savings" | "credit") => {
    if (!userId) return;
    const res = await createAccount({ variables: { input: { userId, type, openingCents: 0 } } });
    if (res.data?.createAccount) await refetchAccounts();
  };

  const handleMakeTx = async (accountId: string, type: "credit" | "debit", amountCents: number) => {
    await makeTx({
      variables: {
        input: {
          accountId,
          type,
          amountCents,
          description: type === "credit" ? "Top-up" : "Spend",
          requestId: `tx-${Date.now()}`,
        },
      },
    });
    await refetchAccounts();
  };

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-4xl px-6 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">Odysseus</h1>
          <div className="text-sm text-slate-600">
            {me ? `Signed in as ${me.name}` : "Not signed in"}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-6 space-y-6">
        {/* Auth Card */}
        <section className="card p-5 space-y-4">
          <h2 className="section-title">Authentication</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="input" placeholder="Name (for register)" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={handleRegister}>Register</button>
            <button className="btn" onClick={handleLogin}>Login</button>
            <button className="btn" onClick={logout}>Logout</button>
          </div>
          <p className="text-sm text-slate-600">
            <b>Me:</b> {me ? `${me.name} (${me.email})` : "not logged in"}
          </p>
        </section>

        {/* Accounts Card */}
        {me && (
          <section className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="section-title">Accounts</h2>
              <div className="flex gap-2">
                <button className="btn" onClick={() => handleCreateAccount("checking")}>New Checking</button>
                <button className="btn" onClick={() => handleCreateAccount("savings")}>New Savings</button>
                <button className="btn" onClick={() => handleCreateAccount("credit")}>New Credit</button>
              </div>
            </div>

            <ul className="grid gap-3 md:grid-cols-2">
              {accounts.map((a: any) => (
                <li key={a.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold capitalize">{a.type}</div>
                      <div className="text-sm text-slate-600">
                        Balance: <b>${(a.balanceCents / 100).toFixed(2)}</b>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="btn" onClick={() => handleMakeTx(a.id, "credit", 10000)}>+ $100</button>
                    <button className="btn" onClick={() => handleMakeTx(a.id, "debit", 2500)}>− $25</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
