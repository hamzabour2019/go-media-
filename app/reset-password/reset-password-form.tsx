"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

const schema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export function ResetPasswordForm() {
  const supabase = createClient();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setReady(Boolean(data.session));
      setChecking(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
      }
      setChecking(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function onSubmit(data: FormData) {
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password: data.password });
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await supabase.auth.signOut();
    setDone(true);
    router.refresh();
  }

  if (checking) {
    return <p className="text-slate-400 text-sm">Checking reset session…</p>;
  }

  if (!ready) {
    return (
      <div className="space-y-3">
        <p className="text-amber-200 text-sm">
          This reset link is no longer active. Request a new password reset email to continue.
        </p>
        <p className="text-slate-400 text-xs">
          If you just opened the email, make sure you used the latest link and completed it in the same browser.
        </p>
        <Link href="/forgot-password" className="text-accent-second hover:text-accent text-sm transition duration-200">
          Request a new reset link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-3">
        <p className="text-emerald-300 text-sm">Your password has been updated. Sign in with the new password.</p>
        <Link href="/login" className="text-accent-second hover:text-accent text-sm transition duration-200">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <p className="text-rose-400 text-sm">{error}</p>}
      <p className="text-slate-400 text-xs">
        This page works only after opening a valid recovery link from your email.
      </p>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">New password</label>
        <input
          {...register("password")}
          type="password"
          autoComplete="new-password"
          className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white"
        />
        {errors.password && <p className="mt-1 text-sm text-rose-400">{errors.password.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Confirm password</label>
        <input
          {...register("confirmPassword")}
          type="password"
          autoComplete="new-password"
          className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white"
        />
        {errors.confirmPassword && <p className="mt-1 text-sm text-rose-400">{errors.confirmPassword.message}</p>}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-second disabled:opacity-50 transition duration-200"
      >
        {isSubmitting ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
