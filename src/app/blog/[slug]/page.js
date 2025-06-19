import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import posts from '../../../data/posts';
// import SearchSidebar from '../../../data/SearchSidebar';


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
      <div className="py-20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white pt-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                      {currentPost.title}
                    </h1>
                    <p className="text-xl text-gray-200 mb-6">
                      Published on {currentPost.date} by Migration Visa
                    </p>
                  </div>
                  <Image
                    src={post.image}
                    alt={post.imageAlt || post.title}
                    width={600}
                    height={384}
                    className="relative h-96 rounded-lg overflow-hidden w-full h-full flex items-center justify-center"
                    priority
                  />
                </div>
              </div>
            </div>

      {/* Main Content with Sidebar */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-3 gap-12">
          {/* Main Article */}
          <article className="lg:col-span-2">
            {/* Introduction */}
            <div className="prose prose-lg max-w-none mb-8">
              <p className="text-xl text-gray-700 leading-relaxed mb-6">
                {currentPost.content.introduction}
              </p>
            </div>

            {/* Dynamic Content Sections */}
            {currentPost.content.sections.map((section, index) => (
              <section key={index} className="mb-6">
                <h4 className="text-3xl font-medium text-gray-900 mb-2">{section.title}</h4>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {section.content}
                  </p>
              </section>
            ))}
          </article>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* Search Box */}
            {/* <div className="bg-gray-100 rounded-lg p-4">
              <input
                type="text"
                placeholder="Search"
                className="w-full px-4 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-400"
              />
            </div> */}

            {/* Recent Post Widget */}
            <div className="rounded-lg overflow-hidden">
              <div className="bg-blue-600 px-6 py-4">
                <h3 className="text-white text-l font-bold">Recent Post</h3>
              </div>
              <div className="bg-gray-700 px-6 py-6 space-y-6">
                {posts.slice(0, 10).map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="block text-gray-100 text-lg leading-snug hover:underline"
                  >
                    {post.title}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </main>
  )
}