import { useEffect, useState } from "react";
import neo4j, { Driver } from "neo4j-driver";
import "./App.scss";

import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

import { LinkContainer } from 'react-router-bootstrap';

import { Neo4JContext } from "./components/Neo4JContext";
import { Routes, Route } from "react-router";
import Overview from "./pages/Overview";
import LabelDetail from "./pages/LabelDetail";
import { Graph } from "./pages/Graph";
import Walk from "./pages/Walk";


type Neo4JConnectionConfig = {
  uri: string,
  username: string,
  password: string
}

interface FormElements extends HTMLFormControlsCollection {
  formUri: HTMLInputElement,
  formUser: HTMLInputElement,
  formPassword: HTMLInputElement,
}
interface Neo4jConnectionFormElement extends HTMLFormElement {
  readonly elements: FormElements
}

function App() {
  const [connConfig, setConnConfig] = useState<Neo4JConnectionConfig>({ uri: "neo4j://localhost:7687", username: "neo4j", password: "password" });
  const [driver, setDriver] = useState<Driver | null>(null);
  const [showCfgModal, setShowCfgModal] = useState(false);

  const closeCfgModal = () => setShowCfgModal(false);
  const openCfgModal = () => setShowCfgModal(true);

  useEffect(() => {
    setDriver(neo4j.driver(
      connConfig.uri,
      neo4j.auth.basic(connConfig.username, connConfig.password),
      { disableLosslessIntegers: true }
    ));
  }, [connConfig])

  const saveConfig = (event: React.FormEvent<Neo4jConnectionFormElement>) => {
    event.preventDefault();
    const elements = event.currentTarget.elements;

    var newConfig: Neo4JConnectionConfig = {
      uri: elements.formUri.value,
      username: elements.formUser.value,
      password: elements.formPassword.value
    }

    setConnConfig(newConfig)
    closeCfgModal()
  }

  return (
    <>
      <Navbar expand="lg" className="bg-body-tertiary">
        <Container>
          <LinkContainer to="/">
            <Navbar.Brand >Graverse</Navbar.Brand>
          </LinkContainer>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <LinkContainer to="/overview">
                <Nav.Link>Overview</Nav.Link>
              </LinkContainer>
              {/* <LinkContainer to="/graph">
                <Nav.Link>Graph</Nav.Link>
              </LinkContainer> */}
              <LinkContainer to="/walk">
                <Nav.Link>Walk</Nav.Link>
              </LinkContainer>
            </Nav>
            <button className="btn btn-secondary" onClick={openCfgModal}>{connConfig?.uri || "Unset"}</button>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <div className="App">
        <Modal show={showCfgModal} onHide={closeCfgModal}>
          <Modal.Header closeButton>
            <Modal.Title>Configure Connection</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={saveConfig}>
              <Form.Group className="mb-3" controlId="formUri">
                <Form.Label>Neo4J URI</Form.Label>
                <Form.Control defaultValue={connConfig?.uri} type="url" placeholder="Enter URI" />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formUser">
                <Form.Label>Username</Form.Label>
                <Form.Control defaultValue={connConfig?.username} type="text" placeholder="Username" />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formPassword">
                <Form.Label>Password</Form.Label>
                <Form.Control defaultValue={connConfig?.password} type="password" placeholder="Password" />
              </Form.Group>
              {/* We can't use the React Bootstrap Button b/c of some BS with the three-fiber/drei stuff */}
              <button className="btn btn-primary" type="submit">Submit</button>
            </Form>
          </Modal.Body>
        </Modal>
        <Neo4JContext.Provider value={driver}>
          <Container style={{ marginTop: 10 }}>
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/graph" element={<Graph />} />
              <Route path="/overview" element={<Overview />} />
              <Route path="/walk" element={<Walk />} />
              <Route path="/label/:labelName" element={<LabelDetail />} />
            </Routes>
          </Container>
        </Neo4JContext.Provider>
      </div>
    </>
  );
}

export default App;
