// src/app/blog/[slug]/BlogPostClient.js (Client Component)
'use client'
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { contentApi } from '@/lib/api';

export default function BlogPostClient({ post: initialPost }) {
    const [posts, setPosts] = useState([]);
    const [post] = useState(initialPost);

    useEffect(() => {
        // Fetch other posts for the sidebar
        const fetchPosts = async () => {
            try {
                const response = await contentApi.blogPosts({ limit: 10 });
                if (response.data) {
                    setPosts(response.data);
                }
            } catch (error) {
                console.error('Error fetching blog posts:', error);
            }
        };
        fetchPosts();
    }, []);

    // Format date if needed
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // If no post, show loading or error state
    if (!post) {
        return (
            <main>
                <Header />
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h1>
                        <Link href="/blog" className="text-blue-600 hover:underline">
                            Browse all posts
                        </Link>
                    </div>
                </div>
                <Footer />
            </main>
        );
    }

    return (
        <main>
            <Header />

            {/* Hero Section */}
            <div
                className="relative bg-slate-800 py-20 bg-cover bg-center min-h-[55vh]"
                style={{ backgroundImage: post.image ? `url(${post.image})` : 'url("/images/blog-default.jpg")' }}
            >
                <div className="absolute inset-0 bg-black/50"></div>
                <div className="relative z-10 text-center text-white items-center pt-32">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>
                    <p className="text-lg text-gray-300">
                        Published on {formatDate(post.publishDate || post.date)} by {post.author || 'Admin'}
                    </p>
                    {post.category && (
                        <span className="inline-block mt-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
              {post.category}
            </span>
                    )}
                    {post.readingTime && (
                        <span className="inline-block mt-2 ml-2 bg-gray-700 text-white px-3 py-1 rounded-full text-sm">
              {post.readingTime}
            </span>
                    )}
                </div>
            </div>

            {/* Content + Sidebar */}
            <section className="bg-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-3 gap-12">
                    {/* Article */}
                    <article className="lg:col-span-2 prose prose-lg max-w-none">
                        {post.content?.introduction && (
                            <p className="text-xl text-gray-700 mb-8">{post.content.introduction}</p>
                        )}

                        {post.content?.sections?.map((section, index) => (
                            <section key={index} className="mb-10">
                                {section.title && (
                                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">{section.title}</h2>
                                )}
                                {section.content && (
                                    <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                                        {section.content}
                                    </p>
                                )}

                                {section.subsections?.map((sub, i) => (
                                    <div key={i} className="mt-4 pl-4 border-l-4 border-blue-600">
                                        {sub.subtitle && (
                                            <h3 className="font-semibold text-blue-700">{sub.subtitle}</h3>
                                        )}
                                        {sub.details && (
                                            <p className="text-gray-700">{sub.details}</p>
                                        )}
                                    </div>
                                ))}
                            </section>
                        ))}

                        {post.content?.conclusion && (
                            <div className="mt-12 bg-gray-50 p-8 rounded-lg">
                                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Conclusion</h2>
                                <p className="text-gray-800">{post.content.conclusion}</p>
                            </div>
                        )}

                        {post.content?.checklist && post.content.checklist.length > 0 && (
                            <div className="mt-8 bg-green-50 p-6 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-2">Checklist:</h3>
                                <ul className="list-disc list-inside text-gray-800 space-y-1">
                                    {post.content.checklist.map((item, index) => (
                                        <li key={index}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </article>

                    {/* Sidebar */}
                    <aside className="space-y-8">
                        {/* Recent Posts */}
                        <div className="rounded-lg overflow-hidden">
                            <div className="bg-blue-600 px-6 py-4">
                                <h3 className="text-white text-lg font-bold">Recent Posts</h3>
                            </div>
                            <div className="bg-gray-700 px-6 py-6 space-y-4">
                                {posts
                                    .filter(p => p.slug !== post.slug)
                                    .slice(0, 10)
                                    .map(p => (
                                        <Link
                                            key={p.slug}
                                            href={`/blog/${p.slug}`}
                                            className="block text-white hover:text-blue-300 transition-colors"
                                        >
                                            {p.title}
                                        </Link>
                                    ))}
                            </div>
                        </div>

                        {/* Categories */}
                        {post.category && (
                            <div className="rounded-lg overflow-hidden">
                                <div className="bg-gray-800 px-6 py-4">
                                    <h3 className="text-white text-lg font-bold">Category</h3>
                                </div>
                                <div className="bg-gray-700 px-6 py-4">
                  <span className="inline-block bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                    {post.category}
                  </span>
                                </div>
                            </div>
                        )}

                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                            <div className="rounded-lg overflow-hidden">
                                <div className="bg-gray-800 px-6 py-4">
                                    <h3 className="text-white text-lg font-bold">Tags</h3>
                                </div>
                                <div className="bg-gray-700 px-6 py-4">
                                    <div className="flex flex-wrap gap-2">
                                        {post.tags.map((tag, index) => (
                                            <span key={index} className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs">
                        {tag}
                      </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </aside>
                </div>
            </section>

            <Footer />
        </main>
    );
}