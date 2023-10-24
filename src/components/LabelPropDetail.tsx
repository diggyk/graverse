import { useContext, useEffect } from "react";
import { Neo4JContext } from "./Neo4JContext";
import { useParams } from "react-router";

import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Spinner from "react-bootstrap/Spinner";
import { useNodePropValCounts } from "../hooks/useNodePropValCounts";
import { PropSelection, StepPick } from "../pages/Walk";

interface LabelPropDetailProps {
  labelName: string;
  propName: string;
  totalVals: number;
  picks?: StepPick[];
  propSelections?: PropSelection[];
  reportQueryStr?: (desc: string, queryStr: string) => void;
  reportSelection?: (prop: string, val: string) => void;
}

const LabelPropDetail = (props: LabelPropDetailProps) => {
  const driver = useContext(Neo4JContext);
  const { propValCounts, loading, error, queryUsed } = useNodePropValCounts(
    driver,
    props.labelName,
    props.propName,
    props.picks,
    props.propSelections
  );

  let labelName = props.labelName;
  let clickable = props.reportSelection != undefined;

  // if we are supposed to report queries, make sure we do that
  useEffect(() => {
    if (props.reportQueryStr != undefined) {
      props.reportQueryStr(
        `${props.labelName} prop ${props.propName} vals`,
        queryUsed
      );
    }
  }, [queryUsed]);

  // draw the property counts
  const drawValueCounts = (): JSX.Element[] => {
    var valRows: JSX.Element[] = [];
    var valCountList = [...propValCounts.entries()];

    valCountList.sort((a, b) => {
      return b[1] - a[1];
    });

    let index = 0;
    valCountList.forEach(([val, count]) => {
      let valElement: JSX.Element = <>{String(val)}</>;
      if (val === null) {
        valElement = <i>{"{null}"}</i>;
      } else if (String(val).trim().length === 0) {
        valElement = <i>{"{empty}"}</i>;
      }

      let className = "border rounded p-3 m-1 text-break mw-100";
      if (clickable) {
        className += " NodeStepperValBox";
      }

      const row = (
        <span
          key={labelName + "_" + props.propName + "_" + index}
          className={className}
          {...(clickable
            ? {
                onClick: () => {
                  props.reportSelection!(props.propName, val);
                },
              }
            : {})}
        >
          <Badge bg="secondary">{count}</Badge>
          <span className="p-1 m-2">{valElement}</span>
        </span>
      );
      valRows.push(row);
      index++;
    });

    return valRows;
  };

  if (error) {
    return (
      <Alert key={labelName + "_" + props.propName + "_error"} variant="danger">
        {error}
      </Alert>
    );
  }

  if (loading) {
    return (
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    );
  }

  var info;
  if (propValCounts.size === props.totalVals) {
    info = (
      <Alert variant="secondary" className="p-1 px-3 mx-1">
        All values are unique!
      </Alert>
    );
  } else {
    info = (
      <Alert variant="secondary" className="p-1 px-3 mx-1">
        {propValCounts.size} unique values
      </Alert>
    );
  }

  return (
    <>
      {info}
      <div
        style={{ maxHeight: "300px" }}
        className="d-flex justify-content-start flex-wrap overflow-scroll"
      >
        {drawValueCounts()}
      </div>
    </>
  );
};

export default LabelPropDetail;
