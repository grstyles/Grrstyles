import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import TopBar from "@/components/navbar/TopBar";
import BottomNavigation from "@/components/layout/BottomNavigation";
import QuickViewWrapper from "@/components/ui/QuickViewWrapper";

import Script from "next/script";
import { IS_PRODUCTION } from '@/lib/config';

// Font configurations
const geistSans = Geist({ 
  variable: "--font-geist-sans", 
  subsets: ["latin"] 
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// ✅ Metadata
export const metadata: Metadata = {
  title: "GR STYLES - Wear Your Confidence",
  description: "Premium men's fashion and essentials designed for confidence.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

// ✅ Viewport
export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

// ✅ RootLayout - Single export
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${inter.variable}`}
    >
      <body className="font-sans antialiased bg-white text-gray-900">
        <Providers>
          <TopBar />
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <BottomNavigation />
          <QuickViewWrapper />
          
        </Providers>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />
        {IS_PRODUCTION && <Analytics />}
      </body>
    </html>
  );
}