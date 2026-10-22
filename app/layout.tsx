import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ToastProvider } from "@/context/ToastContext";
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/providers/QueryProvider";
import ClientSessionProvider from "@/components/ClientSessionProvider";
import { SocketProvider } from "@/context/SocketProvider";


const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

const instrumentSerif = localFont({
  src: [
    {
      path: "./fonts/InstrumentSerif-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/InstrumentSerif-Italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TaskFlow — a considered workspace",
  description:
    "Tasks, notes, mind maps and focus sessions in one quiet, fast workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
    >
      <body className="antialiased bg-background text-foreground transition-colors duration-200">
        <ClientSessionProvider>
          <ThemeProvider>
            <QueryProvider>
              <SocketProvider>
                <ToastProvider>
                  {children}
                  <Toaster />
                </ToastProvider>
              </SocketProvider>
            </QueryProvider>
          </ThemeProvider>
        </ClientSessionProvider>
      </body>
    </html>
  );
}