"use client";

import Link from "next/link";

import { useDictionary } from "@/components/i18n/locale-provider";
import { ADMIN_ROUTES } from "@/lib/constants";

export interface AdminBreadcrumbItem {
  label: string;
  href?: string;
}

interface AdminBreadcrumbsProps {
  items: AdminBreadcrumbItem[];
}

export function AdminBreadcrumbs({ items }: AdminBreadcrumbsProps) {
  const { dict } = useDictionary();
  const shell = dict.admin.shell;
  const trail: AdminBreadcrumbItem[] = [
    { label: shell.admin, href: ADMIN_ROUTES.dashboard },
    ...items,
  ];

  return (
    <nav aria-label={shell.breadcrumb} className="text-sm text-[var(--admin-muted)]">
      <ol className="flex flex-wrap items-center gap-1.5">
        {trail.map((item, index) => {
          const isLast = index === trail.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 ? (
                <span aria-hidden className="text-[var(--admin-border)]">
                  /
                </span>
              ) : null}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="admin-accent-ring rounded transition-colors hover:text-[var(--admin-text)]"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={
                    isLast ? "font-medium text-[var(--admin-text)]" : undefined
                  }
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
