import { Driver } from "neo4j-driver-core";
import { useEffect, useState } from "react";

export type useRelTypesReturn = {
  relTypes: Map<string, number>;
  loading: boolean;
  error: string | null;
};

export const useRelTypes = (driver: Driver | null): useRelTypesReturn => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [relTypes, setRelTypes] = useState<Map<string, number>>(new Map());

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
        `MATCH ()-[n]-() RETURN DISTINCT type(n) as type, count(*) as count`,
        {},
        { timeout: 3000 }
      );

      var newRelTypes: Map<string, number> = new Map();

      res.records.forEach((record) => {
        newRelTypes.set(record.get("type"), record.get("count"));
      });

      setRelTypes(newRelTypes);
      setLoading(false);
    };

    getNodesOverview().catch(handleError);
    clearError();
  }, [driver]);

  return { relTypes, loading, error };
};
