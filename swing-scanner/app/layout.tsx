import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Swing Scanner — Options & Swing Trading Assistant",
  description: "Automatically finds stocks with trading opportunities, scans for chart patterns, tracks market-moving events.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-950 text-white antialiased`}>{children}</body>
    </html>
  );
}
