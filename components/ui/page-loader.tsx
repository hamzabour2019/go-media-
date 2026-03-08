"use client";

import Image from "next/image";

export function PageLoader() {
  return (
    <div className="page-loader-bg fixed inset-0 z-[100] flex min-h-screen min-w-full flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="relative h-16 w-32">
          <Image
            src="/images/logo.png?v=2"
            alt="GO Media"
            fill
            className="object-contain object-center logo-white"
            priority
            unoptimized
          />
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent animate-bounce [animation-delay:0ms]" />
          <span className="h-2 w-2 rounded-full bg-accent animate-bounce [animation-delay:150ms]" />
          <span className="h-2 w-2 rounded-full bg-accent animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
