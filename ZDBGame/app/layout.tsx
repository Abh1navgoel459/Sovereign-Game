import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZDBGame Workshop",
  description: "AI-Native Game World Demo powered by ZeroDB",
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
