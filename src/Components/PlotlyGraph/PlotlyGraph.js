import React, { useEffect, useRef, useState } from "react";
import Plotly from "plotly.js-dist";

const InteractiveCartesianPlot = () => {
  const plotRef = useRef(null);
  const [points, setPoints] = useState([]);

  useEffect(() => {
    if (!plotRef.current) return;

    // Initialize trace
    const trace = {
      x: points.map(p => p.x),
      y: points.map(p => p.y),
      mode: "lines+markers",
      type: "scatter",
      line: { color: "red" },
      marker: { size: 10, color: "blue" }
    };

    // Layout with Cartesian axes
    const layout = {
      title: "Interactive Cartesian Plane",
      xaxis: { title: "X", range: [-10, 10], zeroline: true, showgrid: true },
      yaxis: { title: "Y", range: [-10, 10], zeroline: true, showgrid: true },
      width: 600,
      height: 600,
      dragmode: "closest", // allows dragging points
      editable: true
    };

    // Plot
    Plotly.newPlot(plotRef.current, [trace], layout, { responsive: true });

    // Handle click to add points
    const handleClick = (event) => {
      const x = event.points[0].x;
      const y = event.points[0].y;
      setPoints(prev => [...prev, { x, y }]);
    };

    plotRef.current.on("plotly_click", handleClick);

    // Handle drag: update points
    const handleRelayout = (eventData) => {
      if (eventData["xaxis.range[0]"]) return; // ignore axis changes

      const updatedPoints = points.map((p, i) => {
        const x = eventData[`x[${i}]`] ?? p.x;
        const y = eventData[`y[${i}]`] ?? p.y;
        return { x, y };
      });
      setPoints(updatedPoints);
    };

    plotRef.current.on("plotly_relayout", handleRelayout);

    return () => {
      if (plotRef.current) {
        Plotly.purge(plotRef.current);
      }
    };
  }, [points]);

  return <div ref={plotRef} style={{ width: "100%", height: "600px" }} />;
};

export default InteractiveCartesianPlot;
