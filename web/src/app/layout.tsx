import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "UES Reliability Dashboard | TAMU Utilities & Energy Services",
  description: "Utility Energy Services reliability and equipment tracking",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`}>
      <body>{children}</body>
    </html>
  );
}
