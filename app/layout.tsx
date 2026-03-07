import type { Metadata, Viewport } from "next";
import { Rubik, Cairo } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["latin", "arabic"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GO Media Agency Task Manager (M-TM)",
  description: "Agency task manager with role-based dashboards",
  icons: {
    icon: "/images/logo.png?v=2",
    apple: "/images/logo.png?v=2",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${rubik.variable} ${cairo.variable}`}>
      <body className="go-animated-bg min-h-screen font-sans">{children}<Toaster theme="dark" position="top-right" richColors /></body>
    </html>
  );
}
