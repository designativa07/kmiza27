'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLink {
  name: string;
  href: string;
  icon: React.ReactNode;
}

interface NavLinksProps {
  links: NavLink[];
}

export function NavLinks({ links }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <nav className="flex justify-center space-x-2 sm:space-x-4 overflow-x-auto py-1">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {link.icon}
            <span className="whitespace-nowrap">{link.name}</span>
          </Link>
        );
      })}
    </nav>
  );
} 