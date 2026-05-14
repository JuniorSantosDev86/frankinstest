import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FrankInTest | QA Lead SaaS",
  description:
    "FrankInTest is a QA operating system for AI-assisted check-ups, professional QA workspace operations, reports, evidence, and documentation drift.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
