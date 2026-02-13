import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Booking- | Same stays. Better prices.",
  description: "LiteAPI-powered hotel booking platform MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} bg-slate-50 text-slate-900 antialiased`}>
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <div>
              <p className="text-lg font-bold tracking-tight">Booking-</p>
              <p className="text-xs text-slate-500">Same stays. Better prices.</p>
            </div>
            <Link
              href="/"
              className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-medium hover:bg-slate-100"
            >
              New search
            </Link>
          </div>
        </header>

        <main className="mx-auto min-h-[calc(100vh-64px)] max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
