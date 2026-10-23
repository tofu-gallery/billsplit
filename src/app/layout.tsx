import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { NuqsAdapter } from "nuqs/adapters/next/app";
// Tofu: changed. Upstream loaded Plausible analytics for usebillsplit.com here,
// which would report every visit to a copy of this app to upstream's
// analytics account, so this copy loads no analytics script.
const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BillSplit - Scan. Tap. Split.",
  description:
    "Snap the receipt, tap your items, see who owes what. No sign-ups, no math, no drama.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${instrumentSans.variable} antialiased`}>
        <NuqsAdapter>
          <div className="flex flex-col min-h-screen items-center bg-[#f4eeec] w-full mx-auto relative overflow-hidden">
            <Header />
            {children}
            <Footer />
          </div>
        </NuqsAdapter>
      </body>
    </html>
  );
}
