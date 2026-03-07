"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: FormData) {
    setError(null);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-200 text-sm px-4 py-3">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white placeholder-slate-500 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition duration-200"
          placeholder="you@agency.com"
          {...register("email")}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-rose-400">{errors.email.message}</p>
        )}
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white placeholder-slate-500 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition duration-200"
          placeholder="••••••••"
          {...register("password")}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-rose-400">{errors.password.message}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-white hover:bg-accent-second focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-[var(--bg)] disabled:opacity-50 transition duration-200"
      >
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-slate-500 text-sm mt-2">
        <Link href="/forgot-password" className="text-accent-second hover:text-accent transition duration-200">Forgot password?</Link>
      </p>
    </form>
  );
}
