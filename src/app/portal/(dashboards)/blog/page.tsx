'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminApi, ApiError, getStoredUser, type BlogPost, type BlogPostInput, type ContentSection } from '@/lib/api';

function linesToArray(value: string): string[] {
    return value
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
}

function arrayToLines(value?: string[]): string {
    return (value || []).join('\n');
}

interface FormState {
    title: string;
    slug: string;
    excerpt: string;
    metaDescription: string;
    tagsText: string;
    category: string;
    readingTime: string;
    author: string;
    image: string;
    imageAlt: string;
    featured: boolean;
    isPublished: boolean;
    publishDate: string;
    introduction: string;
    conclusion: string;
    sections: ContentSection[];
}

function toDateInputValue(iso?: string): string {
    if (!iso) return '';
    try {
        return new Date(iso).toISOString().slice(0, 10);
    } catch {
        return '';
    }
}

function postToForm(post?: BlogPost | null): FormState {
    return {
        title: post?.title || '',
        slug: post?.slug || '',
        excerpt: post?.excerpt || '',
        metaDescription: post?.metaDescription || '',
        tagsText: arrayToLines(post?.tags),
        category: post?.category || '',
        readingTime: post?.readingTime || '',
        author: post?.author || 'Migration Expert',
        image: post?.image || '',
        imageAlt: post?.imageAlt || '',
        featured: post?.featured ?? false,
        isPublished: post?.isPublished ?? true,
        publishDate: toDateInputValue(post?.publishDate) || new Date().toISOString().slice(0, 10),
        introduction: post?.content?.introduction || '',
        conclusion: post?.content?.conclusion || '',
        sections: post?.content?.sections?.length
            ? JSON.parse(JSON.stringify(post.content.sections))
            : [],
    };
}

function formToInput(form: FormState): BlogPostInput {
    return {
        title: form.title,
        slug: form.slug || undefined,
        excerpt: form.excerpt,
        metaDescription: form.metaDescription,
        tags: linesToArray(form.tagsText),
        category: form.category,
        readingTime: form.readingTime,
        author: form.author,
        image: form.image,
        imageAlt: form.imageAlt,
        featured: form.featured,
        isPublished: form.isPublished,
        publishDate: form.publishDate ? new Date(form.publishDate).toISOString() : undefined,
        content: {
            introduction: form.introduction,
            conclusion: form.conclusion,
            sections: form.sections
                .filter((s) => s.title || s.content)
                .map((s) => ({
                    title: s.title,
                    content: s.content,
                    subsections: (s.subsections || []).filter((sub) => sub.subtitle || sub.details),
                })),
        },
    };
}

const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-dark dark:text-white/90';
const labelClass = 'mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400';

