import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const siteUrl = "https://www.jonasnygaard.com";

const title = "Jonas Nygaard — Designer & Developer";

const description =
  "Jonas Nygaard is a designer and developer based in Oslo, Norway, crafting interactive digital experiences through creative development, motion, and thoughtful design.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: title,
    template: "%s | Jonas Nygaard",
  },

  description,

  applicationName: "Jonas Nygaard Portfolio",

  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "Jonas Nygaard",
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary",
    title,
    description,
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
