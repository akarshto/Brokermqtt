import React, { useState, useEffect } from 'react';
import mqtt from 'mqtt';
import './style.css';

function BrokerInterface() {
  const [connectedBrokerVisible, setConnectedBrokerVisible] = useState(false);
  const [brokerUrl, setBrokerUrl] = useState('');
  const [topic, setTopic] = useState('');
  const [jsonInput, setJsonInput] = useState(''); // Controlled input state
  const [transformations, setTransformations] = useState({
    roll: 0,
    pitch: 0,
    yaw: 0,
    translateX: 0,
    translateY: 0,
    translateZ: 0,
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
  });

  const [showTabs, setShowTabs] = useState(false); // State to control tabs visibility
  const [selectedTab, setSelectedTab] = useState(''); // Tracks selected tab
  const [randomMessage, setRandomMessage] = useState(''); // Store random message
  const [mqttClient, setMqttClient] = useState(null); // MQTT Client
  const [isLoopActive, setIsLoopActive] = useState(false); // Loop control state

  useEffect(() => {
    if (mqttClient) {
      mqttClient.on('connect', () => {
        console.log('Connected to MQTT broker');
        if (topic) {
          mqttClient.subscribe(topic, (err) => {
            if (err) {
              console.error(`Failed to subscribe to ${topic}`);
            } else {
              console.log(`Subscribed to topic: ${topic}`);
            }
          });
        }
      });

      mqttClient.on('message', (topic, message) => {
        try {
          const parsedData = JSON.parse(message.toString());
          console.log('Received message:', parsedData);
          setTransformations({
            roll: parsedData.rotation?.roll || 0,
            pitch: parsedData.rotation?.pitch || 0,
            yaw: parsedData.rotation?.yaw || 0,
            translateX: parsedData.translation?.x || 0,
            translateY: parsedData.translation?.y || 0,
            translateZ: parsedData.translation?.z || 0,
            scaleX: parsedData.scale?.x || 1,
            scaleY: parsedData.scale?.y || 1,
            scaleZ: parsedData.scale?.z || 1,
          });
          ApplyTransformations();
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      });
    }

    // Cleanup MQTT connection on unmount
    return () => {
      if (mqttClient) {
        mqttClient.end();
      }
    };
  }, [mqttClient, topic]);

  const handleInputChange = (event) => {
    const { id, value } = event.target;
    setTransformations((prev) => ({
      ...prev,
      [id]: parseFloat(value) || 0,
    }));
  };

  const ApplyTransformations = () => {
    setConnectedBrokerVisible(true);
    if (!isLoopActive) {
      setIsLoopActive(true);
      startTransformationLoop(); // Start the loop if not already active
    }
  };

  const startTransformationLoop = () => {
    const intervalId = setInterval(() => {
      setTransformations((prev) => ({
        roll: prev.roll + 1,
        pitch: prev.pitch + 1,
        yaw: prev.yaw + 1,
        translateX: prev.translateX + 1,
        translateY: prev.translateY + 1,
        translateZ: prev.translateZ + 1,
        scaleX: Math.sin(prev.roll / 100) + 1,
        scaleY: Math.cos(prev.pitch / 100) + 1,
        scaleZ: Math.sin(prev.yaw / 100) + 1,
      }));
    }, 1000); // Update every second
    // Store the interval ID for cleanup
    setIsLoopActive(intervalId);
  };

  const jsonSubmit = async () => {
    const response = await fetch('http://localhost:5000/message');
    const responseObjText = await response.text();
    let jsonInputData = responseObjText;

    if (responseObjText === 'no messages') {
      jsonInputData = jsonInput;
    }

    try {
      const parsedData = JSON.parse(jsonInputData);

      setTransformations({
        roll: parsedData.rotation?.roll || 0,
        pitch: parsedData.rotation?.pitch || 0,
        yaw: parsedData.rotation?.yaw || 0,
        translateX: parsedData.translation?.x || 0,
        translateY: parsedData.translation?.y || 0,
        translateZ: parsedData.translation?.z || 0,
        scaleX: parsedData.scale?.x || 1,
        scaleY: parsedData.scale?.y || 1,
        scaleZ: parsedData.scale?.z || 1,
      });

      ApplyTransformations();
    } catch (e) {
      console.error('Invalid JSON input', e);
      alert('Invalid JSON input. Please check the format.');
    }
  };

  const resetTransformations = () => {
    setTransformations({
      roll: 0,
      pitch: 0,
      yaw: 0,
      translateX: 0,
      translateY: 0,
      translateZ: 0,
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1,
    });

    ApplyTransformations();
  };

  const fetchRandomMessage = async () => {
    const response = await fetch('http://localhost:5000/random-message');
    const data = await response.json();
    setRandomMessage(data.message); // Set the random message
  };

  const handleHotspotClick = () => {
    // Fetch the random message from the backend (if needed)
    fetchRandomMessage();
  };

  // Function to close tabs
  const closeTabs = () => {
    setShowTabs(false);
  };

  const connectToBroker = () => {
    const client = mqtt.connect(brokerUrl);
    setMqttClient(client);
  };

  return (
    <div>
      <h2>Broker Interface</h2>
      <div id="brokerTable">
        <div id="wrapper">
          <h2>New Broker</h2>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <label htmlFor="brokerUrl">Broker URL:</label>
            <input
              type="text"
              id="brokerUrl"
              placeholder="Enter broker URL"
              style={{ width: '50%', marginBottom: '8px' }}
              value={brokerUrl}
              onChange={(e) => setBrokerUrl(e.target.value)}
            />
            <label htmlFor="topic">Topic:</label>
            <input
              type="text"
              id="topic"
              placeholder="Enter topic"
              style={{ width: '50%', marginBottom: '16px' }}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <button onClick={connectToBroker}>Connect to Broker</button>
          </div>

          <table>
            <tbody>
              <tr>
                <th>Rotation</th>
                <td>
                  <label htmlFor="roll">Roll:</label>
                  <input
                    type="number"
                    id="roll"
                    value={transformations.roll}
                    onChange={handleInputChange}
                  />
                  <br />
                  <label htmlFor="pitch">Pitch:</label>
                  <input
                    type="number"
                    id="pitch"
                    value={transformations.pitch}
                    onChange={handleInputChange}
                  />
                  <br />
                  <label htmlFor="yaw">Yaw:</label>
                  <input
                    type="number"
                    id="yaw"
                    value={transformations.yaw}
                    onChange={handleInputChange}
                  />
                </td>
              </tr>
              <tr>
                <th>Translation</th>
                <td>
                  <label htmlFor="translateX">Translate X:</label>
                  <input
                    type="number"
                    id="translateX"
                    value={transformations.translateX}
                    onChange={handleInputChange}
                  />
                  <br />
                  <label htmlFor="translateY">Translate Y:</label>
                  <input
                    type="number"
                    id="translateY"
                    value={transformations.translateY}
                    onChange={handleInputChange}
                  />
                  <br />
                  <label htmlFor="translateZ">Translate Z:</label>
                  <input
                    type="number"
                    id="translateZ"
                    value={transformations.translateZ}
                    onChange={handleInputChange}
                  />
                </td>
              </tr>
              <tr>
                <th>Scale</th>
                <td>
                  <label htmlFor="scaleX">Scale X:</label>
                  <input
                    type="number"
                    id="scaleX"
                    value={transformations.scaleX}
                    onChange={handleInputChange}
                  />
                  <br />
                  <label htmlFor="scaleY">Scale Y:</label>
                  <input
                    type="number"
                    id="scaleY"
                    value={transformations.scaleY}
                    onChange={handleInputChange}
                  />
                  <br />
                  <label htmlFor="scaleZ">Scale Z:</label>
                  <input
                    type="number"
                    id="scaleZ"
                    value={transformations.scaleZ}
                    onChange={handleInputChange}
                  />
                </td>
              </tr>
            </tbody>
          </table>

          <button id="applyTransformationBtn" onClick={ApplyTransformations}>
            Apply Transformations
          </button>
          <button onClick={resetTransformations}>Reset Transformations</button>
        </div>
      </div>

      {connectedBrokerVisible && (
        <div id="connected-broker">
          <h2 id="title">DISPLAY</h2>
          <div id="cubewrapper">
            <div
              id="cube"
              className="cube"
              onMouseEnter={() => setShowTabs(true)} // Show tabs on hover
              style={{
                transform: `
                  rotateX(${transformations.pitch}deg)
                  rotateY(${transformations.yaw}deg)
                  rotateZ(${transformations.roll}deg)
                  translate3d(${transformations.translateX}px, ${transformations.translateY}px, ${transformations.translateZ}px)
                  scale3d(${transformations.scaleX}, ${transformations.scaleY}, ${transformations.scaleZ})`,
                transition: 'transform 0.5s ease',
                position: 'relative',
                marginBottom: '20px', // Add margin to create space for tabs below
              }}
            >
              {/* Cube faces */}
            </div>
          </div>

          {showTabs && (
            <div
              id="tabs"
              style={{
                position: 'absolute',
                top:'20px',
                right:'20px',
                backgroundColor: 'white',
                padding: '10px',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
                zIndex: 10,
                width: '30%', // Ensure the tabs take full width
              }}
            >
              <button onClick={() => setSelectedTab('transform')}>Add Remote Transformation</button>
              <button onClick={() => setSelectedTab('hotspot')}>Add Hotspot</button>
              {selectedTab === 'transform' && (
  <div>
    <h3>Remote Transformations</h3>
    <table>
      <tbody>
        <tr>
          <th>Rotation</th>
          <td>
            <label htmlFor="roll">Roll:</label>
            <input
              type="number"
              id="roll"
              value={transformations.roll}
              onChange={handleInputChange}
            />
            <br />
            <label htmlFor="pitch">Pitch:</label>
            <input
              type="number"
              id="pitch"
              value={transformations.pitch}
              onChange={handleInputChange}
            />
            <br />
            <label htmlFor="yaw">Yaw:</label>
            <input
              type="number"
              id="yaw"
              value={transformations.yaw}
              onChange={handleInputChange}
            />
          </td>
        </tr>
        <tr>
          <th>Translation</th>
          <td>
            <label htmlFor="translateX">Translate X:</label>
            <input
              type="number"
              id="translateX"
              value={transformations.translateX}
              onChange={handleInputChange}
            />
            <br />
            <label htmlFor="translateY">Translate Y:</label>
            <input
              type="number"
              id="translateY"
              value={transformations.translateY}
              onChange={handleInputChange}
            />
            <br />
            <label htmlFor="translateZ">Translate Z:</label>
            <input
              type="number"
              id="translateZ"
              value={transformations.translateZ}
              onChange={handleInputChange}
            />
          </td>
        </tr>
        <tr>
          <th>Scale</th>
          <td>
            <label htmlFor="scaleX">Scale X:</label>
            <input
              type="number"
              id="scaleX"
              value={transformations.scaleX}
              onChange={handleInputChange}
            />
            <br />
            <label htmlFor="scaleY">Scale Y:</label>
            <input
              type="number"
              id="scaleY"
              value={transformations.scaleY}
              onChange={handleInputChange}
            />
            <br />
            <label htmlFor="scaleZ">Scale Z:</label>
            <input
              type="number"
              id="scaleZ"
              value={transformations.scaleZ}
              onChange={handleInputChange}
            />
          </td>
        </tr>
      </tbody>
    </table>
    <button id="applyRemoteTransformations" onClick={ApplyTransformations}>
      Apply Remote Transformations
    </button>
  </div>
)}

              {selectedTab === 'hotspot' && (
                <div>
                  <h3>Hotspot</h3>
                  <p>Click the pin to view info about the cube.</p>
                  <div
                    className="hotspot-pin"
                    onClick={handleHotspotClick}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -150%)',
                      width: '10px',
                      height: '7px',
                      backgroundColor: 'red',
                      borderRadius: '50%',
                      cursor: 'pointer',
                    }}
                  ></div>
                  {randomMessage && <div className="hotspot-info">{randomMessage}</div>}
                </div>
              )}
              {/* Close button */}
              <button onClick={closeTabs} style={{ marginTop: '10px', display: 'block' }}>
                Close Tabs
              </button>
            </div>
          )}
        </div>
      )}

      <div id="jsonWrapper">
        <h2 style={{ textAlign: 'center' }}>JSON INPUT</h2>
        <textarea
          id="jsonInput"
          rows="10"
          cols="25"
          placeholder="Enter JSON data here..."
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
        ></textarea>
        <br />
        <button id="jsonSubmit" onClick={jsonSubmit}>Submit</button>
      </div>
    </div>
  );
}

export default BrokerInterface;
