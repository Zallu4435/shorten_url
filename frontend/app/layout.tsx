import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Shorten URL — Smart Link Shortener",
    template: "%s | Shorten URL",
  },
  description:
    "A production-grade URL shortener with analytics, QR codes, private links, AI-powered slug suggestions, and advanced redirect rules.",
  keywords: ["url shortener", "link shortener", "analytics", "qr code", "custom alias"],
  openGraph: {
    type: "website",
    title: "Shorten URL",
    description: "Smart link shortener with analytics, QR codes & AI features.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={200}>
            <Providers>
              {children}
              <Toaster
                position="bottom-right"
                toastOptions={{
                  classNames: {
                    toast:
                      "bg-card border border-border text-foreground shadow-lg",
                    description: "text-muted-foreground",
                    actionButton: "bg-primary text-primary-foreground",
                    cancelButton: "bg-muted text-muted-foreground",
                    error: "border-destructive/50",
                    success: "border-emerald-500/30",
                  },
                }}
              />
            </Providers>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
