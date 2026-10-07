import type { Metadata } from "next";

import { SiteHeader } from "@/app/components/site-header";

import "./globals.css";

export const metadata: Metadata = {
  title: "Caption Court | Ready for Judgment",
  description:
    "Submit photo evidence. AI writes the captions. You deliver the verdict.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
