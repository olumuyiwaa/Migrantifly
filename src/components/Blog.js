"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link'
import { contentApi } from '../lib/api';

export default function BlogSection() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        contentApi.blogPosts({ limit: 3 })
            .then((res) => {
                if (!cancelled) setPosts(res?.data || []);
            })
            .catch(() => {
                if (!cancelled) setPosts([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    if (!loading && posts.length === 0) return null;
// Get initials for avatar
    const getInitials = (name) => {
        if (!name) return 'A';
        return name.charAt(0).toUpperCase();
    };

    // Format date helper
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };
    return (
        <section className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4">Read Our Latest Blogs and News</h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {loading && (
                        [0, 1, 2].map((i) => (
                            <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-sm mx-auto animate-pulse">
                                <div className="h-56 bg-slate-200" />
                                <div className="p-6 space-y-4">
                                    <div className="h-5 bg-slate-200 rounded w-3/4" />
                                    <div className="h-4 bg-slate-200 rounded w-full" />
                                    <div className="h-4 bg-slate-200 rounded w-5/6" />
                                </div>
                            </div>
                        ))
                    )}
                    {!loading && posts.map((post) => (
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
                                    <div className="w-full h-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center relative">
                                        <div className="absolute inset-0 opacity-10">
                                            <div className="w-full h-full bg-repeat opacity-20"
                                                 style={{
                                                     backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                                                 }}>
                                            </div>
                                        </div>

                                        <div className="relative z-10 text-center">
                                            <div className="text-4xl mb-2">📝</div>
                                            <span className="text-white text-sm font-medium bg-white/20 px-4 py-2 rounded-full">
                            {post.category || 'Blog Post'}
                          </span>
                                        </div>
                                    </div>
                                )}

                                {/* Featured Badge */}
                                {post.featured && (
                                    <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                                        Featured
                                    </div>
                                )}

                                {/* Category Badge */}
                                {post.category && (
                                    <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs">
                                        {post.category}
                                    </div>
                                )}
                            </div>

                            {/* Content Section */}
                            <div className="p-6">
                                {/* Tags */}
                                {post.tags && post.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {post.tags.slice(0, 3).map((tag, index) => (
                                            <span key={index} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                            #{tag}
                          </span>
                                        ))}
                                        {post.tags.length > 3 && (
                                            <span className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded">
                            +{post.tags.length - 3} more
                          </span>
                                        )}
                                    </div>
                                )}

                                {/* Title */}
                                <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight line-clamp-2">
                                    {post.title}
                                </h3>

                                {/* Excerpt */}
                                <p className="text-gray-600 mb-4 leading-relaxed text-sm line-clamp-3">
                                    {post.excerpt || post.metaDescription}
                                </p>

                                {/* Reading Time */}
                                {post.readingTime && (
                                    <div className="text-xs text-gray-500 mb-3">
                                        ⏱️ {post.readingTime}
                                    </div>
                                )}

                                {/* Bottom Section with Author and Button */}
                                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                                    {/* Author Info */}
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-xs font-medium">
                            {getInitials(post.author)}
                          </span>
                                        </div>
                                        <div>
                                            <div className="text-xs font-medium text-gray-900">
                                                {post.author || 'Immigration Expert'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {formatDate(post.publishDate || post.date)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Learn More Button */}
                                    <Link href={`/blog/${post.slug}`}>
                                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full font-medium transition-colors duration-200 text-sm">
                                            READ MORE
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
                <div className="text-center mt-12">
                    <Link href="/blog">
                        <button className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                            View All Posts
                        </button>
                    </Link>
                </div>
            </div>
        </section>
    )
}