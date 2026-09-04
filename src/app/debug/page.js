// src/app/debug/page.js
import { contentApi } from '../../lib/api';

export default async function DebugPage() {
    const results = {};

    // Test services endpoint
    try {
        const services = await contentApi.services();
        results.services = {
            success: true,
            data: services.data || services,
            raw: services
        };
    } catch (error) {
        results.services = {
            success: false,
            error: error.message
        };
    }

    // Test specific service
    try {
        const service = await contentApi.service('visitor-visas');
        results.service = {
            success: true,
            data: service.data || service,
            raw: service
        };
    } catch (error) {
        results.service = {
            success: false,
            error: error.message
        };
    }

    // Test blog posts
    try {
        const posts = await contentApi.blogPosts({ limit: 5 });
        results.posts = {
            success: true,
            data: posts.data || posts,
            raw: posts
        };
    } catch (error) {
        results.posts = {
            success: false,
            error: error.message
        };
    }

    // Test specific blog post
    try {
        const post = await contentApi.blogPost('essential-documents-migration-application');
        results.post = {
            success: true,
            data: post.data || post,
            raw: post
        };
    } catch (error) {
        results.post = {
            success: false,
            error: error.message
        };
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">API Debug</h1>

            <div className="grid gap-6">
                {Object.entries(results).map(([key, value]) => (
                    <div key={key} className={`p-4 rounded-lg border ${value.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                        <h2 className="text-xl font-semibold mb-2">
                            {key}
                            <span className={`ml-2 text-sm ${value.success ? 'text-green-600' : 'text-red-600'}`}>
                {value.success ? '✅' : '❌'}
              </span>
                        </h2>
                        {value.success ? (
                            <div>
                                <p className="text-sm text-gray-600 mb-2">
                                    Data count: {Array.isArray(value.data) ? value.data.length : 'Object'}
                                </p>
                                <details>
                                    <summary className="cursor-pointer text-blue-600">View Data</summary>
                                    <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-96">
                    {JSON.stringify(value.data, null, 2)}
                  </pre>
                                </details>
                            </div>
                        ) : (
                            <p className="text-red-600">{value.error}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}