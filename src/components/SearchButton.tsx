"use client";

import { Search } from "lucide-react";
import { useSyncExternalStore } from "react";

export const OPEN_SEARCH_EVENT = "pd:open-search";

export function openSearch() {
  window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
}

/** The right shortcut hint for the visitor's platform. The server snapshot keeps the first render identical to the HTML. */
const subscribe = () => () => {};
const clientHint = () =>
  /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? "⌘K" : "Ctrl K";
function useShortcutHint() {
  return useSyncExternalStore(subscribe, clientHint, () => "Ctrl K");
}

interface Props {
  /** "bar" is the wide field used in the header and hero; "icon" is the compact phone button. */
  variant: "bar" | "icon" | "hero";
  placeholder?: string;
}

export function SearchButton({ variant, placeholder = "Search states, tools and wages" }: Props) {
  const hint = useShortcutHint();
  if (variant === "icon") {
    return (
      <button type="button" className="icon-btn" onClick={openSearch} aria-label="Search">
        <Search size={20} strokeWidth={1.5} aria-hidden="true" />
      </button>
    );
  }
  return (
    <button type="button" className={`search-bar is-${variant}`} onClick={openSearch}>
      <Search size={variant === "hero" ? 20 : 18} strokeWidth={1.5} aria-hidden="true" />
      <span className="search-bar-text">{placeholder}</span>
      <kbd aria-hidden="true">{hint}</kbd>
      <span className="sr-only">Opens search. Keyboard shortcut: {hint}.</span>
    </button>
  );
}
