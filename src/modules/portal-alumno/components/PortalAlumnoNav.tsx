"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PORTAL_ALUMNO_LINKS } from "../data";

export default function PortalAlumnoNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="flex flex-wrap gap-2 rounded-[18px] border border-white/70 bg-white/72 p-2 shadow-card">
      {PORTAL_ALUMNO_LINKS.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            onMouseEnter={() => router.prefetch(item.href)}
            onFocus={() => router.prefetch(item.href)}
            className={[
              "rounded-xl px-3.5 py-2 text-[0.84rem] font-semibold no-underline transition-colors",
              isActive
                ? "bg-accent text-white shadow-[0_10px_24px_rgba(159,29,62,0.22)]"
                : "text-text-mid hover:bg-surface2 hover:text-navy",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
