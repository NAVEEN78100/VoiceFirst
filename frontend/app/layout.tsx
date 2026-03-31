import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/context/AuthContext";

const inter = Inter({ subsets: ["latin"], display: 'swap' });

export const metadata: Metadata = {
  title: "VoiceFirst Premium Auth",
  description: "Secure, scalable, and beautifully designed role-based access control.",
  icons: {
    icon: '/favicon.ico'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
