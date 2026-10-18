import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="foot">
      <div className="foot-in">
        <span>
          © {new Date().getFullYear()} {SITE_NAME}. Estimates only, not tax advice.
        </span>
        <nav aria-label="Footer">
          <Link href="/about">About</Link> · <Link href="/methodology">Methodology</Link> ·{" "}
          <Link href="/disclaimer">Disclaimer</Link> · <Link href="/privacy">Privacy</Link> ·{" "}
          <Link href="/terms">Terms</Link> · <Link href="/contact">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
