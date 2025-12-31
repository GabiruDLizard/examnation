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
      <div style={{ 
        width: "100%", 
        height: "260px", 
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "center", 
        alignItems: "center",
        color: "#6b7280",
        backgroundColor: "#f9fafb",
        borderRadius: "8px"
      }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 3v18h18" />
          <path d="M18.7 8l-5.1 4.3-3.1-3.4L7 12" />
        </svg>
        <h3 style={{ margin: "12px 0 4px 0", fontSize: "16px", fontWeight: "500" }}>No Data Available</h3>
        <p style={{ margin: 0, fontSize: "14px", textAlign: "center" }}>Complete some questions to see your readiness progress</p>
      </div>
    );
  }

  // Create cumulative readiness calculation considering all questions up to each point
  const readinessData = [];
  let runningTotal = 0;
  
  for (let i = 0; i < readinessScores.length; i++) {
    // Get all scores up to this point
    const scoresUpToNow = readinessScores.slice(0, i + 1);
    
    // Calculate average ability estimate considering all questions so far
    const totalAbility = scoresUpToNow.reduce((sum, score) => sum + score.abilityEstimate, 0);
    const averageAbility = totalAbility / scoresUpToNow.length;
    
    // Normalize to percentage (same formula but using cumulative average)
    const normalized = Math.max(0, Math.min(100, ((averageAbility + 3) / 6) * 100));
    readinessData.push(Math.round(normalized));
  }

  // Create single dataset for continuous progress
  const datasets = [{
    label: "Readiness Progress",
    data: readinessData,
    borderColor: "#3b82f6",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    tension: 0.4,
    fill: true,
    borderWidth: 3,
    pointRadius: 4,
    pointHoverRadius: 6,
    pointBackgroundColor: "#3b82f6",
    pointBorderColor: "#ffffff",
    pointBorderWidth: 2,
  }];

  // Add threshold lines
  const totalQuestions = readinessData.length;
  
  datasets.push({
    label: "Ready (85%)",
    data: Array(totalQuestions).fill(85),
    borderColor: "#10b981",
    borderDash: [8, 4],
    borderWidth: 2,
    pointRadius: 0,
    fill: false,
  });

  datasets.push({
    label: "Developing (50%)",
    data: Array(totalQuestions).fill(50),
    borderColor: "#f59e0b",
    borderDash: [8, 4],
    borderWidth: 2,
    pointRadius: 0,
    fill: false,
  });

  const data = {
    labels: Array.from({ length: totalQuestions }, (_, i) => `Q${i + 1}`),
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    animation: {
      duration: 1200,
      easing: "easeInOutQuart",
    },
    plugins: {
      title: {
        display: false,
      },
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: function(context) {
            const dataIndex = context.dataIndex;
            const score = readinessScores[dataIndex];
            
            if (score && context.datasetIndex === 0) { // Only for main readiness line
              return [
                `Readiness: ${context.parsed.y}%`,
                `Difficulty: ${score.difficulty}`,
                `Result: ${score.isCorrect ? 'Correct ✓' : 'Incorrect ✗'}`,
                `Date: ${new Date(score.date).toLocaleDateString()}`,
                `Ability: ${score.abilityEstimate?.toFixed(3)}`
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
        grid: {
          color: "#f3f4f6",
          lineWidth: 1,
        },
        border: {
          display: false,
        },
        ticks: {
          stepSize: 20,
          font: {
            size: 12,
          },
          color: "#6b7280",
          callback: function(value) {
            return value + '%';
          }
        },
      },
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 10,
          font: {
            size: 12,
          },
          color: "#6b7280",
        },
      },
    },
  };

  // Calculate stats for continuous progress
  const latestReadiness = readinessData[readinessData.length - 1] || 0;
  const firstReadiness = readinessData[0] || 0;
  const progressChange = latestReadiness - firstReadiness;
  const totalSessions = new Set(readinessScores.map(score => score.date)).size;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Chart container */}
      <div style={{ width: "100%", height: "200px" }}>
        <Line data={data} options={options} />
      </div>
      
      {/* Updated stats for continuous progress */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginTop: "12px",
        padding: "0 8px",
        fontSize: "12px",
        color: "#6b7280"
      }}>
        <div>
          <span style={{ fontWeight: "500", color: "#374151" }}>
            {readinessScores.length} Questions
          </span>
        </div>
        <div>
          <span style={{ fontWeight: "500", color: "#374151" }}>
            Latest: {latestReadiness}%
          </span>
        </div>
        <div>
          <span style={{ 
            fontWeight: "500", 
            color: progressChange >= 0 ? "#10b981" : "#ef4444" 
          }}>
            {progressChange >= 0 ? '+' : ''}{progressChange.toFixed(1)}% Progress
          </span>
        </div>
        <div>
          <span style={{ fontWeight: "500", color: "#374151" }}>
            {totalSessions} Session{totalSessions !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReadinessChart;
