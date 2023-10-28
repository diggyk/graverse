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
import { IoTrash } from "react-icons/io5";
import QueryStringBox from "./QueryStringBox";

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
      <QueryStringBox key={desc} name={desc} queryStr={queryStr} />
    );
  });

  if (queriesUsed.size !== 0) {
    return (
      <Stack className="QueryBoxesWrapper" direction="vertical">
        Queries Used:
        {queryDivs}
      </Stack>
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

  // called when a value is selected for a property
  const addPropSelection = (prop: string, val: string) => {
    let newPropSelections = Array.from(propSelections);
    newPropSelections.push({
      name: prop,
      eq: "=",
      val: val,
    });
    setPropSelections(newPropSelections);
  };

  // called to remove a prop selection
  const removePropSelection = (idx: number) => {
    let newPropSelections = Array.from(propSelections);
    newPropSelections.splice(idx, 1);
    setPropSelections(newPropSelections);
  };

  // show our currently selected prop/val selections
  const showPickedPropVals = (): JSX.Element => {
    let elements: JSX.Element[] = [];

    propSelections.forEach((p, idx) => {
      elements.push(
        <Stack key={"prop_" + p.name} gap={2} direction="horizontal">
          <button
            className="btn btn-secondary"
            onClick={() => removePropSelection(idx)}
          >
            <IoTrash />
          </button>
          <span>
            {p.name} {p.eq} {p.val}
          </span>
        </Stack>
      );
    });

    return (
      <Stack gap={2} className="NodeStepperPropsSelectedBox">
        {elements}
      </Stack>
    );
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
              reportSelection={addPropSelection}
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

    return <Accordion>{propItems}</Accordion>;
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

  return (
    <>
      <Row direction="horizontal" className="justify-content-center">
        <Col>
          <NodeStepperRelBox
            inbound
            adjacents={inbound}
            pickCallBack={pickNextRelationship}
          />
        </Col>
        <Col>
          <Stack className="picker-box">
            <h3>Node Picker</h3>
            <div>{error}</div>
            <div>{pickerBody}</div>

            {showPickedPropVals()}
            <div>{createPropSelectors()}</div>
          </Stack>
        </Col>
        <Col>
          <NodeStepperRelBox
            adjacents={outbound}
            pickCallBack={pickNextRelationship}
          />
        </Col>
      </Row>
      {createQueriesUsedBlock(queriesUsed)}
    </>
  );
};

export default NodeStepper;
