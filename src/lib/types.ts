import type { Account, IncomeSummary } from "@wealthfolio/addon-sdk";

export type { Account, IncomeSummary };

export interface InstrumentLike {
  id: string;
  symbol: string;
  name?: string | null;
  currency: string;
  quoteMode?: string;
  instrumentType?: string | null;
  exchangeMic?: string | null;
}

export interface MonetaryValue {
  local: number;
  base: number;
}

/**
 * Structural view of a Wealthfolio holding. Mirrors the addon-sdk `Holding`
 * type but keeps the instrument fields the runtime actually exposes
 * (instrumentType / exchangeMic) which the SDK type omits.
 */
export interface HoldingLike {
  id: string;
  accountId: string;
  holdingType: string;
  instrument?: InstrumentLike | null;
  quantity: number;
  localCurrency: string;
  baseCurrency: string;
  marketValue: MonetaryValue;
  costBasis?: MonetaryValue | null;
  income?: MonetaryValue | null;
  weight: number;
  price?: number | null;
}

export interface IncomeByAsset {
  assetId: string;
  kind: string;
  symbol: string;
  name: string;
  income: number;
}
