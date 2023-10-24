import Alert from "react-bootstrap/Alert";
import Card from "react-bootstrap/Card";
import Spinner from "react-bootstrap/Spinner";
import Stack from "react-bootstrap/Stack";

import { IoArrowBack, IoArrowForward, IoCloseCircle } from "react-icons/io5";

import { useContext, useEffect, useState } from "react";
import { Neo4JContext } from "../components/Neo4JContext";
import NodeStepper from "../components/NodeStepper";
import useNextWalkLabels from "../hooks/useNextWalkLabels";

// This is the type that determines what property matching conditions the user wants for a node or edge
export type PropSelection = {
  name: string;
  eq: string; // currently ignored -- assumed to be equality
  val: string;
};
export const propSelectionToString = (ps: PropSelection): string => {
  return `${ps.name} = ${ps.val}`;
};

// This type encapsulate what node pick options the user wants
export type NodePickOptions = {
  label: string;
  props: PropSelection[];
};

// This type encapsulates what relationship the user wants to select
export type RelPickOptions = {
  typeStr: string;
  props: PropSelection[];
};

export type StepPick = {
  // this is what was picked from the relationship boxes
  pickedRelationship: RelPickOptions;
  isInbound: boolean;

  // this is what the node picker settings where that we need to persist
  nodePickerSettings: NodePickOptions;
};

const Walk = () => {
  const driver = useContext(Neo4JContext);
  // out list of picked nodes and relationship
  const [picks, setPicks] = useState<StepPick[]>([]);
  const {
    labels: nodeLabels,
    loading: loadingLabels,
    error: labelsError,
    queryUsed,
  } = useNextWalkLabels(driver, picks);

  // initialize with the stored session
  useEffect(() => {
    let walkStr = window.localStorage.getItem("walk");
    if (walkStr) {
      try {
        let walkJson = JSON.parse(walkStr);
        setPicks(walkJson);
      } catch (e) {
        console.error("Could not load Walk from session: " + e);
      }
    }
  }, []);

  // save the walk if it changes
  useEffect(() => {
    let walkStr = JSON.stringify(picks);
    try {
      window.localStorage.setItem("walk", walkStr);
    } catch (e) {
      console.error("Could not store Walk: " + e);
    }
  }, [picks]);

  // called by the node stepper when a new step is picked
  const pickNewStep = (pick: StepPick) => {
    picks.push(pick);
    setPicks(Array.from(picks));
  };

  // called when user wants to delete a step
  const deleteStep = (deleteIndex: number) => {
    let remainingPicks = Array.from(picks);
    remainingPicks.splice(deleteIndex);
    setPicks(remainingPicks);
  };

  const buildCurrentWalk = (): JSX.Element[] => {
    let elements: JSX.Element[] = [];

    let index = 0;
    picks.forEach((pick) => {
      let thisIndex = index;

      let nodePropSelections: JSX.Element[] = [];
      pick.nodePickerSettings.props.forEach((p) => {
        nodePropSelections.push(<div>{propSelectionToString(p)}</div>);
      });

      let node = (
        <Card key={index} style={{ minWidth: "auto" }}>
          <Card.Body style={{ display: "inline-block" }} className="p-2">
            <button
              style={{ position: "absolute", right: "0px", top: "-15px" }}
              className="btn btn-link m-0 p-0"
              onClick={() => {
                deleteStep(Number(thisIndex));
              }}
            >
              <IoCloseCircle />
            </button>
            <Card.Title style={{ whiteSpace: "nowrap" }}>
              {pick.nodePickerSettings.label}
            </Card.Title>
            <Card.Text>{nodePropSelections}</Card.Text>
          </Card.Body>
        </Card>
      );
      elements.push(node);

      let classNames = ["walkRelationship"];
      pick.isInbound ? classNames.push("inbound") : classNames.push("outbound");

      let relPropSelections: JSX.Element[] = [];
      pick.pickedRelationship.props.forEach((p, idx) => {
        relPropSelections.push(<div key={idx}>{propSelectionToString(p)}</div>);
      });

      let rel = (
        <div
          key={index + "_rel"}
          className={classNames.join(" ")}
          style={{ whiteSpace: "nowrap" }}
        >
          {pick.isInbound ? <IoArrowBack className="arrow" /> : <></>}
          <div style={{ display: "inline-block" }}>
            <div>{pick.pickedRelationship.typeStr}</div>
            {relPropSelections}
          </div>
          {pick.isInbound ? <></> : <IoArrowForward className="arrow" />}
        </div>
      );
      elements.push(rel);

      index++;
    });

    return elements;
  };

  let queryUsedBlock = <></>;
  if (queryUsed !== "") {
    queryUsedBlock = (
      <Stack direction="horizontal">
        <div
          className="rounded p-2 font-monospace"
          style={{
            backgroundColor: "#1e1e1e",
            color: "#6b6b6b",
            marginTop: "10px",
            marginBottom: "20px",
            fontSize: "60%",
          }}
        >
          {queryUsed}
        </div>
      </Stack>
    );
  }

  if (labelsError) {
    return (
      <Alert variant="danger">
        <div>{labelsError}</div>
        <button className="btn btn-link" onClick={() => deleteStep(0)}>
          Clear Walk
        </button>
      </Alert>
    );
  }

  if (loadingLabels) {
    return (
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    );
  }

  return (
    <>
      <Stack
        style={{ minHeight: "300px", overflow: "scroll" }}
        gap={2}
        direction="horizontal"
        className="align-middle rounded border p-4"
      >
        {buildCurrentWalk()}
      </Stack>
      {queryUsedBlock}
      <div style={{ marginTop: "10px" }}>
        <NodeStepper
          picks={picks}
          labels={nodeLabels}
          pickCallback={pickNewStep}
        />
      </div>
    </>
  );
};

export default Walk;
