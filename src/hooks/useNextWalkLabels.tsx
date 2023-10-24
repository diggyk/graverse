import { Driver } from "neo4j-driver-core";
import { StepPick } from "../pages/Walk";
import { useEffect, useState } from "react";
import { NodeLabels } from "./useNodesLabels";
import makeWalkQueryPrefix from "../lib/walkQueryPrefix";

export type useNextReturns = {
  labels: NodeLabels;
  loading: boolean;
  error: string | null;
  queryUsed: string;
};

const useNextWalkLabels = (
  driver: Driver | null,
  picks: StepPick[]
): useNextReturns => {
  const [labels, setLabels] = useState<NodeLabels>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryUsed, setQuery] = useState<string>("");

  const handleError = (error: Error) => {
    console.error(error);
    setError(error.message);
  };

  const clearError = () => {
    setError(null);
  };

  // here we execute the query we came up with and grab new labels
  const getNextLabels = async (query: string) => {
    if (!driver) return;

    setLoading(true);

    const session = driver.session();
    const res = await session.run(query, {}, { timeout: 30000 });

    let newNodeLabels: NodeLabels = new Map();
    res.records.forEach((record) => {
      newNodeLabels.set(record.get("label"), record.get("count"));
    });

    setLabels(newNodeLabels);
    setLoading(false);
  };

  useEffect(() => {
    let queryStr = makeWalkQueryPrefix(picks);

    queryStr +=
      "(n) UNWIND labels(n) as label RETURN label, count(distinct(n)) as count;";
    setQuery(queryStr);

    getNextLabels(queryStr).catch(handleError);
    clearError();
  }, [driver, picks]);

  return { labels, loading, error, queryUsed };
};

export default useNextWalkLabels;
