"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { inviteUserByEmail, createUserWithPassword } from "@/app/actions/invite-user";
import type { Role } from "@/lib/auth/session";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email("Invalid email"),
  role: z.enum(["ADMIN", "SUPERVISOR", "SMM", "DESIGNER", "EDITOR"]),
  usePassword: z.boolean().optional(),
  password: z.string().min(6).optional(),
}).superRefine((data, ctx) => {
  if (data.usePassword && !data.password) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["password"],
      message: "Temporary password is required",
    });
  }
});
type FormData = z.infer<typeof schema>;

const ROLES: Role[] = ["ADMIN", "SUPERVISOR", "SMM", "DESIGNER", "EDITOR"];

export function InviteUserForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "DESIGNER", usePassword: false },
  });
  const usePassword = watch("usePassword");

  async function onSubmit(data: FormData) {
    setLoading(true);
    const result = data.usePassword
      ? await createUserWithPassword(data.email, data.password ?? "", data.role)
      : await inviteUserByEmail(data.email, data.role);
    setLoading(false);
    if (result.ok) {
      toast.success(result.message);
      onSuccess();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
        <input {...register("email")} type="email" className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white" placeholder="user@agency.com" />
        {errors.email && <p className="mt-1 text-sm text-rose-400">{errors.email.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
        <select {...register("role")} className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white">
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-400">
        <input type="checkbox" {...register("usePassword")} className="rounded border-white/20" />
        Create with temporary password (user signs in immediately)
      </label>
      {usePassword && (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Temporary password</label>
          <input {...register("password")} type="password" className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white" placeholder="Min 6 characters" />
          {errors.password && <p className="mt-1 text-sm text-rose-400">{errors.password.message}</p>}
        </div>
      )}
      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={loading} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-second disabled:opacity-50 transition duration-200">
          {loading ? "Sending…" : "Invite / Create"}
        </button>
      </div>
    </form>
  );
}
