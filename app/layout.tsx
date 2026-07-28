import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "TB AI Office", description: "LVI-Valvonta T.B:n AI-työtila" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fi"><body>{children}</body></html>;
}
