"use client";

import { useId, useState, type ComponentType } from "react";
import Link from "next/link";
import {
  BarChart3,
  Building2,
  Check,
  Code2,
  Rocket,
  Star,
} from "lucide-react";

import { useDictionary } from "@/components/i18n/locale-provider";
import { FadeIn } from "@/components/dashboard/motion";
import { Modal } from "@/components/dashboard/modal";
import { ROUTES } from "@/lib/constants";
import {
  PRICING_PRESENTATION_PLANS,
  type PricingPresentationPlanId,
} from "@/services/billing/pricing-presentation";
import { formatMoney } from "@/utils/billing";
import { PaymentMethodsRow } from "@/features/landing/components/payment-methods-row";

const PLAN_ICONS: Record<
  PricingPresentationPlanId,
  ComponentType<{ className?: string; "aria-hidden"?: boolean }>
> = {
  free: Rocket,
  developer: Code2,
  pro: BarChart3,
  business: Building2,
};

/** Visible feature rows before expand (keeps cards aligned). */
const PREVIEW_FEATURES = 8;
const COMPACT_PREVIEW_FEATURES = 5;

/**
 * Lemon-review pricing cards. Paid CTAs never call checkout or Lemon.
 */
export function MarketingPricingCards({
  showPaymentMethods = true,
  compact = false,
}: {
  showPaymentMethods?: boolean;
  /** Landing teaser: fewer feature rows. */
  compact?: boolean;
}) {
  const { dict } = useDictionary();
  const p = dict.landing.pricing;
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const previewCount = compact ? COMPACT_PREVIEW_FEATURES : PREVIEW_FEATURES;

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {PRICING_PRESENTATION_PLANS.map((plan, index) => {
          const copy = p.plans[plan.id];
          const Icon = PLAN_ICONS[plan.id];
          return (
            <FadeIn key={plan.id} delay={index * 0.04} className="h-full min-h-0">
              <article
                className={`relative flex h-full min-h-[34rem] flex-col overflow-hidden rounded-2xl border p-5 pt-8 sm:min-h-[36rem] sm:p-6 sm:pt-9 ${
                  plan.highlighted
                    ? "border-zt-primary/55 bg-gradient-to-b from-zt-primary/[0.12] via-zt-surface to-zt-surface shadow-[0_0_48px_-18px_var(--color-zt-primary)]"
                    : "border-white/10 bg-zt-surface/95"
                }`}
              >
                {plan.highlighted ? (
                  <div className="absolute top-0 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-zt-primary/35 bg-zt-primary px-3 py-1 text-[11px] font-semibold tracking-wide text-[#041018] uppercase shadow-[0_0_20px_-4px_var(--color-zt-primary)]">
                      <Star className="size-3 fill-current" aria-hidden />
                      {p.popular}
                    </span>
                  </div>
                ) : null}

                <header className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-zt-primary/25 bg-zt-primary/10 text-zt-primary"
                      aria-hidden
                    >
                      <Icon className="size-5" />
                    </span>
                    <h3 className="text-sm font-semibold tracking-[0.16em] text-zt-text uppercase">
                      {copy.name}
                    </h3>
                  </div>
                  <p className="text-4xl font-semibold tracking-tight text-zt-text tabular-nums">
                    {formatMoney(plan.amountCents, plan.currency)}
                    <span className="ml-1.5 text-sm font-normal text-zt-muted">
                      {p.perMonth}
                    </span>
                  </p>
                  <p className="min-h-[2.75rem] text-sm leading-relaxed text-zt-muted">
                    {copy.description}
                  </p>
                </header>

                <ul className="mt-6 space-y-2 border-b border-white/8 pb-5 text-sm text-zt-text">
                  {copy.limits.map((limit) => (
                    <li key={limit} className="flex items-start gap-2.5">
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-zt-success"
                        aria-hidden
                      />
                      <span className="leading-snug">{limit}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 flex min-h-0 flex-1 flex-col">
                  <FeatureList
                    features={copy.features}
                    previewCount={previewCount}
                    moreLabel={p.moreFeatures}
                    lessLabel={p.showLess}
                    compact={compact}
                    viewAllLabel={p.viewAllPlans}
                  />
                </div>

                <div className="mt-auto pt-6">
                  <PlanCta
                    planId={plan.id}
                    ctaKind={plan.ctaKind}
                    label={copy.cta}
                    onPaidClick={() => setComingSoonOpen(true)}
                  />
                </div>
              </article>
            </FadeIn>
          );
        })}
      </div>

      {showPaymentMethods ? (
        <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-zt-surface/50 px-4 py-8 sm:px-8">
          <PaymentMethodsRow
            variant="cards"
            className="mx-auto"
            title={dict.footer.paymentMethods}
            labels={{
              visa: dict.footer.paymentVisa,
              mastercard: dict.footer.paymentMastercard,
              amex: dict.footer.paymentAmex,
              discover: dict.footer.paymentDiscover,
              diners: dict.footer.paymentDiners,
            }}
          />
          <p className="mx-auto mt-5 max-w-2xl text-center text-sm leading-relaxed text-zt-muted">
            {p.paymentSecureNote}
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-center text-xs leading-relaxed text-zt-muted/80">
            {p.paymentMethodsNote}
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-center text-xs leading-relaxed text-zt-muted">
            {p.legalNoteBefore}{" "}
            <Link
              href={ROUTES.legalTerms}
              className="text-zt-accent underline-offset-2 hover:underline"
            >
              {p.legalTermsLink}
            </Link>
            {p.legalNoteBetween}{" "}
            <Link
              href={ROUTES.legalRefundCancellation}
              className="text-zt-accent underline-offset-2 hover:underline"
            >
              {p.legalRefundLink}
            </Link>
            {p.legalNoteBetween}{" "}
            <Link
              href={ROUTES.legalDistanceSales}
              className="text-zt-accent underline-offset-2 hover:underline"
            >
              {p.legalDistanceSalesLink}
            </Link>
            {", "}
            {p.legalNoteAnd}{" "}
            <Link
              href={ROUTES.legalPreliminaryInformation}
              className="text-zt-accent underline-offset-2 hover:underline"
            >
              {p.legalPreliminaryLink}
            </Link>
            .
          </p>
        </div>
      ) : null}

      <Modal
        open={comingSoonOpen}
        onClose={() => setComingSoonOpen(false)}
        title={p.comingSoonTitle}
        description={p.comingSoonBody}
        footer={
          <button
            type="button"
            onClick={() => setComingSoonOpen(false)}
            className="inline-flex h-9 items-center rounded-xl bg-zt-primary px-4 text-sm font-medium text-[#041018] transition-colors hover:bg-zt-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zt-primary"
          >
            {p.comingSoonClose}
          </button>
        }
      />
    </div>
  );
}

function FeatureList({
  features,
  previewCount,
  moreLabel,
  lessLabel,
  compact,
  viewAllLabel,
}: {
  features: readonly string[];
  previewCount: number;
  moreLabel: string;
  lessLabel: string;
  compact: boolean;
  viewAllLabel: string;
}) {
  const listId = useId();
  const [expanded, setExpanded] = useState(false);
  const hiddenCount = Math.max(0, features.length - previewCount);
  const visible =
    expanded || hiddenCount === 0
      ? features
      : features.slice(0, previewCount);

  if (compact && !expanded) {
    const compactVisible = features.slice(0, previewCount);
    return (
      <>
        <ul className="space-y-2 text-sm text-zt-muted" id={listId}>
          {compactVisible.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5">
              <Check
                className="mt-0.5 size-3.5 shrink-0 text-zt-primary"
                aria-hidden
              />
              <span className="leading-snug">{feature}</span>
            </li>
          ))}
        </ul>
        {features.length > previewCount ? (
          <Link
            href={ROUTES.pricing}
            className="mt-3 inline-flex text-xs font-medium text-zt-primary transition-colors hover:text-zt-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zt-primary"
          >
            {viewAllLabel}
          </Link>
        ) : null}
      </>
    );
  }

  return (
    <>
      <ul className="space-y-2 text-sm text-zt-muted" id={listId}>
        {visible.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <Check
              className="mt-0.5 size-3.5 shrink-0 text-zt-primary"
              aria-hidden
            />
            <span className="leading-snug">{feature}</span>
          </li>
        ))}
      </ul>
      {hiddenCount > 0 ? (
        <button
          type="button"
          className="mt-3 inline-flex rounded-md text-left text-xs font-medium text-zt-primary transition-colors hover:text-zt-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zt-primary"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded
            ? lessLabel
            : moreLabel.replace("{count}", String(hiddenCount))}
        </button>
      ) : null}
    </>
  );
}

function PlanCta({
  planId,
  ctaKind,
  label,
  onPaidClick,
}: {
  planId: PricingPresentationPlanId;
  ctaKind: "start_free" | "subscribe";
  label: string;
  onPaidClick: () => void;
}) {
  const className =
    "inline-flex h-11 w-full items-center justify-center rounded-xl bg-zt-primary text-sm font-semibold text-[#041018] transition-colors hover:bg-zt-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zt-primary";

  if (ctaKind === "start_free") {
    return (
      <Link href={`${ROUTES.register}?plan=${planId}`} className={className}>
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onPaidClick}
      className={className}
      data-pricing-cta={planId}
      data-checkout="disabled"
    >
      {label}
    </button>
  );
}
