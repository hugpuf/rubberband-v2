
import { createContext } from "react";
import { TeamContextType } from "./types";

export const TeamContext = createContext<TeamContextType | undefined>(undefined);
