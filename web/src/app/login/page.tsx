import { LoginForm } from "./login-form";
import { colors } from "@/lib/theme";
import { Gauge } from "lucide-react";

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: colors.bg,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: colors.bgPanel,
          border: `1px solid ${colors.borderSubtle}`,
          borderRadius: 14,
          padding: "28px 26px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22 }}>
          <Gauge size={20} color={colors.accent} />
          <span style={{ fontSize: 16, fontWeight: 600, color: colors.text }}>UES Reliability</span>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
