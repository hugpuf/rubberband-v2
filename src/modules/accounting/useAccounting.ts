
import { useContext } from "react";
import { AccountingContext } from "./accountingContext";

// Export the hook directly to ensure it's consistently used
export const useAccounting = () => {
  const context = useContext(AccountingContext);
  if (!context) {
    throw new Error("useAccounting must be used within an AccountingProvider");
  }
  return context;
};
