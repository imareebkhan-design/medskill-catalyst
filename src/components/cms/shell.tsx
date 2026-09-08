"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { isActive, type NavSection } from "@/src/lib/cms-nav";
import { Icon } from "./icons";

/**
 * The CMS chrome: sidebar, header, and user menu.
 *
 * A client component because it owns the mobile drawer and the profile
 * dropdown. It receives an already-filtered `sections` list from the server —
 * it never decides permissions itself, and hiding a link here is presentation,
 * not access control.
 */

type ShellUser = { fullName: string; email: string; roleLabel: string };

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function NavLinks({
  sections,
  pathname,
  onNavigate,
}: {
  sections: NavSection[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
      {sections.map((section, i) => (
        <div key={section.title ?? `group-${i}`}>
          {section.title && (
            <p className="px-3 pb-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-white/40">
              {section.title}
            </p>
          )}
          <ul className="space-y-1">
            {section.items.map((item) => {
              const current = isActive(item, pathname);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={current ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-msc px-3 py-2.5 text-sm font-medium transition ${
                      current
                        ? "bg-white/15 text-white"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarBody({
  sections,
  pathname,
  onNavigate,
}: {
  sections: NavSection[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex h-16 shrink-0 items-center px-6">
        <Link href="/cms" onClick={onNavigate} className="font-display text-lg font-bold text-white">
          MedSkills <span className="text-brand-cyan">Content</span>
        </Link>
      </div>
      <NavLinks sections={sections} pathname={pathname} onNavigate={onNavigate} />
      <div className="shrink-0 border-t border-white/10 px-3 py-4">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-msc px-3 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <Icon name="external" className="h-[18px] w-[18px] shrink-0" />
          View website
        </a>
      </div>
    </>
  );
}

function UserMenu({ user, logout }: { user: ShellUser; logout: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click and on Escape — expected of any menu.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 rounded-pill py-1 pl-1 pr-2.5 transition hover:bg-brand-navy/5"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-navy text-xs font-bold text-white">
          {initialsOf(user.fullName)}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-semibold leading-tight text-ink">
            {user.fullName}
          </span>
          <span className="block text-xs leading-tight text-muted">{user.roleLabel}</span>
        </span>
        <Icon name="chevron" className="hidden h-4 w-4 text-muted sm:block" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-msc-md border border-brand-navy/10 bg-surface shadow-msc-lg"
        >
          <div className="border-b border-brand-navy/10 px-4 py-3">
            <p className="text-sm font-semibold text-ink">{user.fullName}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
            <p className="mt-1.5 inline-flex rounded-pill bg-brand-pale px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide text-brand-blue">
              {user.roleLabel}
            </p>
          </div>
          <Link
            href="/cms/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-canvas"
          >
            Your profile
          </Link>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            className="block px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-canvas"
          >
            View website
          </a>
          <div className="border-t border-brand-navy/10">{logout}</div>
        </div>
      )}
    </div>
  );
}

export function CmsShell({
  sections,
  user,
  logout,
  children,
}: {
  sections: NavSection[];
  user: ShellUser;
  /** Rendered inside the menu — a server-action <form>, so it stays a POST. */
  logout: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "/cms";
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Never leave the drawer covering the page after a navigation.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-canvas">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-brand-navy lg:flex">
        <SidebarBody sections={sections} pathname={pathname} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-brand-navy/50"
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-brand-navy shadow-msc-float">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-4 rounded-msc p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
            <SidebarBody
              sections={sections}
              pathname={pathname}
              onNavigate={() => setDrawerOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-brand-navy/10 bg-surface/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            className="-ml-1 rounded-msc p-2 text-brand-navy transition hover:bg-brand-navy/5 lg:hidden"
          >
            <Icon name="menu" className="h-5 w-5" />
          </button>
          <span className="font-display text-base font-bold text-brand-navy lg:hidden">
            MedSkills <span className="text-brand-blue">Content</span>
          </span>
          <div className="hidden lg:block" />
          <UserMenu user={user} logout={logout} />
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
