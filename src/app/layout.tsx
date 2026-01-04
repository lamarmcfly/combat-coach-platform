import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/navigation/TopNav";
import { Footer } from "@/components/navigation/Footer";
import { Providers } from "@/components/providers/Providers";
import { GlobalErrorBoundary } from "@/components/error/GlobalErrorBoundary";
import { CookieConsentBanner } from "@/components/cookies";

const display = Bebas_Neue({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Corner | Combat Sports Coaching Marketplace",
  description: "Train with verified combat coaches across Muay Thai, boxing, MMA, wrestling, and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${bodyFont.variable} dark`} suppressHydrationWarning>
      <body className="min-h-screen bg-[#0b0b0c] dark:bg-[#0b0b0c] light:bg-gray-50 text-copy dark:text-copy light:text-gray-900 antialiased transition-colors">
        <Providers>
          <GlobalErrorBoundary>
            <TopNav />
            <main>{children}</main>
            <Footer />
            <CookieConsentBanner />
          </GlobalErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
