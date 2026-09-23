import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: 'TradeFlow — AI-Powered Trading Intelligence',
  description: 'The AI copilot for HK & SZ trading companies. From inquiry to RFQ to quoted — cited, human-approved, in hours, not days.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
