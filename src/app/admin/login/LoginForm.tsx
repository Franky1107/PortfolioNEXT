"use client";

import { useActionState } from "react";
import { login, type FormState } from "../actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(login, {});
  return (
    <form action={action} className="mx-auto mt-[12svh] flex max-w-sm flex-col gap-6">
      <h1 className="type-heavy text-5xl uppercase">Sign in</h1>
      <label className="flex flex-col gap-3">
        <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-white/60">Password</span>
        <input
          type="password"
          name="password"
          required
          autoFocus
          autoComplete="current-password"
          className="border-b border-white/25 bg-transparent pb-3 text-lg outline-none focus:border-accent"
        />
      </label>
      {state.error && <p role="alert" className="font-mono text-[12px] text-accent">{state.error}</p>}
      <button disabled={pending} className="type-heavy self-start border-b-2 border-white pb-1 text-2xl uppercase hover:border-accent hover:text-accent disabled:opacity-50">
        {pending ? "Checking…" : "Enter"}
      </button>
    </form>
  );
}
