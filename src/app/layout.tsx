import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpyRoom - Find the Spy",
  description: "A real-time social deduction game where players try to uncover the spy among them",
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
