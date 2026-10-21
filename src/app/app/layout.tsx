import type { Metadata } from "next";
import { logout } from "@/app/actions/auth";
import { AppNav } from "@/components/app-nav";
import { Wordmark } from "@/components/wordmark";
import { requireUser } from "@/lib/auth/session";
import { firstName } from "@/lib/format";
import { VerifyBanner } from "./verify-banner";
import styles from "./app.module.css";

export const metadata: Metadata = { title: { default: "Today", template: "%s · Keepsake" }, robots: { index: false } };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Wordmark href="/app" />
          <AppNav />
          <form action={logout} className={styles.account}>
            <span className={styles.who}>{firstName(user.name)}</span>
            <button type="submit" className="link-button">
              Log out
            </button>
          </form>
        </div>
        <hr className="rule-double" />
      </header>
      {!user.emailVerifiedAt ? <VerifyBanner email={user.email} /> : null}
      <main id="main" className={styles.main}>
        {children}
      </main>
    </div>
  );
}
