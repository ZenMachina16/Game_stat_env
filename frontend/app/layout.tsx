import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope"
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora"
});

export const metadata: Metadata = {
  title: "F5 League Badlapur 2026",
  description: "Cricket tournament dashboard for matches, players, teams, and scorecards."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} ${sora.variable} font-sans`}>
        <ThemeProvider>
          <Navbar />
          <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
