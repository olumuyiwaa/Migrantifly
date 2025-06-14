import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import Link from 'next/link'

export default function NotFound() {
  return (
    <main>
      <Header />
      <div className="py-20 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Post Not Found</h1>
        <p className="text-gray-600 mb-6">The blog post you're looking for doesn't exist.</p>
        <Link href="/blog" className="text-blue-600 hover:text-blue-800 font-medium">
          Return to Blog
        </Link>
      </div>
      <Footer />
    </main>
  )
}