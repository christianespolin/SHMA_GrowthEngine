import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SHMA Growth Engine",
  description: "AI-assisted prospecting and sales funnel for SH Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className="bg-slate-950 text-slate-200 antialiased min-h-full font-sans">
        {children}
      </body>
    </html>
  );
}
