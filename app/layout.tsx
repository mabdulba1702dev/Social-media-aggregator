import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

// Modernist design system (docs/Social media embed aggregator UI) uses
// Archivo for both heading and body — self-hosted via next/font so there's
// no external request/layout shift, unlike a raw <link> to Google Fonts.
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo" });

export const metadata: Metadata = {
  title: "Social Post Boards",
  description: "Bookmark social posts as live embeds, organized into boards."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={archivo.variable}>
      <body>{children}</body>
    </html>
  );
}
