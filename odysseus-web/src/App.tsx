import { useQuery, useMutation } from "@apollo/client";
import { useEffect, useMemo, useState } from "react";
import { ACCOUNTS_BY_USER, CREATE_ACCOUNT, LOGIN, MAKE_TX, ME, REGISTER } from "./lib/gql";

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
    {
      skip: !userId,
      variables: { userId },
    }
  );

  const accounts = useMemo(
    () => accountsData?.accountsByUser ?? [],
    [accountsData]
  );

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

  const handleMakeTx = async (
    accountId: string,
    type: "credit" | "debit",
    amountCents: number
  ) => {
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
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Odysseus — Minimal Client</h1>

      {/* Auth */}
      <section className="space-y-2 border p-4 rounded">
        <h2 className="font-semibold">Auth</h2>
        <input className="border p-2 rounded" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="border p-2 rounded" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="border p-2 rounded" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="flex gap-2">
          <button className="border px-3 py-2 rounded" onClick={handleRegister}>Register</button>
          <button className="border px-3 py-2 rounded" onClick={handleLogin}>Login</button>
          <button className="border px-3 py-2 rounded" onClick={logout}>Logout</button>
        </div>
        <div><b>Me:</b> {me ? `${me.name} (${me.email})` : "not logged in"}</div>
      </section>

      {/* Accounts */}
      {me && (
        <section className="space-y-2 border p-4 rounded">
          <h2 className="font-semibold">Accounts</h2>
          <div className="flex gap-2">
            <button className="border px-3 py-2 rounded" onClick={() => handleCreateAccount("checking")}>New Checking</button>
            <button className="border px-3 py-2 rounded" onClick={() => handleCreateAccount("savings")}>New Savings</button>
            <button className="border px-3 py-2 rounded" onClick={() => handleCreateAccount("credit")}>New Credit</button>
          </div>
          <ul className="space-y-2">
            {accounts.map((a: any) => (
              <li key={a.id} className="border p-3 rounded">
                <div><b>{a.type}</b> • Balance: {(a.balanceCents/100).toFixed(2)} CAD</div>
                <button className="border px-2 py-1 rounded" onClick={() => handleMakeTx(a.id, "credit", 10000)}>+ $100</button>
                <button className="border px-2 py-1 rounded" onClick={() => handleMakeTx(a.id, "debit", 2500)}>− $25</button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
