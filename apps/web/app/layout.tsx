import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LA MV Census",
  description: "Inteligencia de sentimiento cívico",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
