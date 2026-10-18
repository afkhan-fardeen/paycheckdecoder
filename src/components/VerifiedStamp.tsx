import { hasSignOff, lastVerifiedOn, sourcesFor, type StateCode } from "@/lib/rates";
import { NOTICE, formatLongDate } from "@/lib/site";

/** Last-verified date, source links and the estimate notice, shown beside the number. */
export function VerifiedStamp({ code }: { code: StateCode }) {
  const verified = lastVerifiedOn(code);
  return (
    <div className="pd-stamp">
      {hasSignOff(code) && verified ? (
        <b>Rates verified {formatLongDate(verified)}.</b>
      ) : (
        <b>Preview: these rates have not been signed off yet.</b>
      )}{" "}
      Sources:{" "}
      {sourcesFor(code).map((s, i, all) => (
        <span key={s.url}>
          <a href={s.url} rel="noopener noreferrer" target="_blank">
            {s.name}
          </a>
          {i < all.length - 1 ? ", " : ". "}
        </span>
      ))}
      {NOTICE}
    </div>
  );
}
