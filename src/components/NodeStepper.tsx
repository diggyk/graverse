/**
 * The NodeStepper is a bit of a complex beast. It receives a set of node labels from the parent
 * and then offers up the user the ability to select a label and optionally some properties.
 * We then show the user the relationships into and out of nodes that match those criterias.
 * When the user selects a relationship/node pair, we then commit this node to the "walk"
 * and report the next selection to the parent.
 */

import { useContext, useEffect, useState } from "react";

import Accordion from "react-bootstrap/Accordion";
import Badge from "react-bootstrap/Badge";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";
import Stack from "react-bootstrap/Stack";

import { NodeLabels } from "../hooks/useNodesLabels";
import { Neo4JContext } from "./Neo4JContext";
import useAdjacentRels, { AdjacentRelsRecord } from "../hooks/useAdjacentRels";
import NodeStepperRelBox from "./NodeStepperRelBox";
import { PropSelection, RelPickOptions, StepPick } from "../pages/Walk";
import { useNodePropCounts } from "../hooks/useNodePropCounts";
import LabelPropDetail from "./LabelPropDetail";

// we pass in the valid labels for this node step on the walk
interface NodeStepperProps {
  // the list of node labels and counts that the walk determined
  labels: NodeLabels;
  // the picks made so far on the walk; we use this and the currently selected label to get relationships
  picks: StepPick[];
  pickCallback: (pick: StepPick) => void;
}

// create our block of queries used
const createQueriesUsedBlock = (
  queriesUsed: Map<string, string>
): JSX.Element => {
  let queryDivs: JSX.Element[] = [];
  queriesUsed.forEach((queryStr, desc) => {
    if (queryStr.length === 0) {
      return;
    }
    queryDivs.push(
      <div key={desc} className="rounded p-2 font-monospace QueryStringBox">
        {desc}: {queryStr}
      </div>
    );
  });

  if (queriesUsed.size !== 0) {
    return (
      <Row>
        <Col>
          <Stack direction="vertical">{queryDivs}</Stack>
        </Col>
      </Row>
    );
  } else {
    return <></>;
  }
};

