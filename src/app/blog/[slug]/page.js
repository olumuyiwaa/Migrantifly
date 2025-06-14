// src/app/blog/[slug]/page.js - Fixed version with all imports removed
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import posts from '../../../data/posts';


// Generate static paths for all blog posts
export async function generateStaticParams() {
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// Generate metadata for each post
export async function generateMetadata({ params }) {
  const post = posts.find((p) => p.slug === params.slug);
  
  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default function BlogPost({ params }) {
  const currentPost = posts.find(post => post.slug === params.slug);

  // If post not found, trigger 404
  if (!currentPost) {
    notFound();
  }

  return (
    <main>
      <Header />
      
      {/* Hero Section */}
      <div className="relative bg-slate-800 py-20">
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {currentPost.title}
          </h1>
          <p className="text-xl text-gray-200 mb-6">
            Published on {currentPost.date} by Migration Visa
          </p>
        </div>
      </div>

      {/* Main Content */}
      <article className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Featured Image */}
          <div className="mb-8">
            <div className="h-64 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-lg">Featured Image</span>
            </div>
          </div>

          {/* Introduction */}
          <div className="prose prose-lg max-w-none mb-8">
            <p className="text-xl text-gray-700 leading-relaxed mb-6">
              {currentPost.content.introduction}
            </p>
          </div>

          {/* Dynamic Content Sections */}
          {currentPost.content.sections.map((section, index) => (
            <section key={index} className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">{section.title}</h2>
              <div className={`p-6 rounded-lg ${
                index % 3 === 0 ? 'bg-blue-50' : 
                index % 3 === 1 ? 'bg-gray-50' : 
                'bg-green-50'
              }`}>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {section.content}
                </p>
              </div>
            </section>
          ))}
        </div>
      </article>

      <Footer />
    </main>
  )
}