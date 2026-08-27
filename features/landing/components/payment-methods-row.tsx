/**
 * Decorative payment brand marks for footer UI only.
 * No payment provider APIs and no card capture.
 */

const badgeClass =
  "inline-flex h-9 min-w-[3.25rem] items-center justify-center rounded-md border border-zt-border bg-white/[0.04] px-2.5 text-[10px] font-bold tracking-wide text-zt-text sm:h-10 sm:min-w-[3.75rem] sm:text-[11px]";

export function PaymentMethodsRow({
  title,
  labels,
}: {
  title: string;
  labels: {
    visa: string;
    mastercard: string;
    amex: string;
    discover: string;
    diners: string;
  };
}) {
  const items = [
    { key: "visa", label: labels.visa, text: "VISA" },
    { key: "mastercard", label: labels.mastercard, text: "MC" },
    { key: "amex", label: labels.amex, text: "AMEX" },
    { key: "discover", label: labels.discover, text: "DISC" },
    { key: "diners", label: labels.diners, text: "DINERS" },
  ] as const;

  return (
    <div className="mx-auto mt-10 max-w-6xl border-t border-zt-border pt-8">
      <p className="text-sm font-semibold text-zt-text">{title}</p>
      <ul className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
        {items.map((item) => (
          <li key={item.key}>
            <span className={badgeClass} role="img" aria-label={item.label}>
              {item.key === "visa" ? (
                <VisaMark />
              ) : item.key === "mastercard" ? (
                <MastercardMark />
              ) : item.key === "amex" ? (
                <AmexMark />
              ) : item.key === "discover" ? (
                <DiscoverMark />
              ) : (
                <DinersMark />
              )}
              <span className="sr-only">{item.label}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function VisaMark() {
  return (
    <svg viewBox="0 0 48 16" className="h-3.5 w-10" aria-hidden>
      <text
        x="0"
        y="12"
        fill="currentColor"
        fontSize="12"
        fontWeight="700"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        VISA
      </text>
    </svg>
  );
}

function MastercardMark() {
  return (
    <svg viewBox="0 0 40 24" className="h-5 w-8" aria-hidden>
      <circle cx="15" cy="12" r="8" fill="#eb001b" opacity="0.9" />
      <circle cx="25" cy="12" r="8" fill="#f79e1b" opacity="0.85" />
      <path
        d="M20 6.2a8 8 0 0 1 0 11.6 8 8 0 0 1 0-11.6z"
        fill="#ff5f00"
        opacity="0.9"
      />
    </svg>
  );
}

function AmexMark() {
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

function DiscoverMark() {
  return (
    <svg viewBox="0 0 56 16" className="h-3.5 w-12" aria-hidden>
      <text
        x="0"
        y="12"
        fill="currentColor"
        fontSize="10"
        fontWeight="700"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        DISCOVER
      </text>
    </svg>
  );
}

function DinersMark() {
  return (
    <svg viewBox="0 0 56 16" className="h-3.5 w-12" aria-hidden>
      <text
        x="0"
        y="12"
        fill="currentColor"
        fontSize="10"
        fontWeight="700"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        DINERS
      </text>
    </svg>
  );
}
