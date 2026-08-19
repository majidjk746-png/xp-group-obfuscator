import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "XpGroup Obfuscator — .NET Assembly Protector",
  description:
    "Professional-grade .NET obfuscator. Encrypt strings, flatten control flow, virtualize bytecode, and deploy native C++ stubs to make reverse engineering impractical.",
  keywords: [".NET", "obfuscator", "protector", "decompiler", "anti-tamper", "encryption"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="scan-line" />
        {children}
      </body>
    </html>
  );
}
