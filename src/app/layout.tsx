import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recepción de fotografías | CREE",
  description:
    "Formulario público y panel administrativo para recepción y gestión de solicitudes con imágenes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
