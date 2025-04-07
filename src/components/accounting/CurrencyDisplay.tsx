
import { useAccounting } from "@/modules/accounting";

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
  const { state } = useAccounting();
  
  // Use provided currency or fall back to the default currency from config
  const currencyCode = currency || state.config?.defaultCurrency || "USD";
  
  // Format the amount with appropriate currency
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: showSymbol ? "currency" : "decimal",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  
  return <span className={className}>{formattedAmount}</span>;
}
