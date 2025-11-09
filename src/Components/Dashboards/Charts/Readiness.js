import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// Register chart components
ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ReadinessChart = ({ readinessScores = [] }) => {
  // If no data, show empty state
  if (!readinessScores || readinessScores.length === 0) {
    return (
      <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ marginBottom: "1rem" }}>Adaptive Test Readiness</h2>
        <p>No readiness data available yet. Complete some questions to see your progress!</p>
      </div>
    );
  }

  // Create labels and data from readinessScores
  const labels = readinessScores.map((_, index) => `Q${index + 1}`);
  
  // Convert ability estimates to readiness percentages (0-100 scale)
  // Assuming ability estimates range from -3 to +3, we'll normalize to 0-100%
  const readinessData = readinessScores.map(score => {
    // Convert ability estimate (-3 to +3) to percentage (0-100)
    const normalized = Math.max(0, Math.min(100, ((score.abilityEstimate + 3) / 6) * 100));
    return Math.round(normalized);
  });

  // Group data by date for different lines if you have multiple sessions
  const groupedByDate = readinessScores.reduce((acc, score) => {  
    if (!acc[score.date]) {
      acc[score.date] = [];
    }
    acc[score.date].push(score);
    return acc;
  }, {});

  // Create datasets - one line per date
  const datasets = Object.entries(groupedByDate).map(([date, scores], index) => {
    const colors = [
      { border: "rgba(75, 192, 192, 1)", bg: "rgba(75, 192, 192, 0.2)" },
      { border: "rgba(54, 162, 235, 1)", bg: "rgba(54, 162, 235, 0.2)" },
      { border: "rgba(255, 206, 86, 1)", bg: "rgba(255, 206, 86, 0.2)" },
      { border: "rgba(153, 102, 255, 1)", bg: "rgba(153, 102, 255, 0.2)" },
    ];
    
    const color = colors[index % colors.length];
    
    return {
      label: `${date} (${scores.length} questions)`,
      data: scores.map(score => {
        const normalized = Math.max(0, Math.min(100, ((score.abilityEstimate + 3) / 6) * 100));
        return Math.round(normalized);
      }),
      borderColor: color.border,
      backgroundColor: color.bg,
      tension: 0.4,
      fill: false,
      borderWidth: 3,
      pointRadius: 5,
      pointHoverRadius: 7,
    };
  });

  // Add ready threshold line
  datasets.push({
    label: "Ready Threshold (85%)",
    data: Array(Math.max(...Object.values(groupedByDate).map(arr => arr.length))).fill(85),
    borderColor: "rgba(0, 0, 0, 0.7)",
    borderDash: [10, 5],
    borderWidth: 2,
    pointRadius: 0,
    fill: false,
  });

  datasets.push(
    {
        label: "Not Ready Threshold (50%)",
        data: Array(Math.max(...Object.values(groupedByDate).map(arr => arr.length))).fill(50),
        borderColor: "rgba(0, 0, 0, 0.7)",
        borderDash: [10, 5],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
    }
  )

  const data = {
    labels: Array.from({ length: Math.max(...Object.values(groupedByDate).map(arr => arr.length)) }, (_, i) => `Q${i + 1}`),
    datasets,
  };

  const options = {
    responsive: true,
    interaction: {
      mode: "index",
      intersect: false,
    },
    animation: {
      duration: 1500,
      easing: "easeInOutQuart",
    },
    plugins: {
      title: {
        display: false,
        text: "Readiness Estimate Over Questions",
        font: { size: 18 },
      },
      legend: {
        display: false  // Add this line to hide the entire legend
      },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: function(context) {
            const score = readinessScores[context.dataIndex];
            if (score) {
              return [
                `${context.dataset.label}: ${context.parsed.y}%`,
                `Difficulty: ${score.difficulty}`,
                `Correct: ${score.isCorrect ? 'Yes' : 'No'}`,
                `Ability Estimate: ${score.abilityEstimate?.toFixed(3)}`
              ];
            }
            return `${context.dataset.label}: ${context.parsed.y}%`;
          }
        }
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        title: { display: true, text: "Readiness (%)" },
        ticks: { stepSize: 10 },
      },
      x: {
        title: { display: true, text: "Question Number" },
      },
    },
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>
        Adaptive Test Readiness
      </h2>
      <Line data={data} options={options} />
      <div style={{ marginTop: "1rem", fontSize: "0.9em", color: "#666" }}>
        <p><strong>Total Questions:</strong> {readinessScores.length}</p>
        <p><strong>Latest Readiness:</strong> {readinessData[readinessData.length - 1]}%</p>
        <p><strong>Sessions:</strong> {Object.keys(groupedByDate).length}</p>
      </div>
    </div>
  );
};

export default ReadinessChart;
