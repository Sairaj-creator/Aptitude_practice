import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Placement Preparation Platform",
  description: "Practice, analytics, mastery tracking, and company-specific placement simulation."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
