import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import EmergencyButton from "@/components/ui/EmergencyButton";
import Chatbot from "@/components/ui/Chatbot";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "SafeHer AI | AI-Powered Women Safety Prediction",
  description: "Analyze crime patterns, environmental conditions, and live safety signals to help women make safer decisions in real time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <Chatbot />
        <EmergencyButton />
      </body>
    </html>
  );
}
