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

const CLASS_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#0ea5e9"
];

const formatWeek = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const ReadinessChart = ({ readinessScores = [], classHistory = [], viewType = 'both' }) => {
  const hasPracticeData = readinessScores && readinessScores.length > 0;
  const hasClassData = classHistory && classHistory.length > 0;

  // If no data at all, show empty state
  if (!hasPracticeData && !hasClassData) {
    const emptyStateMessage = viewType === 'progress' 
      ? "Complete some practice questions to see your progress over time"
      : viewType === 'class'
      ? "Join a class to see weekly readiness comparisons"
      : "Complete some questions to see your readiness progress";
      
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
        <p style={{ margin: 0, fontSize: "14px", textAlign: "center" }}>{emptyStateMessage}</p>
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
          autoSkip: true,
          autoSkipPadding: 20,
          maxRotation: 45,
          minRotation: 0,
          font: {
            size: 11,
          },
          color: "#6b7280",
        },
      },
    },
  };

  // Build per-class weekly chart data
  let classChartSection = null;
  if (hasClassData) {
    const weeks = [...new Set(classHistory.map(r => r.weekDate))].sort();
    const classNames = [...new Set(classHistory.map(r => r.className))];

    const classDatasets = classNames.map((cn, i) => ({
      label: cn,
      data: weeks.map(w => {
        const match = classHistory.find(r => r.weekDate === w && r.className === cn);
        return match ? Math.round(match.readinessPercentage) : null;
      }),
      borderColor: CLASS_COLORS[i % CLASS_COLORS.length],
      backgroundColor: "transparent",
      tension: 0.3,
      fill: false,
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      spanGaps: true,
    }));

    classDatasets.push({
      label: "Ready (85%)",
      data: Array(weeks.length).fill(85),
      borderColor: "#10b981",
      borderDash: [8, 4],
      borderWidth: 1.5,
      pointRadius: 0,
      fill: false,
    });

    const classChartData = {
      labels: weeks.map(formatWeek),
      datasets: classDatasets,
    };

    const classChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      animation: { duration: 1000 },
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: { font: { size: 12 }, color: "#6b7280", boxWidth: 20, padding: 12 },
        },
        tooltip: {
          backgroundColor: "rgba(0,0,0,0.8)",
          titleColor: "#fff",
          bodyColor: "#fff",
          cornerRadius: 8,
          padding: 10,
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}%`,
          },
        },
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          grid: { color: "#f3f4f6" },
          border: { display: false },
          ticks: { stepSize: 20, color: "#6b7280", callback: (v) => v + "%" },
        },
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            autoSkip: true,
            autoSkipPadding: 20,
            maxRotation: 45,
            minRotation: 0,
            color: "#6b7280",
            font: { size: 11 },
          },
        },
      },
    };

    classChartSection = (
      <div style={{ marginTop: hasPracticeData ? "28px" : "0" }}>
        <div style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
          Readiness by Class (Weekly)
        </div>
        <div style={{ width: "100%", height: "200px" }}>
          <Line data={classChartData} options={classChartOptions} />
        </div>
      </div>
    );
  }

  if (!hasPracticeData && viewType === 'progress') {
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
        <h3 style={{ margin: "12px 0 4px 0", fontSize: "16px", fontWeight: "500" }}>No Practice Data</h3>
        <p style={{ margin: 0, fontSize: "14px", textAlign: "center" }}>Complete some practice questions to see your progress</p>
      </div>
    );
  }

  if (!hasClassData && viewType === 'class') {
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
        <h3 style={{ margin: "12px 0 4px 0", fontSize: "16px", fontWeight: "500" }}>No Class Data</h3>
        <p style={{ margin: 0, fontSize: "14px", textAlign: "center" }}>Join a class to see weekly readiness comparisons</p>
      </div>
    );
  }

  if (!hasPracticeData) {
    return (
      <div style={{ width: "100%", height: "100%", position: "relative" }}>
        {classChartSection}
      </div>
    );
  }

  // Calculate stats for continuous progress
  const latestReadiness = readinessData[readinessData.length - 1] || 0;
  const prevReadiness = readinessData.length >= 2 ? readinessData[readinessData.length - 2] : latestReadiness;
  const progressChange = latestReadiness - prevReadiness;
  const totalSessions = new Set(readinessScores.map(score => score.date)).size;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Conditional chart rendering based on viewType */}
      {viewType === 'progress' || viewType === 'both' ? (
        <>
          {/* Practice progress chart */}
          <div style={{ width: "100%", height: "200px" }}>
            <Line data={data} options={options} />
          </div>

          {/* Stats row */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "12px",
            padding: "0 8px",
            fontSize: "12px",
            color: "#6b7280"
          }}>
            <div><span style={{ fontWeight: "500", color: "#374151" }}>{readinessScores.length} Questions</span></div>
            <div><span style={{ fontWeight: "500", color: "#374151" }}>Latest: {latestReadiness}%</span></div>
            <div>
              <span style={{ fontWeight: "500", color: progressChange >= 0 ? "#10b981" : "#ef4444" }}>
                {progressChange >= 0 ? "+" : ""}{progressChange.toFixed(5)}% Last Change
              </span>
            </div>
            <div><span style={{ fontWeight: "500", color: "#374151" }}>{totalSessions} Session{totalSessions !== 1 ? "s" : ""}</span></div>
          </div>
        </>
      ) : null}

      {/* Per-class weekly chart */}
      {(viewType === 'class' || viewType === 'both') && classChartSection}
    </div>
  );
};

export default ReadinessChart;
