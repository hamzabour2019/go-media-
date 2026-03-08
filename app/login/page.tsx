import Image from "next/image";
import { redirect } from "next/navigation";
import { getProfile, getRedirectPath } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const profile = await getProfile();
  if (profile) {
    const path = await getRedirectPath(profile.role);
    redirect(path);
  }
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Content above animated bg overlay + pattern (from body) */}
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="glass-card p-8 md:p-10 shadow-[0_0_40px_rgba(0,150,255,0.08)]">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              <Image src="/images/logo.png?v=2" alt="GO Media" width={120} height={48} className="object-contain logo-white" unoptimized />
            </div>
            <h1 className="text-xl font-bold text-white">GO Media Agency</h1>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
