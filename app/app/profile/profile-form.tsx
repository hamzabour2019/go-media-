"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { updateMyAvatar, updateMyProfile } from "@/app/actions/profile";

const IMAGE_ACCEPT_ALL = "image/*,.heic,.heif,.avif,.webp,.bmp,.dib,.tif,.tiff,.ico,.jfif,.pjpeg,.pjp";

const schema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  address: z.string().optional(),
  email: z.string().email("بريد غير صالح").optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export type ProfileForForm = {
  id: string;
  name: string;
  role: string;
  email?: string | null;
  address?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  notes?: string | null;
  is_active?: boolean;
};

export function ProfileForm({ profile }: { profile: ProfileForForm }) {
  const supabase = createClient();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: profile.name ?? "",
      address: profile.address ?? "",
      email: profile.email ?? "",
      phone: profile.phone ?? "",
      notes: profile.notes ?? "",
    },
  });

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const byMime = file?.type?.startsWith("image/");
    const byExtension = /\.(png|jpe?g|gif|webp|bmp|dib|tiff?|heic|heif|avif|ico|jfif|pjpeg|pjp)$/i.test(file?.name ?? "");
    if (!file || (!byMime && !byExtension)) return;
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${profile.id}/avatar.${ext}`;
    const { data, error } = await supabase.storage.from("avatars").upload(path, file, {
      upsert: true,
      contentType: file.type || undefined,
    });
    setUploading(false);
    if (error) {
      toast.error("فشل رفع الصورة");
      return;
    }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(data.path);
    setAvatarUrl(urlData.publicUrl);
    const result = await updateMyAvatar({ avatarUrl: urlData.publicUrl });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("تم تحديث الصورة");
    router.refresh();
  }

  async function onSubmit(data: FormData) {
    const result = await updateMyProfile({
      name: data.name,
      address: data.address || "",
      email: data.email || "",
      phone: data.phone || "",
      notes: data.notes || "",
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("تم حفظ التعديلات");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-6 space-y-5 max-w-lg">
      {/* صورة شخصية */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">الصورة الشخصية</label>
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Avatar" fill className="object-cover" unoptimized />
            ) : (
              <span className="text-slate-500 text-2xl">?</span>
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept={IMAGE_ACCEPT_ALL}
              onChange={onAvatarChange}
              disabled={uploading}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/15 transition disabled:opacity-50"
            >
              {uploading ? "جاري الرفع…" : "اختيار صورة"}
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">الاسم الكامل</label>
        <input
          {...register("name")}
          className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white placeholder-slate-500"
          placeholder="الاسم الكامل"
        />
        {errors.name && <p className="mt-1 text-sm text-rose-400">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">العنوان</label>
        <input
          {...register("address")}
          className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white placeholder-slate-500"
          placeholder="العنوان"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">بريد التواصل</label>
        <input
          {...register("email")}
          type="email"
          className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white placeholder-slate-500"
          placeholder="example@email.com"
        />
        {errors.email && <p className="mt-1 text-sm text-rose-400">{errors.email.message}</p>}
        <p className="mt-1 text-xs text-slate-500">هذا الحقل للتواصل الداخلي فقط ولا يغيّر بريد تسجيل الدخول.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">رقم الهاتف</label>
        <input
          {...register("phone")}
          type="tel"
          className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white placeholder-slate-500"
          placeholder="+966..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">ملاحظات</label>
        <textarea
          {...register("notes")}
          rows={3}
          className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white placeholder-slate-500 resize-none"
          placeholder="ملاحظات شخصية (للاستخدام الداخلي)"
        />
      </div>

      <p className="text-slate-400 text-sm">الدور: {profile.role}</p>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-second disabled:opacity-50 transition duration-200"
      >
        حفظ
      </button>
    </form>
  );
}
