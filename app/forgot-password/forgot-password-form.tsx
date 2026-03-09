"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({ email: z.string().email("Invalid email") });
type FormData = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setError(null);
    const { error: e } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/reset-password`,
    });
    if (e) {
      setError(e.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-2">
        <p className="text-emerald-400 text-sm">Check your email for the reset link.</p>
        <p className="text-slate-400 text-xs">
          Open the latest reset email in this browser to finish setting a new password inside the app.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <p className="text-rose-400 text-sm">{error}</p>}
      <input {...register("email")} type="email" placeholder="Email" className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white" />
      <p className="text-slate-500 text-xs">
        We will email you a link that brings you back here to finish the password reset.
      </p>
      <button type="submit" disabled={isSubmitting} className="rounded-lg bg-accent px-4 py-2 text-sm text-white hover:bg-accent-second disabled:opacity-50 transition duration-200">Send reset link</button>
    </form>
  );
}
