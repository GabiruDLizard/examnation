import React, { useEffect, useRef, useState } from 'react';

const DesmosGraph = ({ expressions = [], options = {}, onStateChange, onInputChange }) => {
  const calculatorRef = useRef(null);
  const desmosRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [inputValue, setInputValue] = useState("");

  // Initialize calculatorRef with a div element from the start
  useEffect(() => {
    // Create the div element and assign it to the ref immediately
    if (!calculatorRef.current) {
      calculatorRef.current = document.createElement('div');
      calculatorRef.current.style.width = '100%';
      calculatorRef.current.style.height = '400px';
      calculatorRef.current.style.border = '1px solid #ccc';
      calculatorRef.current.style.borderRadius = '8px';
      calculatorRef.current.style.backgroundColor = '#fff';
    }
  }, []);

  useEffect(() => {
    let destroyed = false;

    console.log('Current ref value:', calculatorRef.current);
    
    const initializeDesmos = () => {
      if (destroyed || !calculatorRef.current || !window.Desmos) {
        console.log('Cannot initialize:', {
          destroyed,
          hasRef: !!calculatorRef.current,
          hasDesmos: !!window.Desmos
        });
        return;
      }

      try {
        console.log('Initializing Desmos...');
        desmosRef.current = window.Desmos.GraphingCalculator(calculatorRef.current, {
          keypad: true,
          expressions: true,
          settingsMenu: false,
          zoomButtons: true,
          expressionsTopbar: true,
          showGrid: true,
          showXAxis: true,
          showYAxis: true,
          xAxisNumbers: true,
          yAxisNumbers: true,
          trace: true,
          ...options
        });

        console.log('Desmos calculator created successfully!');

        expressions.forEach((expr, index) => {
          desmosRef.current.setExpression({
            id: `expr-${index}`,
            latex: expr.latex,
            color: expr.color || '#2563eb',
            ...expr
          });
        });

        if (onStateChange) {
          desmosRef.current.observeEvent('change', () => {
            const state = desmosRef.current.getState();
            onStateChange(state);
          });
        }

        setIsLoaded(true);
        setError(null);
      } catch (err) {
        console.error('Error initializing Desmos:', err);
        setError(err.message);
      }
    };

    const waitForDesmos = () => {
      if (destroyed) return;

      if (window.Desmos) {
        console.log('Desmos is available, initializing...');
        initializeDesmos();
      } else {
        console.log('Waiting for Desmos...');
        setTimeout(waitForDesmos, 100);
      }
    };

    waitForDesmos();

    return () => {
      destroyed = true;
      if (desmosRef.current) {
        console.log('Destroying Desmos calculator');
        desmosRef.current.destroy();
        desmosRef.current = null;
      }
    };
  }, []);

  const handlePlotPoints = () => {
const regex = /\((-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\)/g;
  const points = [...inputValue.matchAll(regex)].map(match => ({
    x: parseFloat(match[1]),
    y: parseFloat(match[2])
  }));

  if (points.length === 0) return;

  // Clear previous points and lines
  desmosRef.current.setExpressions([]);

  // Add points as blue dots
  points.forEach((p, i) => {
    desmosRef.current.setExpression({
      id: `point-${i}`,
      latex: `(${p.x}, ${p.y})`,
      color: '#2563eb',
      pointSize: 10
    });
  });

  // Create smooth curve using interpolation
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);

  desmosRef.current.setExpression({
    id: 'smooth-curve',
    latex: `L=\\operatorname{interpolate}([${xs.join(',')}],[${ys.join(',')}])`
  });

  desmosRef.current.setExpression({
    id: 'curve',
    latex: `y=L(x)`,
    color: '#22c55e'
  });
  };

  if (error) {
    return (
      <div style={{
        width: '100%', height: '400px', border: '1px solid #ff0000',
        borderRadius: '8px', backgroundColor: '#ffe6e6', display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: '#cc0000',
        padding: '20px', textAlign: 'center'
      }}>
        <div>
          <strong>Desmos Error:</strong><br />
          {error}<br />
          <small>Check browser console for more details.</small>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{
        width: '100%', height: '400px', border: '1px solid #ccc',
        borderRadius: '8px', backgroundColor: '#f9f9f9', display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: '#666'
      }}>
        Loading Desmos Calculator...
      </div>
    );
  }

  // Use a container that will hold our created div
  return (
    <div>
    <div
      ref={(node) => {
        if (node && calculatorRef.current) {
          // Append our calculator div to the container
          if (!node.contains(calculatorRef.current)) {
            node.appendChild(calculatorRef.current);
          }
        }
      }}
      style={{
        width: '100%',
        height: '400px'
      }}
    />
    <div style={{ marginBottom: "10px" }}>
        <input
          type="text"
          value={inputValue}
          placeholder="Enter points e.g. (4,5),(5,7),(8,5)"
          onChange={(e) => {
            setInputValue(e.target.value)
            if(onInputChange) {
              onInputChange(e.target.value);
            }
          }}
          style={{
            width: "80%",
            padding: "6px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />
        <button
          onClick={handlePlotPoints}
          style={{
            marginLeft: "8px",
            padding: "6px 10px",
            border: "none",
            borderRadius: "4px",
            background: "#2d72d9",
            color: "white",
            cursor: "pointer",
          }}
        >
          Plot Points
        </button>
      </div>
    </div>
  );
};

export default DesmosGraph;
