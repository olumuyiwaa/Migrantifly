// src/app/blog/page.js - Fixed version with all imports removed
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import Link from 'next/link'
import posts from '../../data/posts';


export default function Blog() {
  return (
    <main>
      <Header />
      <div
        className="relative bg-slate-800 py-20 bg-cover bg-center min-h-[35vh]"
        style={{ backgroundImage: "url('/your-image-path.jpg')" }} // Replace with your image path
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 text-center text-white items-center pt-24">
          <h1 className="text-5xl font-bold mb-4">Blog and News</h1>
        </div>
      </div>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold mb-3">
            Recent Blog posts
          </h1>

        <div className="grid md:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <article 
              key={post.slug} 
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 max-w-sm mx-auto"
            >
              {/* Image Section */}
              <div className="relative h-56 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                {post.image ? (
                  <img
                    src={post.image}
                    alt={post.imageAlt || post.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  // Professional placeholder image showing people in consultation/meeting
                  <div className="w-full h-full bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800 flex items-center justify-center relative">
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="w-full h-full bg-repeat opacity-20" 
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                          }}>
                      </div>
                    </div>
                    
                    {/* Professional consultation scene */}
                    <div className="relative z-10 flex items-center justify-center space-x-6">
                      {/* Person 1 - Professional */}
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-2 border-4 border-white shadow-lg">
                          <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">👨</span>
                          </div>
                        </div>
                        <div className="w-12 h-16 bg-orange-800 rounded-t-xl"></div>
                      </div>
                      
                      {/* Person 2 - Client */}
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2 border-4 border-white shadow-lg">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">👤</span>
                          </div>
                        </div>
                        <div className="w-12 h-16 bg-green-700 rounded-t-xl"></div>
                      </div>
                    </div>
                    
                    {/* Phone/Document in center */}
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                      <div className="w-8 h-12 bg-slate-900 rounded-lg border-2 border-slate-600 flex items-center justify-center">
                        <div className="w-4 h-6 bg-blue-400 rounded opacity-80"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="p-6">
                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-4 leading-tight">
                  {post.title}
                </h3>

                {/* Excerpt */}
                <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                  {post.excerpt}
                </p>

                {/* Bottom Section with Author and Button */}
                <div className="flex items-center justify-between">
                  {/* Author Info */}
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-xs font-medium">
                        {post.author ? post.author.charAt(0) : 'A'}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-900">
                        {post.author || 'Immigration Expert'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {post.publishDate || post.date}
                      </div>
                    </div>
                  </div>

                  {/* Learn More Button */}
                  <Link href={`/blog/${post.slug}`}>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-colors duration-200 text-sm">
                      LEARN MORE
                    </button>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}