import type { ReactNode } from "react";

/** Two sentences with real numbers, server-rendered so a snippet or an AI assistant can quote them. */
export function AnswerBlock({ children, caption }: { children: ReactNode; caption?: ReactNode }) {
  return (
    <div className="pd-answer" style={{ maxWidth: 720 }}>
      <p>{children}</p>
      {caption ? <span className="pd-caption">{caption}</span> : null}
    </div>
  );
}
