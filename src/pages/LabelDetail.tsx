import { useContext } from "react";
import { useParams } from "react-router-dom";

import Accordion from "react-bootstrap/Accordion";
import Breadcrumb from "react-bootstrap/Breadcrumb";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";

import { Neo4JContext } from "../components/Neo4JContext";
import LabelPropDetail from "../components/LabelPropDetail";
import { LinkContainer } from "react-router-bootstrap";
import { useNodePropCounts } from "../hooks/useNodePropCounts";

const LabelDetail = () => {
  const driver = useContext(Neo4JContext);
  const { labelName } = useParams();
  const { propCounts, loading, error } = useNodePropCounts(driver, labelName);

  const drawPropCounts = (): JSX.Element[] => {
    var propRows: JSX.Element[] = [];

    var propCountList = [...propCounts.entries()];

    propCountList.sort((a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1];
      } else {
        return a[0].localeCompare(b[0]);
      }
    });

    propCountList.forEach(([prop, count]) => {
      const row = (
        <Accordion.Item key={prop} eventKey={prop}>
          <Accordion.Header>
            <Badge bg="primary">{count}</Badge>
            <div className="m-2">{prop}</div>
          </Accordion.Header>
          <Accordion.Body>
            <LabelPropDetail
              labelName={labelName!}
              propName={prop}
              totalVals={count}
            />
          </Accordion.Body>
        </Accordion.Item>
      );
      propRows.push(row);
    });

    return propRows;
  };

  const maybeError = (): JSX.Element => {
    if (error) {
      return (
        <Alert key={labelName + "_error"} variant="danger">
          {error}
        </Alert>
      );
    } else {
      return <></>;
    }
  };

  const maybeLoading = (): JSX.Element => {
    if (loading) {
      return (
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      );
    } else {
      return <></>;
    }
  };

  return (
    <>
      <Breadcrumb>
        <LinkContainer to="/overview">
          <Breadcrumb.Item>Overview</Breadcrumb.Item>
        </LinkContainer>
        <Breadcrumb.Item active>{labelName}</Breadcrumb.Item>
      </Breadcrumb>
      <Row>
        <Col>
          <p>
            This page shows how frequently a property is found with the given
            node label. Expand the property to see how frequently a given value
            is found for the property.
          </p>
        </Col>
      </Row>
      <Row>
        <Col>
          {maybeError()}
          {maybeLoading()}
        </Col>
      </Row>
      <Row>
        <Col>
          <Accordion>{drawPropCounts()}</Accordion>
        </Col>
      </Row>
    </>
  );
};

export default LabelDetail;
