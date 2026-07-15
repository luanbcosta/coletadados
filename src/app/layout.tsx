import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Defensoria Pública - Coleta de Dados",
  description: "Formulário de coleta de dados de assistidos",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
