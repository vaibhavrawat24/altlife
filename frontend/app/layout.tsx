import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  variable: "--font-space-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "altlife - Simulate Your Life Decisions with AI",
  description: "altlife uses a network of AI agents to simulate how your life decisions play out - quitting your job, moving abroad, starting a business, and more. Get a 12-month projection in seconds.",
  keywords: [
    "life decision simulator",
    "AI life simulator",
    "simulate future",
    "predict life outcomes",
    "AI agents simulation",
    "multi-agent AI",
    "what if simulator",
    "career decision tool",
    "quit job simulator",
    "life planning AI",
    "simulate your decision",
    "AI future prediction",
    "spawn agents",
    "decision making tool",
  ],
  authors: [{ name: "altlife" }],
  creator: "altlife",
  metadataBase: new URL("https://altlife.vercel.app"),
  openGraph: {
    title: "altlife - Simulate Your Life Decisions with AI",
    description: "A network of AI agents simulates how your decisions unfold over 12 months. Try quitting your job, moving abroad, or starting a business.",
    url: "https://altlife.vercel.app",
    siteName: "altlife",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "altlife - AI Life Decision Simulator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "altlife - Simulate Your Life Decisions with AI",
    description: "A network of AI agents simulates how your decisions unfold over 12 months.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
    },
  },
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
      className={`${geistSans.variable} ${geistMono.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Runs before hydration — sets data-theme from localStorage to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('altlife-theme') || 'light';
            document.documentElement.setAttribute('data-theme', t);
          } catch(e) {}
        `}} />
        {children}
      </body>
    </html>
  );
}
