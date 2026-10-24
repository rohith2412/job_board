import type { Metadata } from "next";
import { Suspense } from "react";
import { Anaheim } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import PageTracker from "@/components/PageTracker";
import CookieConsent from "@/components/CookieConsent";
import RatePromo from "@/components/RatePromo";
import SessionProvider from "@/components/SessionProvider";
const anaheim = Anaheim({
  variable: "--font-anaheim",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Reblet | Curated Software Engineering Jobs in USA & Canada",
    template: "%s",
  },
  description:
    "Discover handpicked software engineering jobs at top tech companies in the USA and Canada.",
  icons: {
    icon: "/favicon.png",
  },
  metadataBase: new URL("https://www.reblet.com"),
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${anaheim.variable} h-full antialiased bg-white`}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <Navbar />
          <RatePromo />
          <Suspense fallback={null}><PageTracker /></Suspense>
          {children}
          <CookieConsent />
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
