import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CloudShield - Monitoreo predictivo de infraestructura cloud",
  description:
    "Dashboard demo de monitoreo cloud con alertas predictivas basadas en Machine Learning.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
