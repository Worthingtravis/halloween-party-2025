import type { Metadata, Viewport } from 'next'
import "../styles/globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Navbar } from "@/components/Navbar"

export const metadata: Metadata = {
  title: 'Halloween Costume Contest',
  description: 'Mobile-first Halloween costume contest with QR-based registration and voting',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Halloween Contest',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#222222', // Force dark theme
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark touch-manipulation">
      <body className="min-h-screen antialiased">
        <Navbar />
        {children}
        <Toaster />
      </body>
    </html>
  )
}