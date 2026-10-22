import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "A World in Progress — Sreerag Pariyarath",
  description: "Walk through a little world of things I've built. An interactive sketchbook by Sreerag Pariyarath.",
  robots: { index: false, follow: false },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
