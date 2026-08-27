/**
 * Decorative payment brand marks for footer / pricing UI only.
 * No payment provider APIs and no card capture.
 */

import { cn } from "@/lib/utils";

const badgeClass =
  "inline-flex h-10 min-w-[4.5rem] items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-[10px] font-bold tracking-wide text-zt-text sm:h-11 sm:min-w-[5.25rem]";

const cardBadgeClass =
  "inline-flex h-14 w-[6.25rem] shrink-0 items-center justify-center rounded-xl border border-black/5 bg-white px-2.5 shadow-[0_10px_28px_-14px_rgba(0,0,0,0.65)] sm:h-16 sm:w-[7.25rem]";

export function PaymentMethodsRow({
  title,
  labels,
  className,
  variant = "default",
}: {
  title: string;
  labels: {
    visa: string;
    mastercard: string;
    amex: string;
    discover: string;
    diners: string;
  };
  /** Optional wrapper class; defaults keep footer spacing. */
  className?: string;
  /** `cards` = white equal-size tiles for pricing/footer polish. */
  variant?: "default" | "cards";
}) {
  const items = [
    { key: "visa", label: labels.visa },
    { key: "mastercard", label: labels.mastercard },
    { key: "amex", label: labels.amex },
    { key: "discover", label: labels.discover },
    { key: "diners", label: labels.diners },
  ] as const;

  const isCards = variant === "cards";

  return (
    <div
      className={cn(
        className ?? "mx-auto mt-10 max-w-6xl border-t border-zt-border pt-8",
      )}
    >
      {title ? (
        <p
          className={cn(
            "font-semibold text-zt-text",
            isCards ? "text-center text-sm" : "text-sm",
          )}
        >
          {title}
        </p>
      ) : null}
      <ul
        className={cn(
          "flex flex-wrap items-center gap-2.5 sm:gap-3",
          isCards
            ? "mt-5 justify-center gap-3 sm:gap-3.5"
            : "mt-4 justify-start",
        )}
        aria-label={title || undefined}
      >
        {items.map((item) => (
          <li key={item.key} className="shrink-0">
            <span
              className={isCards ? cardBadgeClass : badgeClass}
              role="img"
              aria-label={item.label}
              title={item.label}
            >
              {item.key === "visa" ? (
                <VisaMark cards={isCards} />
              ) : item.key === "mastercard" ? (
                <MastercardMark cards={isCards} />
              ) : item.key === "amex" ? (
                <AmexMark cards={isCards} />
              ) : item.key === "discover" ? (
                <DiscoverMark cards={isCards} />
              ) : (
                <DinersMark cards={isCards} />
              )}
              <span className="sr-only">{item.label}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function VisaMark({ cards }: { cards?: boolean }) {
  return (
    <svg
      viewBox="0 0 56 18"
      className={cards ? "h-5 w-14 text-[#1a1f71]" : "h-3.5 w-11 text-zt-text"}
      aria-hidden
    >
      <text
        x="2"
        y="14"
        fill="currentColor"
        fontSize="13"
        fontWeight="800"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        letterSpacing="1"
      >
        VISA
      </text>
    </svg>
  );
}

function MastercardMark({ cards }: { cards?: boolean }) {
  return (
    <svg
      viewBox="0 0 44 28"
      className={cards ? "h-7 w-11" : "h-5 w-8"}
      aria-hidden
    >
      <circle cx="17" cy="14" r="9" fill="#eb001b" />
      <circle cx="27" cy="14" r="9" fill="#f79e1b" />
      <path d="M22 7.2a9 9 0 0 1 0 13.6 9 9 0 0 1 0-13.6z" fill="#ff5f00" />
    </svg>
  );
}

function AmexMark({ cards }: { cards?: boolean }) {
  if (cards) {
    return (
      <span className="inline-flex h-9 w-[5.5rem] items-center justify-center rounded-md bg-[#2e77bc] px-2">
        <svg viewBox="0 0 52 16" className="h-3.5 w-11 text-white" aria-hidden>
          <text
            x="1"
            y="12"
            fill="currentColor"
            fontSize="11"
            fontWeight="800"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            letterSpacing="0.6"
          >
            AMEX
          </text>
        </svg>
      </span>
    );
  }
  return (
    <svg viewBox="0 0 52 16" className="h-3.5 w-11" aria-hidden>
      <text
        x="0"
        y="12"
        fill="currentColor"
        fontSize="11"
        fontWeight="700"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        AMEX
      </text>
    </svg>
  );
}

function DiscoverMark({ cards }: { cards?: boolean }) {
  return (
    <svg
      viewBox="0 0 72 18"
      className={cards ? "h-5 w-16 text-[#1a1a1a]" : "h-3.5 w-12"}
      aria-hidden
    >
      <text
        x="1"
        y="13"
        fill="currentColor"
        fontSize="10"
        fontWeight="800"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        letterSpacing="0.4"
      >
        DISCOVER
      </text>
      {cards ? <circle cx="66" cy="10" r="4" fill="#ff6600" /> : null}
    </svg>
  );
}

function DinersMark({ cards }: { cards?: boolean }) {
  return (
    <svg
      viewBox="0 0 88 20"
      className={cards ? "h-5 w-[4.75rem] text-[#0079be]" : "h-3.5 w-14"}
      aria-hidden
    >
      <text
        x="2"
        y="14"
        fill="currentColor"
        fontSize={cards ? 8.5 : 8}
        fontWeight="800"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        letterSpacing="0.3"
      >
        DINERS CLUB
      </text>
    </svg>
  );
}
