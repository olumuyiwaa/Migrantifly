'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  ApplicationIcon,
  ChatIcon,
  ChevronDownIcon,
  FileIcon,
  GridIcon,
  GroupIcon,
  HorizontaLDots,
  CalenderIcon,
  TransactionsIcon,
  UserCircleIcon,
} from '../icons/index';
import { useSidebar } from '@/contexts/SidebarContext';
import { getStoredUser, type AuthUserSummary, type UserRole } from '@/lib/api';

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

/** Admin / adviser menu */
const adminNavItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: 'Dashboard',
    path: '/portal',
  },
  {
    icon: <GroupIcon />,
    name: 'Users',
    path: '/portal/users',
  },
  {
    icon: <CalenderIcon />,
    name: 'Calendar',
    path: '/portal/calendar',
  },
  {
    icon: <ApplicationIcon />,
    name: 'Applications',
    path: '/portal/applications',
  },
  {
    icon: <FileIcon />,
    name: 'Documents',
    path: '/portal/documents',
  },
  {
    icon: <ChatIcon />,
    name: 'Consultations',
    path: '/portal/consultations',
  },
  {
    icon: <TransactionsIcon />,
    name: 'Transactions',
    path: '/portal/transactions',
  },
];

/** Client menu */
const clientNavItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: 'My Dashboard',
    path: '/portal',
  },
  {
    icon: <CalenderIcon />,
    name: 'My Calendar',
    path: '/portal/my-calendar',
  },
  {
    icon: <ApplicationIcon />,
    name: 'My Applications',
    path: '/portal/my-applications',
  },
  {
    icon: <FileIcon />,
    name: 'My Documents',
    path: '/portal/my-documents',
  },
  {
    icon: <ChatIcon />,
    name: 'My Consultations',
    path: '/portal/my-consultations',
  },
];

const othersItems: NavItem[] = [
  {
    icon: <UserCircleIcon />,
    name: 'Profile',
    path: '/portal/profile',
  },
  {
    icon: (
        <svg
            className="fill-current"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
        >
          <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
              fill="currentColor"
          />
        </svg>
    ),
    name: 'Notifications',
    path: '/portal/notifications',
  },
];

