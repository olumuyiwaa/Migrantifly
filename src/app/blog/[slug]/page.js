import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { contentApi } from '@/lib/api'; // adjust path

export async function generateStaticParams() {
    try {
        const res = await contentApi.blogPosts();
        const posts = res?.data ?? [];
        return posts.map((p) => ({ slug: p.slug }));
    } catch {
        return [];
    }
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    try {
        const res = await contentApi.blogPost(slug);
        const post = res?.data;
        if (!post) return { title: 'Post Not Found' };
        return {
            title: post.title,
            description: post.metaDescription || post.excerpt,
        };
    } catch {
        return { title: 'Post Not Found' };
    }
}

export default async function BlogPost({ params }) {
    const { slug } = await params;

    let post = null;
    let recentPosts = [];

    try {
        const [detailRes, listRes] = await Promise.all([
            contentApi.blogPost(slug),
            contentApi.blogPosts({ limit: 10 }),
        ]);
        post = detailRes?.data ?? null;
        recentPosts = (listRes?.data ?? []).filter((p) => p.slug !== slug).slice(0, 10);
    } catch {
        // leave post null
    }

    if (!post) notFound();

    const content = post.content ?? {};
    const sections = content.sections ?? [];
    // Note: BlogPost type in your API does not include checklist; keep optional if backend sends it
    const checklist = content.checklist ?? [];

    return (
        <main>
            <Header />

            <div
                className="relative min-h-[55vh] bg-cover bg-center bg-slate-800 py-20"
                style={{
                    backgroundImage: post.image
                        ? `url(${post.image})`
                        : 'url("/images/bg.png")',
                }}
            >
                <div className="absolute inset-0 bg-black/50" />
                <div className="relative z-10 items-center pt-32 text-center text-white">
                    <h1 className="mb-4 text-4xl font-bold md:text-5xl">{post.title}</h1>
                    <p className="text-lg text-gray-300">
                        {post.publishDate && <>Published on {post.publishDate}</>}
                        {post.author && <> by {post.author}</>}
                    </p>
                </div>
            </div>

            <section className="bg-white py-16">
                <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
                    <article className="prose prose-lg max-w-none lg:col-span-2">
                        {content.introduction && (
                            <p className="mb-8 text-xl text-gray-700">{content.introduction}</p>
                        )}

                        {sections.map((section, index) => (
                            <section key={index} className="mb-10">
                                {section.title && (
                                    <h2 className="mb-2 text-2xl font-semibold text-gray-900">
                                        {section.title}
                                    </h2>
                                )}
                                {section.content && (
                                    <p className="whitespace-pre-line leading-relaxed text-gray-800">
                                        {section.content}
                                    </p>
                                )}
                                {section.subsections?.map((sub, i) => (
                                    <div key={i} className="mt-4 border-l-4 border-blue-600 pl-4">
                                        {sub.subtitle && (
                                            <h3 className="font-semibold text-blue-700">
                                                {sub.subtitle}
                                            </h3>
                                        )}
                                        {sub.details && (
                                            <p className="text-gray-700">{sub.details}</p>
                                        )}
                                    </div>
                                ))}
                            </section>
                        ))}

                        {content.conclusion && (
                            <div className="mt-12">
                                <h2 className="mb-2 text-2xl font-semibold text-gray-900">
                                    Conclusion
                                </h2>
                                <p className="text-gray-800">{content.conclusion}</p>
                            </div>
                        )}

                        {checklist.length > 0 && (
                            <div className="mt-8">
                                <h3 className="mb-2 font-semibold text-gray-900">Checklist:</h3>
                                <ul className="list-inside list-disc text-gray-800">
                                    {checklist.map((item, index) => (
                                        <li key={index}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </article>

                    <aside className="space-y-8">
                        {recentPosts.length > 0 && (
                            <div className="overflow-hidden rounded-lg">
                                <div className="bg-blue-600 px-6 py-4">
                                    <h3 className="text-lg font-bold text-white">Recent Posts</h3>
                                </div>
                                <div className="space-y-4 bg-gray-700 px-6 py-6">
                                    {recentPosts.map((p) => (
                                        <Link
                                            key={p.slug}
                                            href={`/blog/${p.slug}`}
                                            className="block text-white hover:underline"
                                        >
                                            {p.title}
                                        </Link>
                                    ))}
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