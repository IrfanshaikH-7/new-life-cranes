import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "New Life Cranes",
  description: "Workforce management workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-svh">{children}</body>
    </html>
  );
}
