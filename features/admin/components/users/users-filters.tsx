"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { ADMIN_ROUTES } from "@/lib/constants";

export function UsersFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const current = searchParams.get("q") ?? "";
      if (q === current) return;
      const params = new URLSearchParams(searchParams.toString());
      if (q.trim()) params.set("q", q.trim());
      else params.delete("q");
      params.set("page", "1");
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [q, pathname, router, searchParams]);

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  const selectClass = "admin-select w-full";

  return (
    <div className="admin-glass admin-panel space-y-3 rounded-2xl p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search users</span>
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search name, email, workspace…"
            className="admin-accent-ring w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted)]"
          />
          {pending ? (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--admin-muted)]">
              Updating…
            </span>
          ) : null}
        </label>
        <a
          href={ADMIN_ROUTES.users}
          className="text-xs text-[var(--admin-muted)] hover:text-[var(--admin-text)]"
        >
          Clear filters
        </a>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <select
          className={selectClass}
          value={searchParams.get("role") ?? ""}
          onChange={(e) => update("role", e.target.value)}
          aria-label="Filter by role"
        >
          <option value="">Role</option>
          <option value="platform_admin">Platform Admin</option>
          <option value="product_admin">Product Admin</option>
          <option value="user">User</option>
        </select>
        <select
          className={selectClass}
          value={searchParams.get("plan") ?? ""}
          onChange={(e) => update("plan", e.target.value)}
          aria-label="Filter by plan"
        >
          <option value="">Plan</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select
          className={selectClass}
          value={searchParams.get("status") ?? ""}
          onChange={(e) => update("status", e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="banned">Suspended</option>
        </select>
        <select
          className={selectClass}
          value={searchParams.get("verified") ?? ""}
          onChange={(e) => update("verified", e.target.value)}
          aria-label="Filter by verified"
        >
          <option value="">Verified</option>
          <option value="yes">Verified</option>
          <option value="no">Unverified</option>
        </select>
        <input
          className={selectClass}
          placeholder="Country"
          defaultValue={searchParams.get("country") ?? ""}
          onBlur={(e) => update("country", e.target.value.trim())}
          aria-label="Filter by country"
        />
        <input
          type="date"
          className={selectClass}
          defaultValue={searchParams.get("createdFrom") ?? ""}
          onChange={(e) => update("createdFrom", e.target.value)}
          aria-label="Created from"
        />
        <input
          type="date"
          className={selectClass}
          defaultValue={searchParams.get("lastLoginFrom") ?? ""}
          onChange={(e) => update("lastLoginFrom", e.target.value)}
          aria-label="Last login from"
        />
      </div>
    </div>
  );
}
