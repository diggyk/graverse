import { Driver } from "neo4j-driver-core";
import { useEffect, useState } from "react";
import { PropSelection, StepPick } from "../pages/Walk";
import makeWalkQueryPrefix from "../lib/walkQueryPrefix";

export type AdjacentRelsRecord = {
  relType: string;
  relProps: Map<string, string>;
  startLabel: string;
  endLabel: string;
  out: boolean;
  count: number;
};

interface AdjacentRelsReturns {
  adjacents: AdjacentRelsRecord[];
  loading: boolean;
  error: string | null;
  queryUsed: string;
}

const useAdjacentRels = (
  driver: Driver | null,
  picks: StepPick[],
  label: string,
  propSelections: PropSelection[]
): AdjacentRelsReturns => {
  const [adjacents, setAdjacents] = useState<AdjacentRelsRecord[]>(new Array());
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

  useEffect(() => {
    const runQuery = async () => {
      if (!driver || label === "") return;

      setLoading(true);

      let queryStr = makeWalkQueryPrefix(picks);
      queryStr += `(n:\`${label}\``;

      if (propSelections.length != 0) {
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

      queryStr += `)-[r]-() UNWIND labels(startNode(r)) as startLabel UNWIND labels(endNode(r)) as endLabel RETURN distinct type(r) as type, properties(r) as props, startLabel, endLabel, (startNode(r) = n) as out, count(distinct(r)) as count ORDER BY type ASC;`;

      setQuery(queryStr);

      const session = driver.session();
      const res = await session.run(queryStr, {}, { timeout: 30000 });

      let newAdjacents: AdjacentRelsRecord[] = [];

      res.records.forEach((record) => {
        let props: Map<string, string>;
        try {
          props = new Map(Object.entries(record.get("props")));
        } catch (e) {
          setError(String(e));
          return;
        }
        newAdjacents.push({
          relType: record.get("type"),
          relProps: props,
          startLabel: record.get("startLabel"),
          endLabel: record.get("endLabel"),
          out: record.get("out"),
          count: record.get("count"),
        });
      });

      setAdjacents(newAdjacents);
      setLoading(false);
    };

    runQuery().catch(handleError);
    clearError();
  }, [driver, label, propSelections]);

  return { adjacents, loading, error, queryUsed };
};

export default useAdjacentRels;
