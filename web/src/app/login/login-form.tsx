"use client";

import { useActionState } from "react";
import { LogIn, Loader2, AlertCircle, Lock } from "lucide-react";
import { login } from "@/lib/actions/auth";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <form action={formAction} className="rounded-2xl bg-white p-6 shadow-xl">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
        <Lock className="h-5 w-5 text-maroon-700" />
        Sign in
      </h2>

      <label className="mb-3 block">
        <span className="label">Email</span>
        <input name="email" type="email" required autoComplete="email" autoFocus placeholder="you@tamu.edu" className="input" />
      </label>
      <label className="block">
        <span className="label">Password</span>
        <input name="password" type="password" required autoComplete="current-password" placeholder="••••••••" className="input" />
      </label>

      {state?.error && (
        <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-red-600">
          <AlertCircle className="h-4 w-4" />
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary mt-5 w-full">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        Sign in
      </button>
    </form>
  );
}
