
import { useState, useEffect } from "react";

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
  // Default fallback currency
  const [contextCurrency, setContextCurrency] = useState("USD");
  
  // Try to get the context currency, but use fallback if it fails
  useEffect(() => {
    const getContextCurrency = async () => {
      try {
        const { useAccounting } = await import("@/modules/accounting");
        const { state } = useAccounting();
        if (state.config?.defaultCurrency) {
          setContextCurrency(state.config.defaultCurrency);
        }
      } catch (error) {
        console.warn("AccountingContext not available, using fallback currency", error);
      }
    };
    
    getContextCurrency();
  }, []);
  
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
