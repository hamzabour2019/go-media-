"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  name: z.string().min(1, "Name required"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function CreateClientForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    const supabase = createClient();
    const { data: row, error } = await supabase
      .from("clients")
      .insert({ name: data.name, notes: data.notes ?? null })
      .select("id")
      .single();
    if (error) {
      console.error(error);
      return;
    }
    router.push(`/app/admin/clients/${row.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-6 max-w-md space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
        <input
          {...register("name")}
          className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white"
        />
        {errors.name && <p className="mt-1 text-sm text-rose-400">{errors.name.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
        <textarea
          {...register("notes")}
          rows={3}
          className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-second disabled:opacity-50 transition duration-200"
      >
        Create Client
      </button>
    </form>
  );
}