const NodeStepper = (props: NodeStepperProps) => {
  const driver = useContext(Neo4JContext);
  const [label, setLabel] = useState<string>("");
  const [propSelections, setPropSelections] = useState<PropSelection[]>([]);
  const [queriesUsed, setQueriesUsed] = useState<Map<string, string>>(
    new Map()
  );

  const {
    adjacents,
    loading,
    error,
    queryUsed: adjRelsQuery,
  } = useAdjacentRels(driver, props.picks, label, propSelections);

  const {
    propCounts,
    loading: loadingPropCounts,
    error: propCountError,
    queryUsed: propCountQuery,
  } = useNodePropCounts(driver, label, props.picks, propSelections);

  // if we only have 1 option for a label, just select it
  useEffect(() => {
    if (props.labels.size == 1) {
      let keys = [...props.labels.keys()];
      setLabel(keys[0]);
    }

    // clear all the queries used
    setQueriesUsed(new Map());
  }, [props.labels]);

  // set the queries used if they changed
  useEffect(() => {
    queriesUsed.set("Adjacent relations", adjRelsQuery);
    queriesUsed.set("Prop counts", propCountQuery);
    setQueriesUsed(new Map(queriesUsed));
  }, [adjRelsQuery, propCountQuery]);

  // called by other components that want to record their query
  const reportQueryUsed = (desc: string, queryStr: string) => {
    console.log(`${desc}: ${queryStr}`);
    setQueriesUsed(new Map(queriesUsed.set(desc, queryStr)));
  };

  // we wrap the new label setter b/c we need to do some clean up as well
  const setLabelWrapper = (newLabel: string) => {
    setPropSelections([]);
    setQueriesUsed(new Map());
    setLabel(newLabel);
  };

  // called by the NodeStepper relationship boxes when a relationship is picked
  const pickNextRelationship = (
    pickedRel: RelPickOptions,
    inbound: boolean
  ) => {
    let pick: StepPick = {
      pickedRelationship: pickedRel,
      isInbound: inbound,
      nodePickerSettings: { label: label, props: propSelections },
    };
    props.pickCallback(pick);
  };

  // called when a value is selected for a label
  const pickPropValue = (prop: string, val: string) => {
    console.log(`${prop}  ${val}`);
    let newPropSelections = Array.from(propSelections);
    newPropSelections.push({
      name: prop,
      eq: "=",
      val: val,
    });
    setPropSelections(newPropSelections);
  };

  // show our currently selected prop/val selections
  const showPickedPropVals = (): JSX.Element[] => {
    let elements: JSX.Element[] = [];

    propSelections.forEach((p) => {
      elements.push(
        <div key={"prop_" + p.name}>
          {p.name} {p.eq} {p.val}
        </div>
      );
    });

    return elements;
  };

  // create the list of label options
  const labelOptions = (): JSX.Element[] => {
    let opts: JSX.Element[] = [];

    let keys = [...props.labels.keys()];
    keys.sort();

    if (keys.length > 1 && label === "") {
      opts.push(
        <option key={"--"} value={""}>
          --
        </option>
      );
    }
    keys.forEach((nodeLabel) => {
      let nodeCount = props.labels.get(nodeLabel)!;

      opts.push(
        <option key={nodeLabel} value={nodeLabel}>
          {nodeLabel} ({nodeCount})
        </option>
      );
    });

    return opts;
  };

  // create our property and values selectors
  const createPropSelectors = (): JSX.Element => {
    if (loadingPropCounts) {
      return (
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      );
    }

    let propItems: JSX.Element[] = [];
    propCounts.forEach((count, propName) => {
      propItems.push(
        <Accordion.Item key={propName} eventKey={propName}>
          <Accordion.Header>
            <Badge bg="secondary">{count}</Badge>
            <span className="p-2">{propName}</span>
          </Accordion.Header>
          <Accordion.Body>
            <LabelPropDetail
              reportQueryStr={reportQueryUsed}
              reportSelection={pickPropValue}
              propSelections={propSelections}
              picks={props.picks}
              labelName={label}
              propName={propName}
              totalVals={count}
            />
          </Accordion.Body>
        </Accordion.Item>
      );
    });

    return <Accordion flush>{propItems}</Accordion>;
  };

  // if we are loading, show the spinner instead of the label selector
  let pickerBody;
  if (loading) {
    pickerBody = (
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    );
  } else {
    pickerBody = (
      <>
        <Form.Label> Pick a label</Form.Label>
        <Form.Select
          aria-label="Default select example"
          onChange={(val) => {
            setLabelWrapper(val.currentTarget.value);
          }}
          value={label}
        >
          {labelOptions()}
        </Form.Select>
      </>
    );
  }

  // split the adjacent relationship into inbound and outbound
  let inbound: AdjacentRelsRecord[] = [];
  let outbound: AdjacentRelsRecord[] = [];
  adjacents.forEach((record) => {
    if (record.out) {
      outbound.push(record);
    } else {
      inbound.push(record);
    }
  });

  // share our queries with the user
  let queryUsedBlock = createQueriesUsedBlock(queriesUsed);

  return (
    <>
      <Row className="justify-content-center">
        <Col>
          <NodeStepperRelBox
            inbound
            adjacents={inbound}
            pickCallBack={pickNextRelationship}
          />
        </Col>
        <Col>
          <Card>
            <Card.Header>Node Picker</Card.Header>
            <Card.Body>
              {error}
              <Card.Title>{pickerBody}</Card.Title>
              <Card.Text as="div">
                {showPickedPropVals()}
                {createPropSelectors()}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col>
          <NodeStepperRelBox
            adjacents={outbound}
            pickCallBack={pickNextRelationship}
          />
        </Col>
      </Row>
      {queryUsedBlock}
    </>
  );
};

export default NodeStepper;
