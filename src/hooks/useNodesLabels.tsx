import { Driver } from "neo4j-driver-core";
import { useEffect, useState } from "react";

export type NodeLabels = Map<string, number>;

export type useNodesLabelsReturn = {
  nodeLabels: Map<string, number>;
  loading: boolean;
  error: string | null;
};

export const useNodesLabels = (driver: Driver | null): useNodesLabelsReturn => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nodeLabels, setNodeLabels] = useState<Map<string, number>>(new Map());

  const handleError = (error: Error) => {
    console.error(error);
    setError(error.message);
  };

  const clearError = () => {
    setError(null);
  };

  useEffect(() => {
    const getNodesOverview = async () => {
      if (!driver) return;

      setLoading(true);

      const session = driver.session();
      const res = await session.run(
        `MATCH (n) WITH *, LABELS(n) as labels UNWIND labels as label RETURN distinct(label), count(distinct(n)) as count`,
        {},
        { timeout: 3000 }
      );

      var newNodeLabels: Map<string, number> = new Map();

      res.records.forEach((record) => {
        newNodeLabels.set(record.get("label"), record.get("count"));
      });

      setNodeLabels(newNodeLabels);
      setLoading(false);
    };

    getNodesOverview().catch(handleError);
    clearError();
  }, [driver]);

  return { nodeLabels, loading, error };
};
