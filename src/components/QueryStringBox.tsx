import { useState } from "react";
import ToastContainer from "react-bootstrap/ToastContainer";
import Stack from "react-bootstrap/Stack";
import Toast from "react-bootstrap/Toast";
import { IoCopyOutline } from "react-icons/io5";

type QueryStringBoxProps = {
  name: string;
  queryStr: string;
};

const QueryStringBox = (props: QueryStringBoxProps) => {
  const [show, setShow] = useState(false);

  return (
    <>
      <Stack
        direction="horizontal"
        key={props.name}
        className="rounded p-2 font-monospace QueryStringBox"
        gap={2}
        onClick={() => {
          navigator.clipboard.writeText(props.queryStr);
          setShow(true);
        }}
      >
        <div>
          <IoCopyOutline />
        </div>
        <div>
          {props.name}: {props.queryStr}
        </div>
      </Stack>
    </>
  );
};

export default QueryStringBox;
