import { useContext } from "react";

import Alert from "react-bootstrap/Alert";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";

import { Neo4JContext } from "../components/Neo4JContext";
import { Link } from "react-router-dom";
import { useNodesLabels } from "../hooks/useNodesLabels";
import { Driver } from "neo4j-driver-core";
import { useRelTypes } from "../hooks/useRelTypes";

function Overview() {
  const driver: Driver | null = useContext(Neo4JContext);

  const {
    nodeLabels,
    loading: loadingNodes,
    error: nodeError,
  } = useNodesLabels(driver);
  const {
    relTypes,
    loading: loadingRels,
    error: relError,
  } = useRelTypes(driver);

  const drawNodeLabelList = (): JSX.Element[] => {
    var nodeRows: JSX.Element[] = [];

    var nodeLabelList = [...nodeLabels.entries()];

    nodeLabelList.sort((a, b) => {
      return b[1] - a[1];
    });

    nodeLabelList.forEach(([label, count]) => {
      const row = (
        <tr key={label}>
          <td>
            <Link to={"/label/" + label}>{label}</Link>
          </td>
          <td>{count}</td>
        </tr>
      );
      nodeRows.push(row);
    });

    return nodeRows;
  };

  const drawRelTypeList = (): JSX.Element[] => {
    var relRows: JSX.Element[] = [];

    var relTypeList = [...relTypes.entries()];

    relTypeList.sort((a, b) => {
      return b[1] - a[1];
    });

    relTypeList.forEach(([type, count]) => {
      const row = (
        <tr key={type}>
          <td>{type}</td>
          <td>{count}</td>
        </tr>
      );
      relRows.push(row);
    });

    return relRows;
  };

  if (relError) {
    return (
      <Row>
        <Col>
          <Alert variant="danger">{relError}</Alert>
        </Col>
      </Row>
    );
  }

  if (nodeError) {
    return (
      <Row>
        <Col>
          <Alert variant="danger">{nodeError}</Alert>
        </Col>
      </Row>
    );
  }

  if (loadingNodes || loadingRels) {
    return (
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    );
  }

  return (
    <Row>
      <Col>
        <Card>
          <Card.Body>
            <Card.Title>Graph Overview</Card.Title>
            <Row>
              <Col className="justify-content-start">
                <Card>
                  <Card.Header>Node Labels</Card.Header>
                  <Card.Body>
                    <table style={{ width: "100%" }}>
                      <thead>
                        <tr>
                          <th>Label</th>
                          <th>Count</th>
                        </tr>
                      </thead>
                      <tbody>{drawNodeLabelList()}</tbody>
                    </table>
                  </Card.Body>
                </Card>
              </Col>
              <Col className="justify-content-start">
                <Card>
                  <Card.Header>Relation Types</Card.Header>
                  <Card.Body>
                    <table style={{ width: "100%" }}>
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Count</th>
                        </tr>
                      </thead>
                      <tbody>{drawRelTypeList()}</tbody>
                    </table>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}

export default Overview;
