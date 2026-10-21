"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/app/app/app.module.css";

const ITEMS = [
  { href: "/app", label: "Today" },
  { href: "/app/people", label: "People" },
  { href: "/app/letters", label: "Letters" },
  { href: "/app/settings", label: "Settings" },
];

export function AppNav() {
  const path = usePathname();
  return (
    <nav aria-label="Keepsake" className={styles.nav}>
      {ITEMS.map((item) => {
        const active = item.href === "/app" ? path === "/app" : path.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={styles.navItem} aria-current={active ? "page" : undefined}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
