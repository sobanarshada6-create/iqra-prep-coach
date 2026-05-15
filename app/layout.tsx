import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Iqra Prep Coach — FGEI BPS-15 Assistant AI Tutor",
  description: "Personal AI tutor for FGEI BPS-15 Assistant exam preparation with daily fresh MCQs, tests, interview coaching and progress tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
