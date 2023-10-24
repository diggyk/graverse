import { Canvas } from "@react-three/fiber";
import {
  Box,
  Html,
  MapControls,
  PerspectiveCamera,
  Plane,
  QuadraticBezierLine,
  SoftShadows,
  Text,
} from "@react-three/drei";
import Col from "react-bootstrap/esm/Col";
import Row from "react-bootstrap/esm/Row";

export const Graph = () => {
  return (
    <Row style={{ height: "50vh", minHeight: "400px" }}>
      <Col>
        <Canvas shadows className="mh-100 rounded">
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[0, 0, 5]}
            intensity={2}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-camera-far={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
            shadow-camera-right={10}
            shadow-camera-left={-10}
          >
            <SoftShadows size={10} samples={25} />
          </directionalLight>
          <PerspectiveCamera
            position={[0, 0, 15]}
            rotation={[0, 0, 0]}
            fov={50}
            makeDefault
          />
          <Box args={[1, 1, 1]} position={[0, 0, 0]} castShadow>
            <meshStandardMaterial color={"red"} />
          </Box>
          <Box args={[1, 1, 1]} position={[5, 5, 0]} castShadow>
            <meshStandardMaterial color={"red"} />
          </Box>
          <Box args={[1, 1, 1]} position={[-5, 5, 0]} castShadow>
            <meshStandardMaterial color={"red"} />
          </Box>
          <Box args={[1, 1, 1]} position={[-5, -5, 0]} castShadow>
            <meshStandardMaterial color={"red"} />
          </Box>
          <Box args={[1, 1, 1]} position={[5, -5, 0]} castShadow>
            <meshStandardMaterial color={"red"} />
          </Box>
          <QuadraticBezierLine
            start={[0, 0, 0]}
            end={[5, 5, 0]}
            lineWidth={2}
          />
          <QuadraticBezierLine
            start={[0, 0, 0]}
            end={[-5, 5, 0]}
            lineWidth={2}
          />
          <QuadraticBezierLine
            start={[0, 0, 0]}
            end={[5, -5, 0]}
            lineWidth={2}
          />
          <QuadraticBezierLine
            start={[0, 0, 0]}
            end={[-5, -5, 0]}
            lineWidth={2}
          />
          <Plane
            position={[0, 0, -1]}
            args={[10000, 10000, 1, 1]}
            receiveShadow
            castShadow
          >
            <meshStandardMaterial color={"#d9d9d9"} />
          </Plane>
          <Text position={[0, 1, 0]} castShadow color={"black"}>
            Hello
          </Text>
          <Html distanceFactor={10}>
            <button className="btn btn-primary">
              hello <br />
              world
            </button>
          </Html>
          <MapControls
            screenSpacePanning
            maxDistance={50}
            minDistance={15}
            enableDamping
            enableRotate={false}
          />
        </Canvas>
      </Col>
    </Row>
  );
};
