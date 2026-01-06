import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";
import { IoReturnUpBack } from "react-icons/io5";
import './TAPageStudent.css';

export default function MathInsights() {
    const navigate = useNavigate();
  const radarData = [
    { subject: "Algebra", readiness: 85 },
    { subject: "Geometry", readiness: 78 },
    { subject: "Trigonometry", readiness: 65 },
    { subject: "Hard", readiness: 70 },
    { subject: "NumberTheory", readiness: 90 },
    { subject: "Statistics", readiness: 80 },
  ];

  const difficultyData = [
    { level: "Easy", accuracy: 95 },
    { level: "Medium", accuracy: 78 },
    { level: "Hard", accuracy: 62 },
  ];

  const progressData = [
    { week: "Week 1", progress: 85 },
    { week: "Week 2", progress: 78 },
    { week: "Week 3", progress: 83 },
    { week: "Week 4", progress: 88 },
  ];

  const completionData = [
    { name: "Completed", value: 75 },
    { name: "Remaining", value: 25 },
  ];

  const COLORS = ["#14b8a6", "#e5e7eb"];

  return (
    <div className="min-h-screen bg-gray-50 p-10">
        <div className = 'topPage '>
            <div className='BackButton' onClick={() => navigate('/studentdashboard')} style={{ cursor: 'pointer', display: 'inline-block' }}>
                    <IoReturnUpBack size={32} />
            </div>
            <h1 className="text-3xl font-bold text-center mb-10">Math Insights</h1>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Radar Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-4">Readiness</h2>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar
                name="Readiness"
                dataKey="readiness"
                stroke="#14b8a6"
                fill="#14b8a6"
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="breakdownTwo">
            <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-4">Accuracy by Difficulty</h2>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={difficultyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="level" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="accuracy" radius={[10, 10, 0, 0]}>
                    <Cell fill="#86efac" />
                    <Cell fill="#fde68a" />
                    <Cell fill="#fca5a5" />
                </Bar>
                </BarChart>
            </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-4">Progress Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="progress" stroke="#14b8a6" strokeWidth={3} />
                </LineChart>
            </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-4">Completion</h2>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                <Pie
                    data={completionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                >
                    {completionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                </Pie>
                <Legend />
                <Tooltip />
                </PieChart>
            </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
}
