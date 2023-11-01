import { Driver } from "neo4j-driver-core";
import { useState, useEffect } from "react";
import { PropSelection, StepPick } from "../pages/Walk";
import makeWalkQueryPrefix from "../lib/walkQueryPrefix";

export type propCountReturns = {
  propCounts: Map<string, number>;
  loading: boolean;
  error: string | null;
  queryUsed: string;
};

// get the properties of a node and how often they appear
export const useNodePropCounts = (
  driver: Driver | null,
  labelName: string | undefined,
  picks?: StepPick[],
  propSelections?: PropSelection[]
): propCountReturns => {
  const [error, setError] = useState<string | null>(null);
  const [propCounts, setPropCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);
  const [queryUsed, setQueryUsed] = useState("");

  const handleError = (error: Error) => {
    console.error(error);
    setError(error.message);
  };

  const clearError = () => {
    setError(null);
  };

  const loadPropCounts = async () => {
    setPropCounts(new Map());
    if (!driver || !labelName || labelName === "") {
      return;
    }

    setLoading(true);

    const session = driver.session();

    let queryStr: string;

    if (picks != undefined && picks.length > 0) {
      queryStr = makeWalkQueryPrefix(picks);
    } else {
      queryStr = "MATCH ";
    }
    queryStr += `(n:\`${labelName}\``;

    if (propSelections != undefined && propSelections.length != 0) {
      queryStr += "{";
      let propParts: string[] = [];
      propSelections.forEach((p) => {
        if (isNaN(+p.val)) {
          // val isn't a number
          propParts.push(`${p.name}: '${p.val}'`);
        } else {
          propParts.push(`${p.name}: ${p.val}`);
        }
      });
      queryStr += propParts.join(", ");
      queryStr += "}";
    }

    queryStr += `) WITH distinct(n), keys(n) as keys UNWIND keys as key RETURN distinct(key) as key, count(*) as count;`;

    setQueryUsed(queryStr);

    const res = await session.run(queryStr, {}, { timeout: 30000 });

    var newPropCounts: Map<string, number> = new Map();

    res.records.forEach((record) => {
      newPropCounts.set(record.get("key"), record.get("count"));
    });

    setPropCounts(newPropCounts);
    setLoading(false);
  };

  // load prop counts
  useEffect(() => {
    loadPropCounts().catch(handleError);
    clearError();
  }, [driver, labelName, propSelections]);

  return { propCounts, loading, error, queryUsed };
};
