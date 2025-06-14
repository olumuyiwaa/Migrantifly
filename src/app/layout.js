import './globals.css'

export const metadata = {
  title: 'Migrantifly - Your Migration Journey Starts Here',
  description: 'From dreaming to thriving - we guide you through every step of your migration journey.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}