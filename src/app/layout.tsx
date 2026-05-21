import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
})

// TODO: Update metadata when official brand assets and description are finalized
export const metadata: Metadata = {
  title: "TENUNARA — Ekonomi Sirkular untuk Limbah Tekstil Indonesia",
  description:
    "Platform circular economy yang menghubungkan UMKM konveksi dengan pengrajin lokal. AI mengidentifikasi, menggrade, dan mencocokkan limbah tekstil secara otomatis.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
