import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UES Reliability Dashboard",
  description: "Utility Energy Services reliability and equipment tracking",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
