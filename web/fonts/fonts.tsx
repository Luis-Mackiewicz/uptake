import { Anton, Inter } from "next/font/google";

export const display = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

export const sans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});
