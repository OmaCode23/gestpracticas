import type { Metadata } from "next";
import "../app/globals.css";
import Navbar from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "GestPrácticas — IES",
  description: "Sistema de gestión de prácticas del instituto",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Navbar />
        <main className="max-w-[1200px] mx-auto px-10 py-9">
          {children}
        </main>
      </body>
    </html>
  );
}
