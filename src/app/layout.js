import './globals.css'

export const metadata = {
  title: 'Migrantifly - Your Migration Journey Starts Here',
  description: 'From dreaming to thriving - we guide you through every step of your migration journey.',
   icons: {
      icon: '/logo/logo.png',
    },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}