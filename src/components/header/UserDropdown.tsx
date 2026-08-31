'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  clearAuth,
  getStoredUser,
  type AuthUserSummary,
} from '@/lib/api';
import { Dropdown } from '../ui/dropdown/Dropdown';
import { DropdownItem } from '../ui/dropdown/DropdownItem';

function getDisplayName(user: AuthUserSummary | null): string {
  if (!user) return 'User';
  const fullName = [user.profile?.firstName, user.profile?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  return fullName || user.email || 'User';
}

function getShortName(user: AuthUserSummary | null): string {
  if (!user) return 'User';
  return user.profile?.firstName || user.email?.split('@')[0] || 'User';
}

function getInitials(user: AuthUserSummary | null): string {
  if (!user) return 'U';
  const first = user.profile?.firstName?.charAt(0) ?? '';
  const last = user.profile?.lastName?.charAt(0) ?? '';
  const initials = `${first}${last}`.trim();
  if (initials) return initials.toUpperCase();
  return user.email?.charAt(0).toUpperCase() ?? 'U';
}

function formatRole(role?: string): string {
  if (!role) return '';
  return role
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function UserDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<AuthUserSummary | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  function toggleDropdown(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  function handleLogout() {
    closeDropdown();
    clearAuth();
    setUser(null);
    router.replace('/signin');
    router.refresh();
  }

  const displayName = getDisplayName(user);
  const shortName = getShortName(user);
  const initials = getInitials(user);
  const role = formatRole(user?.role);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleDropdown}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="dropdown-toggle flex items-center text-gray-700 dark:text-gray-400"
      >
        <span className="mr-3 flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-sm font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
          {initials}
        </span>

        <span className="mr-1 block font-medium text-theme-sm">
          {shortName}
        </span>

        <svg
          className={`stroke-gray-500 transition-transform duration-200 dark:stroke-gray-400 ${
            isOpen ? 'rotate-180' : ''
          }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div>
          <span className="block font-medium text-theme-sm text-gray-700 dark:text-gray-400">
            {displayName}
          </span>

          {user?.email ? (
            <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
              {user.email}
            </span>
          ) : null}

          {role ? (
            <span className="mt-2 inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-white/5 dark:text-gray-300">
              {role}
            </span>
          ) : null}
        </div>

        <ul className="flex flex-col gap-1 border-b border-gray-200 pt-4 pb-3 dark:border-gray-800">
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/portal/profile"
              className="group text-theme-sm flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Profile
            </DropdownItem>
          </li>

          {/*<li>*/}
          {/*  <DropdownItem*/}
          {/*    onItemClick={closeDropdown}*/}
          {/*    tag="a"*/}
          {/*    href="/support"*/}
          {/*    className="group text-theme-sm flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"*/}
          {/*  >*/}
          {/*    Support*/}
          {/*  </DropdownItem>*/}
          {/*</li>*/}
        </ul>

        {user ? (
          <button
            type="button"
            onClick={handleLogout}
            className="group text-theme-sm mt-3 flex items-center gap-3 rounded-lg px-3 py-2 text-left font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
          >
            Sign out
          </button>
        ) : (
          <Link
            href="/signin"
            onClick={closeDropdown}
            className="group text-theme-sm mt-3 flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
          >
            Sign in
          </Link>
        )}
      </Dropdown>
    </div>
  );
}