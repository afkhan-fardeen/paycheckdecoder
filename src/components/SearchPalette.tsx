"use client";

import {
  BookOpenCheck,
  Calculator,
  Clock,
  CornerDownLeft,
  FileText,
  MapPin,
  Search,
  Timer,
  X,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { searchItems, type SearchItem, type SearchKind } from "@/lib/search-index";
import { OPEN_SEARCH_EVENT } from "./SearchButton";

const KIND_ICON: Record<SearchKind, LucideIcon> = {
  State: MapPin,
  Tool: Calculator,
  "Hourly wage": Clock,
  Page: FileText,
};

function iconFor(item: SearchItem): LucideIcon {
  if (item.href === "/overtime-calculator") return Timer;
  if (item.href === "/methodology") return BookOpenCheck;
  return KIND_ICON[item.kind];
}

/**
 * Command palette: Ctrl or Cmd + K, or "/", opens it. Arrow keys move, Enter opens, Escape closes.
 * Built on the native <dialog>, which traps focus and restores it on close.
 */
export function SearchPalette({ items }: { items: SearchItem[] }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const results = useMemo(() => searchItems(items, query, 8), [items, query]);

  /** The dialog element is the source of truth for open/closed; handlers call these directly. */
  const show = useCallback(() => {
    const d = dialog.current;
    if (!d || d.open) return;
    setQuery("");
    setActive(0);
    d.showModal();
    requestAnimationFrame(() => input.current?.focus());
  }, []);
  const hide = useCallback(() => dialog.current?.close(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      // A closed dialog can still hold focus in some browsers, so a key typed there is not "typing in a field".
      const inClosedPalette = Boolean(t?.closest("dialog.palette")) && !dialog.current?.open;
      const typing =
        !inClosedPalette &&
        t &&
        (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialog.current?.open) hide();
        else show();
      } else if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        show();
      }
    };
    window.addEventListener(OPEN_SEARCH_EVENT, show);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_SEARCH_EVENT, show);
      window.removeEventListener("keydown", onKey);
    };
  }, [show, hide]);

  function go(item: SearchItem | undefined) {
    if (!item) return;
    hide();
    router.push(item.href);
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (results.length ? (a + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (results.length ? (a - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    }
  }

  // Keep the highlighted row in view while arrowing through the list.
  useEffect(() => {
    document.getElementById(`${listId}-opt-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, listId]);

  return (
    <dialog
      ref={dialog}
      className="palette"
      aria-label="Search"
      onClose={() => input.current?.blur()}
      onClick={(e) => e.target === dialog.current && hide()}
    >
      <div className="palette-panel">
        <div className="palette-field">
          <Search size={20} strokeWidth={1.5} aria-hidden="true" />
          <input
            ref={input}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={results.length ? `${listId}-opt-${active}` : undefined}
            aria-autocomplete="list"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Search states, tools and hourly wages"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKey}
          />
          <button type="button" className="palette-close" onClick={hide} aria-label="Close search">
            <X size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <p className="palette-label" id={`${listId}-label`}>
          {query.trim() ? `${results.length} ${results.length === 1 ? "result" : "results"}` : "Popular"}
        </p>
        <ul id={listId} role="listbox" aria-labelledby={`${listId}-label`} className="palette-list">
          {results.map((item, i) => {
            const Icon = iconFor(item);
            return (
              <li
                key={item.href}
                id={`${listId}-opt-${i}`}
                role="option"
                aria-selected={i === active}
                className={i === active ? "is-active" : undefined}
                onMouseMove={() => setActive(i)}
                onClick={() => go(item)}
              >
                <span className="palette-icon" aria-hidden="true">
                  <Icon size={18} strokeWidth={1.5} />
                </span>
                <span className="palette-text">
                  <span className="palette-title">{item.title}</span>
                  <small>{item.description}</small>
                </span>
                <span className="palette-kind">{item.kind}</span>
              </li>
            );
          })}
        </ul>
        {results.length === 0 ? (
          <p className="palette-empty" role="status">
            No matches for &ldquo;{query}&rdquo;. Try a state name, an hourly wage like 25, or
            &ldquo;overtime&rdquo;.
          </p>
        ) : null}
        <div className="palette-foot" aria-hidden="true">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> to move
          </span>
          <span>
            <kbd>
              <CornerDownLeft size={12} strokeWidth={1.5} />
            </kbd>{" "}
            to open
          </span>
          <span>
            <kbd>Esc</kbd> to close
          </span>
        </div>
      </div>
    </dialog>
  );
}
