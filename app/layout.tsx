import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tích góp",
  description: "Tích góp cá nhân của tôi",
  manifest: "/manifest.webmanifest",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false
    }
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.webp", sizes: "500x500", type: "image/webp" }
    ],
    shortcut: "/favicon-32.png",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
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
