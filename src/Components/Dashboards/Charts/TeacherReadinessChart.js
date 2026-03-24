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

const TeacherReadinessChart = ({ classReadinessData = [], classColors = {} }) => {
  // If no data, show empty state
  if (!classReadinessData || classReadinessData.length === 0) {
    return (
      <div style={{ 
        width: "100%", 
        height: "260px", 
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "center", 
        alignItems: "center",
        color: "#cfd8e3",
        backgroundColor: "rgba(255,255,255,0.02)",
        borderRadius: "8px",
        border: "1px solid rgba(255,255,255,0.05)"
      }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 3v18h18" />
          <path d="M18.7 8l-5.1 4.3-3.1-3.4L7 12" />
          <path d="M7 8l-2.5 2.5L7 13" />
          <path d="M17 8l2.5 2.5L17 13" />
        </svg>
        <h3 style={{ margin: "12px 0 4px 0", fontSize: "16px", fontWeight: "500" }}>No Class Data</h3>
        <p style={{ margin: 0, fontSize: "14px", textAlign: "center" }}>Class readiness data will appear here once students complete assignments</p>
      </div>
    );
  }

  // Extract class names from the data structure
  const classNames = Object.keys(classReadinessData[0] || {}).filter(key => key !== 'week');
  
  // Create datasets for each class
  const datasets = classNames.map(className => {
    const classData = classReadinessData.map(weekData => weekData[className] || 0);
    
    return {
      label: className,
      data: classData,
      borderColor: classColors[className] || '#4ea8ff',
      backgroundColor: `${classColors[className] || '#4ea8ff'}20`,
      tension: 0.4,
      fill: false,
      borderWidth: 3,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: classColors[className] || '#4ea8ff',
      pointBorderColor: "#ffffff",
      pointBorderWidth: 2,
    };
  });

  // Add target readiness line
  const totalWeeks = classReadinessData.length;
  datasets.push({
    label: "Target (85%)",
    data: Array(totalWeeks).fill(85),
    borderColor: "#10b981",
    borderDash: [8, 4],
    borderWidth: 2,
    pointRadius: 0,
    fill: false,
  });

  const data = {
    labels: classReadinessData.map(weekData => weekData.week),
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
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15,
          font: {
            size: 12,
          },
          color: '#cfd8e3',
          filter: function(legendItem) {
            // Hide the target line from legend
            return legendItem.text !== "Target (85%)";
          }
        }
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(42, 47, 58, 0.95)",
        titleColor: "#cfd8e3",
        bodyColor: "#cfd8e3",
        borderColor: "#4a5568",
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          title: function(context) {
            return `${context[0].label}`;
          },
          label: function(context) {
            if (context.dataset.label === "Target (85%)") {
              return null; // Hide target line from tooltip
            }
            return `${context.dataset.label}: ${context.parsed.y}%`;
          },
          afterBody: function(context) {
            const weekData = classReadinessData[context[0].dataIndex];
            const activeClasses = classNames.filter(name => weekData[name] > 0);
            if (activeClasses.length > 0) {
              const avgReadiness = activeClasses.reduce((sum, name) => sum + weekData[name], 0) / activeClasses.length;
              return [``, `Average across ${activeClasses.length} classes: ${Math.round(avgReadiness)}%`];
            }
            return [];
          }
        }
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: {
          color: "rgba(255,255,255,0.03)",
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
          color: "#cfd8e3",
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
          color: "#cfd8e3",
        },
      },
    },
  };

  // Calculate aggregate stats
  const latestWeekData = classReadinessData[classReadinessData.length - 1] || {};
  const firstWeekData = classReadinessData[0] || {};
  
  const activeClasses = classNames.filter(name => latestWeekData[name] > 0);
  const currentAverage = activeClasses.length > 0 
    ? Math.round(activeClasses.reduce((sum, name) => sum + latestWeekData[name], 0) / activeClasses.length)
    : 0;

  const firstAverage = activeClasses.length > 0 
    ? Math.round(activeClasses.reduce((sum, name) => sum + (firstWeekData[name] || 0), 0) / activeClasses.length)
    : 0;

  const progressChange = currentAverage - firstAverage;
  const highestClass = activeClasses.reduce((highest, name) => 
    (latestWeekData[name] > latestWeekData[highest]) ? name : highest, activeClasses[0]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Chart container */}
      <div style={{ width: "100%", height: "220px" }}>
        <Line data={data} options={options} />
      </div>
      
      {/* Stats for multiclass progress */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginTop: "8px",
        padding: "0 8px",
        fontSize: "12px",
        color: "#9ca3af"
      }}>
        <div>
          <span style={{ fontWeight: "500", color: "#cfd8e3" }}>
            {activeClasses.length} Active Class{activeClasses.length !== 1 ? 'es' : ''}
          </span>
        </div>
        <div>
          <span style={{ fontWeight: "500", color: "#cfd8e3" }}>
            Current Avg: {currentAverage}%
          </span>
        </div>
        <div>
          <span style={{ 
            fontWeight: "500", 
            color: progressChange >= 0 ? "#10b981" : "#ef4444" 
          }}>
            {progressChange >= 0 ? '+' : ''}{progressChange}% Change
          </span>
        </div>
        {highestClass && (
          <div>
            <span style={{ fontWeight: "500", color: "#cfd8e3" }}>
              Top: {highestClass} ({latestWeekData[highestClass]}%)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherReadinessChart;