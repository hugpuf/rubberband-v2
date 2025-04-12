
import { useContext } from "react";
import { AccountingContext } from "./accountingContext";

/**
 * Hook to access accounting context with graceful error handling
 * Throws an error only when used directly without a try/catch block
 */
export const useAccounting = () => {
  const context = useContext(AccountingContext);
  
  if (!context) {
    console.error("useAccounting called outside of AccountingProvider");
    throw new Error("useAccounting must be used within an AccountingProvider");
  }
  
  return context;
};
