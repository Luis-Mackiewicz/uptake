import type { ReactNode } from "react";
import type { Metadata } from "next";
import { display, sans } from "@/fonts/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Uptake",
  description: "Organize seus estudos em um só lugar.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen bg-neutral-50 font-sans text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
