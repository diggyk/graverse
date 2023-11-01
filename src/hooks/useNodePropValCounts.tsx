import { Driver } from "neo4j-driver-core";
import { useState, useEffect } from "react";
import { PropSelection, StepPick } from "../pages/Walk";
import makeWalkQueryPrefix from "../lib/walkQueryPrefix";

export type propValCountReturns = {
  propValCounts: Map<string, number>;
  loading: boolean;
  error: string | null;
  queryUsed: string;
};

export const useNodePropValCounts = (
  driver: Driver | null,
  labelName: string | undefined,
  propName: string,
  picks?: StepPick[],
  propSelections?: PropSelection[]
): propValCountReturns => {
  const [error, setError] = useState<string | null>(null);
  const [propValCounts, setPropValCounts] = useState<Map<string, number>>(
    new Map()
  );
  const [loading, setLoading] = useState(false);
  const [queryUsed, setQueryUsed] = useState("");

  const handleError = (error: Error) => {
    console.error(error);
    setError(error.message);
  };

  const clearError = () => {
    setError(null);
  };

  // load prop counts
  useEffect(() => {
    const loadPropValCounts = async () => {
      setPropValCounts(new Map());

      if (!driver || !labelName || labelName === "") {
        return;
      }

      setLoading(true);

      let queryStr: string;

      if (picks !== undefined && picks.length > 0) {
        queryStr = makeWalkQueryPrefix(picks);
      } else {
        queryStr = "MATCH ";
      }
      queryStr += `(n:\`${labelName}\``;

      if (propSelections !== undefined && propSelections.length !== 0) {
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

      queryStr += `) WITH distinct(n) RETURN distinct(n.${propName}) as val, count(*) as count;`;

      setQueryUsed(queryStr);

      const session = driver.session();
      const res = await session.run(queryStr, {}, { timeout: 30000 });

      var newPropValCounts: Map<string, number> = new Map();

      res.records.forEach((record) => {
        newPropValCounts.set(record.get("val"), record.get("count"));
      });

      setPropValCounts(newPropValCounts);
      setLoading(false);
    };

    loadPropValCounts().catch(handleError);
    clearError();
  }, [driver, labelName, propSelections]);

  return { propValCounts, loading, error, queryUsed };
};
