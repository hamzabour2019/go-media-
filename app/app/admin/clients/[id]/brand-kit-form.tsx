"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

const IMAGE_ACCEPT_ALL = "image/*,.heic,.heif,.avif,.webp,.bmp,.dib,.tif,.tiff,.ico,.jfif,.pjpeg,.pjp";

const schema = z.object({
  logo_url: z.string().url().optional().or(z.literal("")),
  guidelines_url: z.string().url().optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

export function BrandKitForm({
  clientId,
  initialData,
}: {
  clientId: string;
  initialData: { logo_url?: string; guidelines_url?: string } | null;
}) {
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      logo_url: initialData?.logo_url ?? "",
      guidelines_url: initialData?.guidelines_url ?? "",
    },
  });

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const name = `${clientId}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage.from("brand-assets").upload(name, file, {
      upsert: true,
      contentType: file.type || undefined,
    });
    setUploading(false);
    if (error) {
      console.error(error);
      return;
    }
    const { data: url } = supabase.storage.from("brand-assets").getPublicUrl(data.path);
    await supabase.from("brand_kits").upsert({ client_id: clientId, logo_url: url.publicUrl }, { onConflict: "client_id" });
    window.location.reload();
  }

  async function onSubmit(data: FormData) {
    await supabase
      .from("brand_kits")
      .upsert(
        {
          client_id: clientId,
          logo_url: data.logo_url || null,
          guidelines_url: data.guidelines_url || null,
        },
        { onConflict: "client_id" }
      );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-6 max-w-lg space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Logo</label>
        <input type="file" accept={IMAGE_ACCEPT_ALL} onChange={onFileChange} disabled={uploading} className="text-sm text-slate-400" />
        {initialData?.logo_url && (
          <img src={initialData.logo_url} alt="Logo" className="mt-2 h-20 object-contain" />
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Logo URL (optional)</label>
        <input {...register("logo_url")} className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white" />
        {errors.logo_url && <p className="mt-1 text-sm text-rose-400">{errors.logo_url.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Guidelines URL</label>
        <input {...register("guidelines_url")} className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white" />
      </div>
      <button type="submit" disabled={isSubmitting} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-second disabled:opacity-50 transition duration-200">
        Save Brand Kit
      </button>
    </form>
  );
}
