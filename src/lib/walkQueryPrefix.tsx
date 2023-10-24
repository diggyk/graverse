import { StepPick } from "../pages/Walk";

const makeWalkQueryPrefix = (picks: StepPick[]): string => {
  let queryStr = "MATCH ";
  picks.forEach((pick) => {
    queryStr += `(:\`${pick.nodePickerSettings.label}\``;
    if (pick.nodePickerSettings.props.length !== 0) {
      queryStr += "{";
      let propParts: string[] = [];
      pick.nodePickerSettings.props.forEach((p) => {
        if (isNaN(+p.val)) {
          // val isn't a number
          propParts.push(`${p.name}: '${p.val}'`);
        } else {
          propParts.push(`${p.name}: ${p.val}`);
        }
      });
      queryStr += propParts.join(", ");
      queryStr += "}";
    }
    queryStr += ")";

    // do we need an inbound arrow?
    if (pick.isInbound) {
      queryStr += "<";
    }

    queryStr += `-[:${pick.pickedRelationship.typeStr}`;
    if (pick.pickedRelationship.props.length !== 0) {
      queryStr += "{";
      let propParts: string[] = [];
      pick.pickedRelationship.props.forEach((p) => {
        if (isNaN(+p.val)) {
          // val isn't a number
          propParts.push(`${p.name}: '${p.val}'`);
        } else {
          propParts.push(`${p.name}: ${p.val}`);
        }
      });
      queryStr += propParts.join(", ");
      queryStr += "}";
    }

    queryStr += "]-";

    // do we need an outbound arrow?
    if (!pick.isInbound) {
      queryStr += ">";
    }
  });

  return queryStr;
};

export default makeWalkQueryPrefix;