function isClientRole(role?: UserRole | string): boolean {
  return role === 'client';
}

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUserSummary | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const mainNavItems = useMemo(
      () => (isClientRole(user?.role) ? clientNavItems : adminNavItems),
      [user?.role]
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: 'main' | 'others';
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
      {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
      (path: string) => {
        if (!path) return false;
        if (path === pathname) return true;
        // highlight parent when on a nested route e.g. /portal/applications/[id]
        if (path !== '/' && pathname.startsWith(path + '/')) return true;
        return false;
      },
      [pathname]
  );

  const renderMenuItems = (
      items: NavItem[],
      menuType: 'main' | 'others'
  ) => (
      <ul className="flex flex-col gap-4">
        {items.map((nav, index) => (
            <li key={nav.name}>
              {nav.subItems ? (
                  <button
                      type="button"
                      onClick={() => handleSubmenuToggle(index, menuType)}
                      className={`menu-item group ${
                          openSubmenu?.type === menuType && openSubmenu?.index === index
                              ? 'menu-item-active'
                              : 'menu-item-inactive'
                      } cursor-pointer ${
                          !isExpanded && !isHovered
                              ? 'lg:justify-center'
                              : 'lg:justify-start'
                      }`}
                  >
              <span
                  className={`${
                      openSubmenu?.type === menuType && openSubmenu?.index === index
                          ? 'menu-item-icon-active'
                          : 'menu-item-icon-inactive'
                  }`}
              >
                {nav.icon}
              </span>
                    {(isExpanded || isHovered || isMobileOpen) && (
                        <span className="menu-item-text">{nav.name}</span>
                    )}
                    {(isExpanded || isHovered || isMobileOpen) && (
                        <ChevronDownIcon
                            className={`ml-auto h-5 w-5 transition-transform duration-200 ${
                                openSubmenu?.type === menuType &&
                                openSubmenu?.index === index
                                    ? 'rotate-180 text-brand-500'
                                    : ''
                            }`}
                        />
                    )}
                  </button>
              ) : (
                  nav.path && (
                      <Link
                          href={nav.path}
                          className={`menu-item group ${
                              isActive(nav.path) ? 'menu-item-active' : 'menu-item-inactive'
                          }`}
                      >
                <span
                    className={`${
                        isActive(nav.path)
                            ? 'menu-item-icon-active'
                            : 'menu-item-icon-inactive'
                    }`}
                >
                  {nav.icon}
                </span>
                        {(isExpanded || isHovered || isMobileOpen) && (
                            <span className="menu-item-text">{nav.name}</span>
                        )}
                      </Link>
                  )
              )}
              {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
                  <div
                      ref={(el) => {
                        subMenuRefs.current[`${menuType}-${index}`] = el;
                      }}
                      className="overflow-hidden transition-all duration-300"
                      style={{
                        height:
                            openSubmenu?.type === menuType && openSubmenu?.index === index
                                ? `${subMenuHeight[`${menuType}-${index}`]}px`
                                : '0px',
                      }}
                  >
                    <ul className="mt-2 ml-9 space-y-1">
                      {nav.subItems.map((subItem) => (
                          <li key={subItem.name}>
                            <Link
                                href={subItem.path}
                                className={`menu-dropdown-item ${
                                    isActive(subItem.path)
                                        ? 'menu-dropdown-item-active'
                                        : 'menu-dropdown-item-inactive'
                                }`}
                            >
                              {subItem.name}
                              <span className="ml-auto flex items-center gap-1">
                        {subItem.new && (
                            <span
                                className={`menu-dropdown-badge ml-auto ${
                                    isActive(subItem.path)
                                        ? 'menu-dropdown-badge-active'
                                        : 'menu-dropdown-badge-inactive'
                                }`}
                            >
                            new
                          </span>
                        )}
                                {subItem.pro && (
                                    <span
                                        className={`menu-dropdown-badge ml-auto ${
                                            isActive(subItem.path)
                                                ? 'menu-dropdown-badge-active'
                                                : 'menu-dropdown-badge-inactive'
                                        }`}
                                    >
                            pro
                          </span>
                                )}
                      </span>
                            </Link>
                          </li>
                      ))}
                    </ul>
                  </div>
              )}
            </li>
        ))}
      </ul>
  );

  useEffect(() => {
    let submenuMatched = false;
    (['main', 'others'] as const).forEach((menuType) => {
      const items = menuType === 'main' ? mainNavItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({ type: menuType, index });
              submenuMatched = true;
            }
          });
        }
      });
    });
    if (!submenuMatched) setOpenSubmenu(null);
  }, [pathname, isActive, mainNavItems]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: 'main' | 'others') => {
    setOpenSubmenu((prev) => {
      if (prev && prev.type === menuType && prev.index === index) return null;
      return { type: menuType, index };
    });
  };

  return (
      <aside
          className={`fixed top-0 left-0 z-50 mt-16 flex h-screen flex-col border-r border-gray-200 bg-white px-5 text-gray-900 transition-all duration-300 ease-in-out lg:mt-0 dark:border-gray-800 dark:bg-gray-900 ${
              isExpanded || isMobileOpen
                  ? 'w-[290px]'
                  : isHovered
                      ? 'w-[290px]'
                      : 'w-[90px]'
          } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
          onMouseEnter={() => !isExpanded && setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
      >
        <div
            className={`flex py-8 ${
                !isExpanded && !isHovered ? 'lg:justify-center' : 'justify-start'
            }`}
        >
          <Link href="/">
            {isExpanded || isHovered || isMobileOpen ? (
                <>
                  <Image
                      className="dark:hidden"
                      src="/images/logo/logo.svg"
                      alt="Logo"
                      width={150}
                      height={40}
                  />
                  <Image
                      className="hidden dark:block"
                      src="/images/logo/logo-dark.svg"
                      alt="Logo"
                      width={150}
                      height={40}
                  />
                </>
            ) : (
                <Image
                    src="/images/logo/logo-icon.svg"
                    alt="Logo"
                    width={32}
                    height={32}
                />
            )}
          </Link>
        </div>

        <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
          <nav className="mb-6">
            <div className="flex flex-col gap-4">
              <div>
                <h2
                    className={`mb-4 flex text-xs leading-[20px] text-gray-400 uppercase ${
                        !isExpanded && !isHovered
                            ? 'lg:justify-center'
                            : 'justify-start'
                    }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                      isClientRole(user?.role) ? 'Client' : 'Menu'
                  ) : (
                      <HorizontaLDots />
                  )}
                </h2>
                {renderMenuItems(mainNavItems, 'main')}
              </div>

              <div>
                <h2
                    className={`mb-4 flex text-xs leading-[20px] text-gray-400 uppercase ${
                        !isExpanded && !isHovered
                            ? 'lg:justify-center'
                            : 'justify-start'
                    }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                      'Others'
                  ) : (
                      <HorizontaLDots />
                  )}
                </h2>
                {renderMenuItems(othersItems, 'others')}
              </div>
            </div>
          </nav>
        </div>
      </aside>
  );
};

export default AppSidebar;