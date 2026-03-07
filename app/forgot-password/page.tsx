import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="glass-card p-8">
          <h1 className="text-xl font-bold text-white mb-2">Reset password</h1>
          <p className="text-slate-400 text-sm mb-6">Enter your email and we’ll send you a reset link.</p>
          <ForgotPasswordForm />
          <Link href="/login" className="mt-4 inline-block text-accent-second text-sm hover:text-accent transition duration-200">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
