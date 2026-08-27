"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { useDictionary } from "@/components/i18n/locale-provider";
import { ADMIN_ROUTES } from "@/lib/constants";

export function WorkspacesFilters() {
  const { dict } = useDictionary();
  const t = dict.admin.workspaces.filters;
  const common = dict.admin.common;
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
  const inputClass = "admin-select w-full";

  return (
    <div className="admin-glass admin-panel space-y-3 rounded-2xl p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{t.searchLabel}</span>
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder={t.searchPlaceholder}
            className="admin-accent-ring w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted)]"
          />
          {pending ? (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--admin-muted)]">
              {common.updating}
            </span>
          ) : null}
        </label>
        <a
          href={ADMIN_ROUTES.workspaces}
          className="text-xs text-[var(--admin-muted)] hover:text-[var(--admin-text)]"
        >
          {common.clearFilters}
        </a>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <select
          className={selectClass}
          value={searchParams.get("plan") ?? ""}
          onChange={(e) => update("plan", e.target.value)}
          aria-label={t.ariaPlan}
        >
          <option value="">{t.plan}</option>
          <option value="free">{t.free}</option>
          <option value="pro">{t.pro}</option>
          <option value="enterprise">{t.enterprise}</option>
        </select>
        <select
          className={selectClass}
          value={searchParams.get("status") ?? ""}
          onChange={(e) => update("status", e.target.value)}
          aria-label={t.ariaStatus}
        >
          <option value="">{t.status}</option>
          <option value="active">{t.active}</option>
          <option value="suspended">{t.suspended}</option>
          <option value="archived">{t.archived}</option>
        </select>
        <input
          className={inputClass}
          placeholder={t.country}
          defaultValue={searchParams.get("country") ?? ""}
          onBlur={(e) => update("country", e.target.value.trim())}
          aria-label={t.ariaCountry}
        />
        <input
          className={inputClass}
          type="date"
          value={searchParams.get("createdFrom") ?? ""}
          onChange={(e) => update("createdFrom", e.target.value)}
          aria-label={t.createdFrom}
        />
        <input
          className={inputClass}
          type="date"
          value={searchParams.get("createdTo") ?? ""}
          onChange={(e) => update("createdTo", e.target.value)}
          aria-label={t.createdTo}
        />
        <select
          className={selectClass}
          value={searchParams.get("storage") ?? ""}
          onChange={(e) => update("storage", e.target.value)}
          aria-label={t.ariaStorage}
        >
          <option value="">{t.storage}</option>
          <option value="with_logo">{t.hasLogo}</option>
          <option value="no_logo">{t.noLogo}</option>
        </select>
        <input
          className={inputClass}
          type="number"
          min={0}
          placeholder={t.minMembers}
          defaultValue={searchParams.get("membersMin") ?? ""}
          onBlur={(e) => update("membersMin", e.target.value)}
          aria-label={t.ariaMembersMin}
        />
        <input
          className={inputClass}
          type="number"
          min={0}
          placeholder={t.maxMembers}
          defaultValue={searchParams.get("membersMax") ?? ""}
          onBlur={(e) => update("membersMax", e.target.value)}
          aria-label={t.ariaMembersMax}
        />
      </div>
    </div>
  );
}
