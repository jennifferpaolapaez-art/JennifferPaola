import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAIZ — la Memoria del Salón para educadoras de primera infancia",
  description:
    "RAIZ conecta lo que sabes de cada niño con tu próxima planeación. Menos tiempo perdido, más individualización, sin dejar de enseñar a tu manera.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
