import { LoginForm } from "./login-form";
import { Gauge } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-maroon-900 to-maroon-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center text-white">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Gauge className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-xl font-bold">UES Reliability Dashboard</h1>
          <p className="text-sm text-maroon-200">Texas A&amp;M University · Utilities &amp; Energy Services</p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
