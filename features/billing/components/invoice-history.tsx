import { Receipt } from "lucide-react";

import { Badge } from "@/components/dashboard/badge";
import type { BadgeProps } from "@/components/dashboard/badge";
import { DataTable } from "@/components/dashboard/data-table";
import type { Column } from "@/components/dashboard/data-table";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  Panel,
  PanelContent,
  PanelDescription,
  PanelHeader,
  PanelTitle,
} from "@/components/dashboard/panel";
import { FadeIn } from "@/components/dashboard/motion";
import { formatMoney } from "@/utils/billing";
import type { BillingInvoice, InvoiceStatus } from "@/services/billing/types";
import { formatDate } from "@/utils/format";

const invoiceTone: Record<InvoiceStatus, BadgeProps["tone"]> = {
  paid: "success",
  open: "warning",
  void: "default",
  draft: "default",
};

export function InvoiceHistory({ invoices }: { invoices: BillingInvoice[] }) {
  const columns: Column<BillingInvoice>[] = [
    {
      key: "number",
      header: "Invoice",
      render: (invoice) => (
        <span className="font-medium text-zt-text">{invoice.number}</span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (invoice) => (
        <span className="text-zt-text">
          {formatMoney(invoice.amountCents, invoice.currency)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (invoice) => (
        <Badge tone={invoiceTone[invoice.status]}>{invoice.status}</Badge>
      ),
    },
    {
      key: "issued",
      header: "Issued",
      align: "right",
      render: (invoice) => (
        <span className="text-zt-muted">{formatDate(invoice.issuedAt)}</span>
      ),
    },
  ];

  return (
    <FadeIn delay={0.04}>
      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Invoice history</PanelTitle>
            <PanelDescription>
              Invoices sync from your PaymentProvider once connected. No mock
              invoices are shown.
            </PanelDescription>
          </div>
        </PanelHeader>
        <PanelContent>
          <DataTable
            columns={columns}
            rows={invoices}
            getRowId={(invoice) => invoice.id}
            empty={
              <EmptyState
                icon={Receipt}
                title="No invoices yet"
                description="After a payment provider is connected and the first billing cycle completes, invoices appear here."
              />
            }
          />
        </PanelContent>
      </Panel>
    </FadeIn>
  );
}
