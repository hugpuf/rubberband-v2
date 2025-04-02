
import { useContext } from "react";
import { AuthContext } from "./useAuthProvider";

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Re-export the provider for easier imports
export { AuthProvider } from "./useAuthProvider";
