"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions/auth";
import { colors, fieldInputStyle, fieldLabelStyle } from "@/lib/theme";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <form action={formAction}>
      <div style={{ marginBottom: 14 }}>
        <label style={fieldLabelStyle}>Email</label>
        <input name="email" type="email" required autoComplete="email" placeholder="you@ues.edu" style={fieldInputStyle} />
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={fieldLabelStyle}>Password</label>
        <input name="password" type="password" required autoComplete="current-password" placeholder="••••••••" style={fieldInputStyle} />
      </div>
      {state?.error && (
        <p style={{ margin: "0 0 14px", fontSize: 12.5, color: colors.danger }}>{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        style={{
          width: "100%",
          padding: "10px 0",
          borderRadius: 7,
          border: "none",
          fontSize: 13.5,
          fontWeight: 600,
          cursor: pending ? "not-allowed" : "pointer",
          background: pending ? colors.border : colors.accent,
          color: pending ? colors.textGhostDark : "#0a0d12",
        }}
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
