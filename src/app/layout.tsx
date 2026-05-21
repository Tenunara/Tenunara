import type { Metadata } from "next"
import { Inter, Playfair_Display, DM_Sans } from "next/font/google"
import "./globals.css"

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
})

const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
})

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
})

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
    <html
      lang="id"
      className={`${inter.variable} ${playfair.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full font-body">{children}</body>
    </html>
  )
}
