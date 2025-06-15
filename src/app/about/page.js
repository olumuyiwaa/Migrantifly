import Header from '../../components/Header'
import Footer from '../../components/Footer'
import Image from 'next/image'
import posts from '../../data/posts';
import Link from 'next/link';

export default function About() {
  const displayPosts = posts.slice(0, 2);
  return (
    <main>
      <Header />
      <div
        className="relative bg-slate-800 py-20 bg-cover bg-center min-h-[45vh]"
        style={{ backgroundImage: "url('/your-image-path.jpg')" }} // Replace with your image path
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 text-center text-white items-center pt-24">
          <h1 className="text-5xl font-bold mb-4">About Us</h1>
          <p className="text-xl max-w-2xl mx-auto px-4">
            From dreaming to thriving — we guide you through every step of your migration journey
          </p>
        </div>
      </div>

      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  At Migrantifly, we believe migration is more than just getting a visa. It's about building a future. Born from a team of migrants and advisors who understand the challenges firsthand, Migrantifly was created to simplify, support, and celebrate your journey to a new home.
                </p>
                <p>
                  At Migrantifly, we believe migration is more than just getting a visa. It's about building a future. Born from a team of migrants and advisors who understand the challenges firsthand, Migrantifly was created to simplify, support, and celebrate your journey to a new home.
                </p>
              </div>
            </div>
            <Image
              src="/images/about.png"
              alt="About us image"
              width={600}
              height={384}
              className="relative h-96 rounded-lg overflow-hidden w-full h-full flex items-center justify-center"
              priority
            />
          </div>
        </div>
      </div>
 <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         
      <div className="bg-primary-900 text-white py-16 rounded-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
              <p className="text-blue-100">
                To empower aspiring migrants with expert advice, comprehensive guidance, and real-world support, making every step from dreaming to settling seamless and stress-free.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
              <div className="space-y-2 text-blue-100">
                <div className="flex items-center justify-center">
                  <span className="w-2 h-2 bg-gold-400 rounded-full mr-2"></span>
                  <span>Integrity</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="w-2 h-2 bg-gold-400 rounded-full mr-2"></span>
                  <span>Excellence</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="w-2 h-2 bg-gold-400 rounded-full mr-2"></span>
                  <span>Empathy</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="w-2 h-2 bg-gold-400 rounded-full mr-2"></span>
                  <span>Trust & Security</span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">Our Values</h3>
              <div className="space-y-2 text-blue-100">
                <div className="flex items-center justify-center">
                  <span className="w-2 h-2 bg-gold-400 rounded-full mr-2"></span>
                  <span>Integrity</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="w-2 h-2 bg-gold-400 rounded-full mr-2"></span>
                  <span>Excellence</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="w-2 h-2 bg-gold-400 rounded-full mr-2"></span>
                  <span>Empathy</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="w-2 h-2 bg-gold-400 rounded-full mr-2"></span>
                  <span>Trust & Security</span>
                </div>
              </div>
            </div>
          </div>
        </div></div></div>
      </div>

      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center">Latest News</h2>
          <div className="grid md:grid-cols-2 gap-8">
        {displayPosts.map((post, index) => (
        <article className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
        {/* Content Section */}
        <div className="p-6">
          {/* Date */}
          <div className="text-sm text-gray-500 mb-3">
            {post.publishDate}
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 mb-4 leading-tight">
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="text-gray-600 mb-6 leading-relaxed text-sm">
            {post.excerpt}
          </p>

          {/* Read More Button */}
          <div className="flex justify-start">
            <Link href={`/blog/${post.slug}`}>
            <button className="text-gray-700 font-semibold text-sm hover:text-gray-900 transition-colors duration-200 uppercase tracking-wide">
              READ MORE
            </button></Link>
          </div>
        </div>
      </article>
        ))}
          </div>
        </div>
      </div>

      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-12">Why Choose Migrantifly?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-primary-600 text-white p-6 rounded-lg">
              End-to-end support: from visas to settling in.
            </div>
            <div className="bg-primary-600 text-white p-6 rounded-lg">
              Settlement plans customized for your future.
            </div>
            <div className="bg-primary-600 text-white p-6 rounded-lg">
              Local knowledge for NZ, Australia, Fiji, and beyond.
            </div>
            <div className="bg-primary-600 text-white p-6 rounded-lg">
              Fully secure client portal for document handling.
            </div>
            <div className="bg-primary-600 text-white p-6 rounded-lg">
              Visa eligibility tools and real-time progress tracking.
            </div>
            <div className="bg-primary-600 text-white p-6 rounded-lg">
              Visa eligibility tools and real-time progress tracking.
            </div>
          </div>
        </div>
      </div>

      <div className="bg-primary-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Let's Build Your Future Together</h2>
          <p className="text-xl text-blue-100 mb-8">
            Start with a free assessment or talk to one of our migration specialists today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-primary-600 hover:bg-primary-700 px-8 py-3 rounded-lg font-semibold transition-colors">
              Check Visa
            </button>
            <button className="border border-white text-white hover:bg-white hover:text-primary-900 px-8 py-3 rounded-lg font-semibold transition-colors">
              Book a Call
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}