import type { Metadata } from "next";
import { Anaheim } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";

const anaheim = Anaheim({
  variable: "--font-anaheim",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Job Board",
  description: "Find your next opportunity",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${anaheim.variable} h-full antialiased bg-white`}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
