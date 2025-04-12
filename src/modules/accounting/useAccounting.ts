
import { useContext } from "react";
import { AccountingContext } from "./accountingContext";

/**
 * Hook to access accounting context with graceful error handling
 */
export const useAccounting = () => {
  const context = useContext(AccountingContext);
  
  if (!context) {
    console.error("useAccounting called outside of AccountingProvider");
    throw new Error("useAccounting must be used within an AccountingProvider");
  }
  
  return context;
};