export default function BlogAdminPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<FormState>(postToForm());
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const canEdit = getStoredUser()?.role === 'admin';

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await adminApi.blogPosts();
            setPosts(res.data || []);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to load blog posts');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    function openCreate() {
        setEditingId(null);
        setForm(postToForm());
        setFormError(null);
        setFormOpen(true);
    }

    function openEdit(post: BlogPost) {
        setEditingId(post._id);
        setForm(postToForm(post));
        setFormError(null);
        setFormOpen(true);
    }

    async function handleSave() {
        setSaving(true);
        setFormError(null);
        try {
            const payload = formToInput(form);
            if (editingId) {
                await adminApi.updateBlogPost(editingId, payload);
            } else {
                await adminApi.createBlogPost(payload);
            }
            setFormOpen(false);
            await load();
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : 'Failed to save post');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(post: BlogPost) {
        if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
        try {
            await adminApi.deleteBlogPost(post._id);
            await load();
        } catch (err) {
            alert(err instanceof ApiError ? err.message : 'Failed to delete post');
        }
    }

    function updateSection(index: number, patch: Partial<ContentSection>) {
        setForm((f) => {
            const sections = [...f.sections];
            sections[index] = { ...sections[index], ...patch };
            return { ...f, sections };
        });
    }

    function addSection() {
        setForm((f) => ({ ...f, sections: [...f.sections, { title: '', content: '', subsections: [] }] }));
    }

    function removeSection(index: number) {
        setForm((f) => ({ ...f, sections: f.sections.filter((_, i) => i !== index) }));
    }

    function addSubsection(sectionIndex: number) {
        setForm((f) => {
            const sections = [...f.sections];
            const subsections = [...(sections[sectionIndex].subsections || []), { subtitle: '', details: '' }];
            sections[sectionIndex] = { ...sections[sectionIndex], subsections };
            return { ...f, sections };
        });
    }

    function updateSubsection(sectionIndex: number, subIndex: number, patch: { subtitle?: string; details?: string }) {
        setForm((f) => {
            const sections = [...f.sections];
            const subsections = [...(sections[sectionIndex].subsections || [])];
            subsections[subIndex] = { ...subsections[subIndex], ...patch };
            sections[sectionIndex] = { ...sections[sectionIndex], subsections };
            return { ...f, sections };
        });
    }

    function removeSubsection(sectionIndex: number, subIndex: number) {
        setForm((f) => {
            const sections = [...f.sections];
            const subsections = (sections[sectionIndex].subsections || []).filter((_, i) => i !== subIndex);
            sections[sectionIndex] = { ...sections[sectionIndex], subsections };
            return { ...f, sections };
        });
    }

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
                        Blog
                    </h1>
                    <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                        Manage the blog posts and news shown on the public website.
                    </p>
                </div>
                {canEdit && (
                    <button
                        type="button"
                        onClick={openCreate}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                        + New Post
                    </button>
                )}
            </div>

            {error && (
                <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                    {error}
                </div>
            )}

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                        <thead className="bg-gray-50 dark:bg-white/5">
                        <tr>
                            <th className="px-5 py-3 text-left text-theme-xs font-medium uppercase text-gray-500 dark:text-gray-400">Post</th>
                            <th className="px-5 py-3 text-left text-theme-xs font-medium uppercase text-gray-500 dark:text-gray-400">Slug</th>
                            <th className="px-5 py-3 text-left text-theme-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</th>
                            <th className="px-5 py-3 text-left text-theme-xs font-medium uppercase text-gray-500 dark:text-gray-400">Published</th>
                            {canEdit && <th className="px-5 py-3 text-right text-theme-xs font-medium uppercase text-gray-500 dark:text-gray-400">Actions</th>}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-5 py-6 text-center text-sm text-gray-400">Loading…</td>
                            </tr>
                        ) : posts.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-5 py-6 text-center text-sm text-gray-400">No blog posts yet</td>
                            </tr>
                        ) : (
                            posts.map((post) => (
                                <tr key={post._id}>
                                    <td className="whitespace-nowrap px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300">
                                        {post.featured && <span className="mr-2 text-amber-500" title="Featured">★</span>}
                                        {post.title}
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400">{post.slug}</td>
                                    <td className="whitespace-nowrap px-5 py-3.5 text-sm">
                                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${post.isPublished ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300'}`}>
                                                {post.isPublished ? 'Published' : 'Draft'}
                                            </span>
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                                        {post.publishDate ? new Date(post.publishDate).toLocaleDateString() : '—'}
                                    </td>
                                    {canEdit && (
                                        <td className="whitespace-nowrap px-5 py-3.5 text-right text-sm">
                                            <button onClick={() => openEdit(post)} className="mr-3 text-blue-600 hover:underline dark:text-blue-400">Edit</button>
                                            <button onClick={() => handleDelete(post)} className="text-error-600 hover:underline dark:text-error-400">Delete</button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {formOpen && (
                <div className="fixed inset-0 z-99999 flex items-start justify-center overflow-y-auto bg-black/50 p-4 py-10">
                    <div className="w-full max-w-5xl rounded-xl bg-white p-6 shadow-xl dark:bg-gray-dark">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                                {editingId ? 'Edit Post' : 'New Post'}
                            </h2>
                            <button onClick={() => setFormOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
                        </div>

                        {formError && (
                            <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                                {formError}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className={labelClass}>Title *</label>
                                    <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Slug (auto if blank)</label>
                                    <input className={inputClass} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Excerpt *</label>
                                <textarea className={inputClass} rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <label className={labelClass}>Image URL</label>
                                    <input className={inputClass} value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="/blog1.jpg" />
                                </div>
                                <div>
                                    <label className={labelClass}>Image alt text</label>
                                    <input className={inputClass} value={form.imageAlt} onChange={(e) => setForm({ ...form, imageAlt: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Category</label>
                                    <input className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Documentation" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <label className={labelClass}>Author</label>
                                    <input className={inputClass} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Reading time</label>
                                    <input className={inputClass} value={form.readingTime} onChange={(e) => setForm({ ...form, readingTime: e.target.value })} placeholder="8 min read" />
                                </div>
                                <div>
                                    <label className={labelClass}>Publish date</label>
                                    <input type="date" className={inputClass} value={form.publishDate} onChange={(e) => setForm({ ...form, publishDate: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Tags (one per line)</label>
                                <textarea className={inputClass} rows={2} value={form.tagsText} onChange={(e) => setForm({ ...form, tagsText: e.target.value })} />
                            </div>

                            <div>
                                <label className={labelClass}>Meta description (SEO)</label>
                                <textarea className={inputClass} rows={2} value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} />
                            </div>

                            <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
                                <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">Article content</h3>
                                <div className="mb-3">
                                    <label className={labelClass}>Introduction</label>
                                    <textarea className={inputClass} rows={3} value={form.introduction} onChange={(e) => setForm({ ...form, introduction: e.target.value })} />
                                </div>

                                <div className="space-y-4">
                                    {form.sections.map((section, index) => (
                                        <div key={index} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                            <div className="mb-2 flex items-center justify-between">
                                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Section {index + 1}</span>
                                                <button type="button" onClick={() => removeSection(index)} className="text-xs text-error-600 hover:underline dark:text-error-400">Remove</button>
                                            </div>
                                            <input
                                                className={`${inputClass} mb-2`}
                                                placeholder="Section title"
                                                value={section.title || ''}
                                                onChange={(e) => updateSection(index, { title: e.target.value })}
                                            />
                                            <textarea
                                                className={`${inputClass} mb-2`}
                                                rows={3}
                                                placeholder="Section content"
                                                value={section.content || ''}
                                                onChange={(e) => updateSection(index, { content: e.target.value })}
                                            />
                                            <div className="space-y-2">
                                                {(section.subsections || []).map((sub, subIndex) => (
                                                    <div key={subIndex} className="grid grid-cols-1 gap-2 rounded border border-gray-100 p-2 dark:border-gray-800 sm:grid-cols-[1fr_2fr_auto]">
                                                        <input
                                                            className={inputClass}
                                                            placeholder="Subtitle"
                                                            value={sub.subtitle || ''}
                                                            onChange={(e) => updateSubsection(index, subIndex, { subtitle: e.target.value })}
                                                        />
                                                        <input
                                                            className={inputClass}
                                                            placeholder="Details"
                                                            value={sub.details || ''}
                                                            onChange={(e) => updateSubsection(index, subIndex, { details: e.target.value })}
                                                        />
                                                        <button type="button" onClick={() => removeSubsection(index, subIndex)} className="text-xs text-error-600 hover:underline dark:text-error-400">✕</button>
                                                    </div>
                                                ))}
                                                <button type="button" onClick={() => addSubsection(index)} className="text-xs text-blue-600 hover:underline dark:text-blue-400">+ Add subsection</button>
                                            </div>
                                        </div>
                                    ))}
                                    <button type="button" onClick={addSection} className="text-sm text-blue-600 hover:underline dark:text-blue-400">+ Add section</button>
                                </div>

                                <div className="mt-3">
                                    <label className={labelClass}>Conclusion</label>
                                    <textarea className={inputClass} rows={2} value={form.conclusion} onChange={(e) => setForm({ ...form, conclusion: e.target.value })} />
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
                                    Published
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
                                    Featured
                                </label>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setFormOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300">
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !form.title || !form.excerpt}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving ? 'Saving…' : 'Save Post'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}