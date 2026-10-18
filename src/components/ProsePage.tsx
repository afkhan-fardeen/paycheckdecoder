import type { ReactNode } from "react";
import { Breadcrumbs } from "./Breadcrumbs";

export function ProsePage({
  title,
  path,
  updated,
  children,
}: {
  title: string;
  path: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <main className="wrap">
      <header className="block" style={{ gap: 12 }}>
        <Breadcrumbs
          items={[
            { name: "Home", href: "/" },
            { name: title, href: path },
          ]}
        />
        <h1>{title}</h1>
        {updated ? <p className="meta">Last updated {updated}</p> : null}
      </header>
      <div className="prose-page">{children}</div>
    </main>
  );
}
