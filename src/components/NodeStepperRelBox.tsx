/**
 * The NodeStepper Relationship Box is part of the NodeStepper. This box
 * will display the list of relationships and the node labels reached via that
 * relationship type.  The user can select any of these node labels
 * from within a relationship group and that selection gets reported
 * back up to the Walk as the users new node
 */

import Badge from "react-bootstrap/Badge";
import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import Stack from "react-bootstrap/Stack";

import { AdjacentRelsRecord } from "../hooks/useAdjacentRels";
import {
  PropSelection,
  RelPickOptions,
  propSelectionToString,
} from "../pages/Walk";
import { IoAtCircle } from "react-icons/io5";

type NodeStepperRelBoxProps = {
  inbound?: boolean;
  adjacents: AdjacentRelsRecord[];
  pickCallBack: (pickedRel: RelPickOptions, inbound: boolean) => void;
};

export type GroupedRelsByType = Map<string, Map<string, [string, number][]>>;

// A relationship type might connect to multiple node labels
// but we got a record for each combo of type and label.
// Group them up so we can display them properly
const groupByType = (
  adjacents: AdjacentRelsRecord[],
  inbound: boolean
): GroupedRelsByType => {
  let adjMap: GroupedRelsByType = new Map();

  adjacents.forEach((record) => {
    if (!adjMap.has(record.relType)) {
      adjMap.set(record.relType, new Map());
    }

    let innerMap = adjMap.get(record.relType)!;

    // now we need to make a list of propselections for the inner map
    let ps: PropSelection[] = [];
    let propKeys = [...record.relProps.keys()];
    propKeys.sort();
    propKeys.forEach((propKey) => {
      ps.push({
        name: propKey,
        eq: "=",
        val: record.relProps.get(propKey)!,
      });
    });

    const psStr = JSON.stringify(ps);

    if (!innerMap.has(psStr)) {
      innerMap.set(psStr, []);
    }

    let current = innerMap.get(psStr)!;
    let label = inbound ? record.startLabel : record.endLabel;
    current.push([label, record.count]);
  });

  return adjMap;
};

const NodeStepperRelBox = (props: NodeStepperRelBoxProps) => {
  let adjacents = props.adjacents;
  let inbound = props.inbound || false;

  const labelSelected = (
    relType: string,
    relProps: PropSelection[],
    inbound: boolean
  ) => {
    let relSelection: RelPickOptions = {
      typeStr: relType,
      props: relProps,
    };

    props.pickCallBack(relSelection, inbound);
  };

  let body: JSX.Element;
  if (adjacents.length == 0) {
    body = (
      <Card.Body>
        <Card.Text>No relationships</Card.Text>
      </Card.Body>
    );
  } else {
    let adjMap = groupByType(adjacents, inbound);
    let rels: JSX.Element[] = [];

    // for each set of relationship type and property set, make our display for the labels and counts
    let index = 0;
    adjMap.forEach((propMapToCount, relType) => {
      // make the list of node labels
      let index2 = 0;
      propMapToCount.forEach((labelCounts, props) => {
        let labelsList: JSX.Element[] = [];
        labelCounts.forEach(([label, count], idx) => {
          labelsList.push(
            <ListGroup.Item key={index + "_" + index2 + "_" + idx}>
              <Badge bg="secondary">{count}</Badge>
              <span className="p-2">{label}</span>
            </ListGroup.Item>
          );
        });

        // make the list of properties for this block
        let propsParsed: PropSelection[] = JSON.parse(props);
        let propList: JSX.Element[] = [];
        propsParsed.forEach((p, idx) => {
          propList.push(
            <ListGroup.Item key={index + "_" + index2 + "_" + idx + "_prop"}>
              <IoAtCircle />
              {propSelectionToString(p)}
            </ListGroup.Item>
          );
        });

        rels.push(
          <Card
            className="NodeStepperRelBox"
            key={index + "_" + index2 + "_" + relType + "_" + String(inbound)}
            onClick={() => labelSelected(relType, propsParsed, inbound)}
          >
            <Card.Header>{relType}</Card.Header>
            <ListGroup variant="flush">
              {propList}
              {labelsList}
            </ListGroup>
          </Card>
        );

        index2++;
      });

      index++;
    });

    body = (
      <Card.Body>
        <Stack gap={3}>{rels}</Stack>
      </Card.Body>
    );
  }

  let arrowClasses = adjacents.length == 0 ? "arrow empty" : "arrow";

  return (
    <Stack
      className={inbound ? "inbound-box" : "outbound-box"}
      style={{ minWidth: "100px", minHeight: "100px" }}
    >
      <div className={arrowClasses} />
      <h4>{inbound ? "Incoming Relationships" : "Outgoing Relationships"}</h4>
      {body}
    </Stack>
  );
};

export default NodeStepperRelBox;
