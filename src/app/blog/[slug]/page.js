import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import posts from '../../../data/posts';

export async function generateStaticParams() {
  return posts.map(post => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const post = posts.find(p => p.slug === params.slug);
  if (!post) return { title: 'Post Not Found' };

  return {
    title: post.title,
    description: post.metaDescription || post.excerpt,
  };
}

export default function BlogPost({ params }) {
  const post = posts.find(p => p.slug === params.slug);

  if (!post) notFound();

  return (
    <main>
      <Header />

      {/* Hero Section */}
      <div className="relative bg-slate-800 py-20 bg-cover bg-center min-h-[55vh]"
          style={{ backgroundImage: `url(${post.image})` }}>
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="relative z-10 text-center text-white items-center pt-32">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>
            <p className="text-lg text-gray-300">Published on {post.publishDate} by {post.author}</p>
          </div>
      </div>

      {/* Content + Sidebar */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-3 gap-12">
          {/* Article */}
          <article className="lg:col-span-2 prose prose-lg max-w-none">
            <p className="text-xl text-gray-700 mb-8">{post.content.introduction}</p>

            {post.content.sections.map((section, index) => (
              <section key={index} className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">{section.title}</h2>
                <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                  {section.content}
                </p>

                {section.subsections?.map((sub, i) => (
                  <div key={i} className="mt-4 pl-4 border-l-4 border-blue-600">
                    <h3 className="font-semibold text-blue-700">{sub.subtitle}</h3>
                    <p className="text-gray-700">{sub.details}</p>
                  </div>
                ))}
              </section>
            ))}

            {post.content.conclusion && (
              <div className="mt-12">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Conclusion</h2>
                <p className="text-gray-800">{post.content.conclusion}</p>
              </div>
            )}

            {post.content.checklist && (
              <div className="mt-8">
                <h3 className="font-semibold text-gray-900 mb-2">Checklist:</h3>
                <ul className="list-disc list-inside text-gray-800">
                  {post.content.checklist.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </article>

          {/* Sidebar */}
          {/* Search Box */}
            {/* <div className="bg-gray-100 rounded-lg p-4">
              <input
                type="text"
                placeholder="Search"
                className="w-full px-4 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-400"
              />
            </div> */}
          <aside className="space-y-8">
            <div className="rounded-lg overflow-hidden">
              <div className="bg-blue-600 px-6 py-4">
                <h3 className="text-white text-lg font-bold">Recent Posts</h3>
              </div>
              <div className="bg-gray-700 px-6 py-6 space-y-4">
                {posts.slice(0, 10).map(p => (
                  <Link
                    key={p.slug}
                    href={`/blog/${p.slug}`}
                    className="block text-blue-800 hover:underline"
                  >
                    {p.title}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <Footer />
    </main>
  );
}
