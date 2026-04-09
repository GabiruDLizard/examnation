import React, { useRef } from "react";
import { Scatter } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Title,
} from "chart.js";

ChartJS.register(LinearScale, PointElement, Tooltip, Title);

export default function ClickToPlotChart() {
  const chartRef = useRef(null);

  const data = {
    datasets: [
      {
        label: "Plotted Points",
        data: [], // Start empty
        backgroundColor: "blue",
        pointRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "linear",
        position: "bottom",
        title: { display: true, text: "X Axis" },
        min: -10,
        max: 10,
        ticks: { stepSize: 1 },
      },
      y: {
        title: { display: true, text: "Y Axis" },
        min: -10,
        max: 10,
        ticks: { stepSize: 1 },
      },
    },
    onClick: (event) => {
      const chart = chartRef.current;
      if (!chart) return;

      const xScale = chart.scales.x;
      const yScale = chart.scales.y;

      // Convert click position to chart values
      const xValue = xScale.getValueForPixel(event.native.offsetX);
      const yValue = yScale.getValueForPixel(event.native.offsetY);

      chart.data.datasets[0].data.push({ x: xValue, y: yValue });
      chart.update();


    },
  };

  return (
    <div style={{ width: "600px", height: "400px" }}>
      <Scatter ref={chartRef} data={data} options={options} />
    </div>
  );
}

