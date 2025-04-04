
// This file is kept for backwards compatibility
// It re-exports the new modularized auth hooks

import { useAuth, AuthProvider } from "./auth/useAuth";
import type { AuthContextType } from "./auth/types";

export { useAuth, AuthProvider };
export type { AuthContextType };
