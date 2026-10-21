import type { Metadata } from "next";
import { Anaheim } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
const anaheim = Anaheim({
  variable: "--font-anaheim",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Reblet | Curated Software Engineering Jobs in Canada",
    template: "%s",
  },
  description:
    "Discover handpicked software engineering jobs at top Canadian tech companies.",
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
        <Navbar />
        {children}
      </body>
    </html>
  );
}
