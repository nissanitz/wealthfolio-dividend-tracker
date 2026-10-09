import {
  Button,
  Icons,
  Page,
  PageContent,
  PageHeader,
  Skeleton,
  TooltipProvider,
} from "@wealthfolio/ui";
import type { AddonContext } from "@wealthfolio/addon-sdk";
import { useDividendData } from "./lib/data";
import { KpiCards } from "./components/kpi-cards";
import { DividendsReceived } from "./components/dividends-received";
import { IncomeByHolding } from "./components/income-by-holding";
import { DividendGrowth } from "./components/dividend-growth";
import { FuturePayments } from "./components/future-payments";
import { TaxesPaid } from "./components/taxes-paid";
import { Diversification } from "./components/diversification";
import { YieldPanel } from "./components/yield-panel";
import { HoldingsTable } from "./components/holdings-table";
import { EmptyState } from "./components/primitives";

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function DividendDashboard({ ctx }: { ctx: AddonContext }) {
  const { metrics, isLoading, isError, refetch } = useDividendData(ctx);

  return (
    <Page className="min-h-screen">
      <PageHeader
        heading="Dividend Dashboard"
        text="Passive income, growth and forward projections across your holdings"
        actions={
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={refetch}
            disabled={isLoading}
          >
            <Icons.RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </Button>
        }
      />
      <PageContent>
        <TooltipProvider delayDuration={200}>
          {isLoading ? (
            <LoadingSkeleton />
          ) : isError ? (
            <EmptyState message="Could not load dividend data. Try refreshing." />
          ) : !metrics.hasData && metrics.holdings.length === 0 ? (
            <EmptyState message="No dividend income found in this portfolio yet." />
          ) : (
            <div className="flex flex-col gap-4">
              <KpiCards metrics={metrics} />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <DividendsReceived metrics={metrics} />
                <TaxesPaid metrics={metrics} />
                <div className="lg:col-span-2">
                  <DividendGrowth metrics={metrics} />
                </div>
                <IncomeByHolding metrics={metrics} />
                <FuturePayments metrics={metrics} />
                <Diversification metrics={metrics} />
                <YieldPanel metrics={metrics} />
                <div className="lg:col-span-2">
                  <HoldingsTable metrics={metrics} />
                </div>
              </div>
            </div>
          )}
        </TooltipProvider>
      </PageContent>
    </Page>
  );
}
