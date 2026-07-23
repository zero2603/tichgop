import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Savings Tracker",
  description: "Personal balance snapshot tracker",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Tích góp",
    statusBarStyle: "default"
  },
  formatDetection: {
    telephone: false
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-paper text-ink antialiased">
        <main className="mx-auto min-h-svh w-full max-w-md px-4 py-5 sm:py-6">{children}</main>
      </body>
    </html>
  );
}
