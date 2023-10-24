import { ServerInfo } from "neo4j-driver-core";
import { useContext, useEffect, useState } from "react";
import { Neo4JContext } from "./Neo4JContext";

const Neo4JServerInfo = (): JSX.Element => {
  const driver = useContext(Neo4JContext);
  const [info, setInfo] = useState<ServerInfo | null>(null);

  useEffect(() => {
    const getInfo = async () => {
      if (driver) {
        const data = await driver.getServerInfo();
        setInfo(data);
      }
    };

    getInfo().catch(console.error);
  }, [driver]);

  if (info) {
    return <div>{info.agent}</div>;
  } else {
    return <div>Loading</div>;
  }
};

export default Neo4JServerInfo;
