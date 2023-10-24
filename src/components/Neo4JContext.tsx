import { Driver } from "neo4j-driver-core";
import { createContext } from "react";

export const Neo4JContext = createContext<Driver | null>(null);
