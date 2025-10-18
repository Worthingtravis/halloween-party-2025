import type { Metadata, Viewport } from 'next'
import "../styles/globals.css"
import { Toaster } from "@/components/ui/toaster"

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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#222222' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="touch-manipulation">
      <body className="min-h-screen antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}