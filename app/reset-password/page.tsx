import Link from "next/link";
import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="glass-card p-8">
          <h1 className="text-xl font-bold text-white mb-2">Set a new password</h1>
          <p className="text-slate-400 text-sm mb-6">
            Finish the recovery flow by choosing a new password for your account. If you arrived here from email,
            keep this tab open until the recovery session loads.
          </p>
          <ResetPasswordForm />
          <Link href="/login" className="mt-4 inline-block text-accent-second text-sm hover:text-accent transition duration-200">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
