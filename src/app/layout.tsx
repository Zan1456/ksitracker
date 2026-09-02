import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/toaster";
import { MotionProvider } from "@/components/motion/motion-provider";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Repline — Edzéskövető klub",
  description: "Kövesd a fejlődésed szintenkénti edzéstervekkel, időzítővel és ranglistával.",
};

// Repline is dark-only — no theme toggle, no light variant to flash to.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="hu" className={`${plusJakartaSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-text">
        <MotionProvider>
          {children}
          <Toaster />
        </MotionProvider>
      </body>
    </html>
  );
}
