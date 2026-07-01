import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";
import { ThemeProvider } from "@/lib/theme-context";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "react-hot-toast";

/* SF Pro Display — for headlines & large text (20px+) */
const sfProDisplay = localFont({
  src: [
    { path: "../public/fonts/SF-Pro-Display-Light.otf", weight: "300", style: "normal" },
    { path: "../public/fonts/SF-Pro-Display-Regular.otf", weight: "400", style: "normal" },
    { path: "../public/fonts/SF-Pro-Display-Medium.otf", weight: "500", style: "normal" },
    { path: "../public/fonts/SF-Pro-Display-Semibold.otf", weight: "600", style: "normal" },
    { path: "../public/fonts/SF-Pro-Display-Bold.otf", weight: "700", style: "normal" },
    { path: "../public/fonts/SF-Pro-Display-Heavy.otf", weight: "800", style: "normal" },
    { path: "../public/fonts/SF-Pro-Display-Black.otf", weight: "900", style: "normal" },
  ],
  variable: "--font-sf-display",
  display: "swap",
});

/* SF Pro Text — for body text & UI elements (under 20px) */
const sfProText = localFont({
  src: [
    { path: "../public/fonts/SF-Pro-Text-Light.otf", weight: "300", style: "normal" },
    { path: "../public/fonts/SF-Pro-Text-Regular.otf", weight: "400", style: "normal" },
    { path: "../public/fonts/SF-Pro-Text-Medium.otf", weight: "500", style: "normal" },
    { path: "../public/fonts/SF-Pro-Text-Semibold.otf", weight: "600", style: "normal" },
    { path: "../public/fonts/SF-Pro-Text-Bold.otf", weight: "700", style: "normal" },
    { path: "../public/fonts/SF-Pro-Text-Heavy.otf", weight: "800", style: "normal" },
    { path: "../public/fonts/SF-Pro-Text-Black.otf", weight: "900", style: "normal" },
  ],
  variable: "--font-sf-text",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Legal AI Assistant",
  description: "Advanced Legal AI for Indian Law",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sfProDisplay.variable} ${sfProText.variable} ${sfProText.className} antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <AppLayout>{children}</AppLayout>
            <Toaster position="bottom-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
