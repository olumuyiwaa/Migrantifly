"use client";
import { useState } from 'react';
import Link from 'next/link';
import posts from '../../../data/posts';

export default function SearchSidebar() {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredPosts = posts.filter(
    post =>
      post.title.toLowerCase().includes(search.toLowerCase()) && search.trim() !== ''
  );

  return (
    <div className="bg-gray-100 rounded-lg p-4 relative">
      <input
        type="text"
        placeholder="Search"
        className="w-full px-4 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-400"
        value={search}
        onChange={e => {
          setSearch(e.target.value);
          setShowDropdown(true);
        }}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
        onFocus={() => search && setShowDropdown(true)}
      />
      {showDropdown && filteredPosts.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded shadow-lg z-10 max-h-60 overflow-y-auto">
          {filteredPosts.map(post => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block px-4 py-2 text-gray-800 hover:bg-blue-100"
              onClick={() => setShowDropdown(false)}
            >
              {post.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}