import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Social Post Boards",
  description: "Bookmark social posts as live embeds, organized into boards."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
