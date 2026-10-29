"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

type Mode = "login" | "register";

export function AuthForm({ mode, redirectTo }: { mode: Mode; redirectTo: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isLogin = mode === "login";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setErrors({});

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors(data.fields ?? {});
        toast.error(data.error ?? "Something went wrong");
        return;
      }

      toast.success(isLogin ? "Welcome back!" : "Account created");
      router.push(redirectTo);
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-pitch">
        {isLogin ? "Sign in" : "Create account"}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {isLogin
          ? "Access the cricket impact dashboard."
          : "The first account becomes the admin."}
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        {!isLogin && <Field label="Name" name="name" autoComplete="name" error={errors.name} />}
        <Field label="Email" name="email" type="email" autoComplete="email" error={errors.email} />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          error={errors.password}
        />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-pitch px-4 py-2 text-sm font-medium text-white transition hover:bg-pitch-dark disabled:opacity-60"
        >
          {pending ? "Please wait..." : isLogin ? "Sign in" : "Register"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        {isLogin ? "No account yet?" : "Already registered?"}{" "}
        <Link href={isLogin ? "/register" : "/login"} className="font-medium text-pitch hover:underline">
          {isLogin ? "Register" : "Sign in"}
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        className={`mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-pitch/30 ${
          error ? "border-red-400" : "border-slate-300"
        }`}
      />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
