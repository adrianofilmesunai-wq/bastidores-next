import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Bastidores do Agro",
  description: "Informação estratégica, bastidores e análises do agro brasileiro.",
  openGraph: {
    title: "Bastidores do Agro",
    description: "Informação estratégica, bastidores e análises do agro brasileiro.",
    images: ["https://i.ibb.co/XxLvt9GD/bandeira-completa.png"],
    url: "https://www.bastidoresdoagro.com.br",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bastidores do Agro",
    description: "Informação estratégica, bastidores e análises do agro brasileiro.",
    images: ["https://i.ibb.co/XxLvt9GD/bandeira-completa.png"],
  },
  icons: {
    icon: "https://up.svplay.cv/u/NLsRO9.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" className="scroll-smooth">
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
