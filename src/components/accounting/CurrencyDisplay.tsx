
import { useAccounting } from "@/modules/accounting";
import { useState } from "react";

interface CurrencyDisplayProps {
  amount: number;
  currency?: string;
  showSymbol?: boolean;
  className?: string;
}

export function CurrencyDisplay({
  amount,
  currency,
  showSymbol = true,
  className = "",
}: CurrencyDisplayProps) {
  // Fallback to USD if context is not available
  const [fallbackCurrency] = useState("USD");
  
  // Try to get the context, but use fallback values if it fails
  let contextCurrency = fallbackCurrency;
  try {
    const { state } = useAccounting();
    contextCurrency = state.config?.defaultCurrency || fallbackCurrency;
  } catch (error) {
    console.warn("AccountingContext not available, using fallback currency", error);
  }
  
  // Use provided currency or fall back to the context/default currency
  const currencyCode = currency || contextCurrency;
  
  // Format the amount with appropriate currency
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: showSymbol ? "currency" : "decimal",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  
  return <span className={className}>{formattedAmount}</span>;
}
