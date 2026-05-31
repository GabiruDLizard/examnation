import React, { useState, useEffect, useRef } from 'react';
import './TeacherReports.css';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, BarChart, Bar, ResponsiveContainer
} from 'recharts';
import { BiDownload, BiFileBlank, BiTable, BiRefresh } from 'react-icons/bi';
import {
    getTeacherClasses,
    getTeacherReadinessChartData,
    getClassTopicAbility,
    getAllEnrolledStudentInfo
} from './TeacherDashboardService';
import { getUserIdFromToken } from '../../../utils/tokenUtils';
import { authFetch } from '../../../utils/api';
import { DEMO_MODE, DEMO_REPORT_CHART, DEMO_REPORT_STUDENTS, DEMO_REPORT_TOPICS, DEMO_REPORT_KPIS, DEMO_TEACHER_CLASSES } from '../../../demo/dummyData';

// ── helpers ───────────────────────────────────────────────────────

function thetaToPct(theta) {
    if (theta == null) return null;
    return (theta >= -4 && theta <= 4)
        ? Math.round(((theta + 4) / 8) * 100)
        : Math.round(Math.max(0, Math.min(100, theta)));
}

function readinessLabel(pct) {
    if (pct == null) return '—';
    if (pct >= 85) return 'Ready';
    if (pct >= 70) return 'Nearly Ready';
    if (pct >= 50) return 'Developing';
    if (pct >= 30) return 'Needs Practice';
    return 'At Risk';
}

function readinessColor(pct) {
    if (pct == null) return '#94a3b8';
    if (pct >= 70) return '#16a34a';
    if (pct >= 50) return '#d97706';
    return '#dc2626';
}

const CLASS_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

// ── main component ────────────────────────────────────────────────

export default function TeacherReports({ overrideTeacherId } = {}) {
    const teacherId = overrideTeacherId ?? getUserIdFromToken();

    const [classes, setClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('all');
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(null); // 'pdf' | 'excel' | null

    // Report data
    const [chartData, setChartData] = useState([]);
    const [studentRows, setStudentRows] = useState([]);
    const [topicRows, setTopicRows] = useState([]);
    const [kpis, setKpis] = useState({ avgReadiness: 0, atRisk: 0, totalStudents: 0, avgImprovement: 0 });

    const reportRef = useRef(null);

    // ── fetch ─────────────────────────────────────────────────────

    useEffect(() => {
        if (DEMO_MODE) {
            setClasses(DEMO_TEACHER_CLASSES.map(c => ({ id: c.id, classId: c.id, name: c.name })));
            setChartData(DEMO_REPORT_CHART);
            setStudentRows(DEMO_REPORT_STUDENTS);
            setTopicRows(DEMO_REPORT_TOPICS);
            setKpis(DEMO_REPORT_KPIS);
            setLoading(false);
            return;
        }
        async function load() {
            setLoading(true);
            try {
                const res = await authFetch(`/class/teacher/${teacherId}`);
                const cls = res.ok ? await res.json() : [];
                setClasses(cls || []);
            } catch { setClasses([]); }
            setLoading(false);
        }
        load();
    }, [teacherId]);

    useEffect(() => {
        if (DEMO_MODE || !classes.length) return;
        fetchReportData();
    }, [classes, selectedClassId, teacherId]);

    async function fetchReportData() {
        setLoading(true);
        try {
            const filteredClasses = selectedClassId === 'all'
                ? classes
                : classes.filter(c => String(c.id || c.classId) === String(selectedClassId));

            // ── readiness chart ────────────────────────────────
            let chart = [];
            if (selectedClassId === 'all') {
                chart = await getTeacherReadinessChartData(teacherId, 30).catch(() => []);
            } else {
                // Filter teacher chart data to just this class
                const raw = await getTeacherReadinessChartData(teacherId, 30).catch(() => []);
                const cls = filteredClasses[0];
                const key = cls?.name;
                chart = raw.map(row => ({ week: row.week, [key]: row[key] })).filter(r => r[key] != null);
            }
            setChartData(chart);

            // ── students ───────────────────────────────────────
            const allStudents = [];
            for (const cls of filteredClasses) {
                const cid = cls.id || cls.classId;
                try {
                    // Fetch readiness history for the class in one call
                    const rdRes = await authFetch(`/Readiness/class/${cid}/history?weeksBack=52`);
                    const rdHistory = rdRes.ok ? await rdRes.json() : [];

                    // Latest readiness per student
                    const latestReadiness = {};
                    rdHistory.forEach(r => {
                        const sid = r.studentId;
                        if (!latestReadiness[sid] || r.weekDate > latestReadiness[sid].weekDate) {
                            latestReadiness[sid] = r;
                        }
                    });

                    const enrolled = await getAllEnrolledStudentInfo(cid);
                    enrolled.forEach(([info, progress]) => {
                        const rd = latestReadiness[info.id];
                        // Use class history readiness first, fall back to what getAllEnrolledStudentInfo computed
                        const readiness = rd != null
                            ? Math.round(rd.readinessPercentage)
                            : (progress?.readinessLevel > 0 ? Math.round(progress.readinessLevel) : null);

                        const avgScore = progress?.averageScore != null
                            ? Math.round(progress.averageScore)
                            : null;

                        allStudents.push({
                            id: info.id,
                            classId: cid,
                            name: `${info.firstName || ''} ${info.lastName || ''}`.trim() || info.username,
                            className: cls.name,
                            readiness,
                            avgScore,
                            improvement: progress?.improvement ?? 0,
                        });
                    });
                } catch { /* skip */ }
            }
            const deduped = allStudents.sort((a, b) => (b.readiness ?? -1) - (a.readiness ?? -1));
            setStudentRows(deduped);

            // ── topics (scoped to class assignments) ──────────
            const allTopicRows = [];
            for (const cls of filteredClasses) {
                const cid = cls.id || cls.classId;
                try {
                    // Get topics that actually exist in this class's assignments
                    const assignmentsRes = await authFetch(`/assignment/class/${cid}`);
                    const classAssignments = assignmentsRes.ok ? await assignmentsRes.json() : [];

                    const classTopics = new Set();
                    await Promise.all(classAssignments.map(async a => {
                        try {
                            const qRes = await authFetch(`/assignmentquestion/assignment/${a.id}`);
                            if (!qRes.ok) return;
                            const qs = await qRes.json();
                            await Promise.all(qs.map(async aq => {
                                try {
                                    const qDetail = await authFetch(`/question/${aq.questionId}`);
                                    if (qDetail.ok) {
                                        const q = await qDetail.json();
                                        if (q.subject) classTopics.add(q.subject);
                                    }
                                } catch { /* skip */ }
                            }));
                        } catch { /* skip */ }
                    }));

                    // Fetch topic ability and filter to only class-relevant topics
                    const rows = await getClassTopicAbility(cid);
                    const filteredRows = classTopics.size > 0
                        ? rows.filter(r => classTopics.has(r.topic))
                        : rows; // fall back to all if no questions found

                    const topicMap = {};
                    filteredRows.forEach(r => {
                        const pct = thetaToPct(r.theta);
                        if (!topicMap[r.topic]) topicMap[r.topic] = { sum: 0, count: 0, struggling: 0 };
                        topicMap[r.topic].sum += pct ?? 0;
                        topicMap[r.topic].count += 1;
                        if ((pct ?? 0) < 50) topicMap[r.topic].struggling += 1;
                    });
                    Object.entries(topicMap).forEach(([topic, d]) => {
                        allTopicRows.push({
                            className: cls.name,
                            topic,
                            avgReadiness: Math.round(d.sum / d.count),
                            studentsStruggling: d.struggling,
                            totalStudents: d.count,
                        });
                    });
                } catch { /* skip */ }
            }
            const topics = allTopicRows.sort((a, b) => a.avgReadiness - b.avgReadiness);
            setTopicRows(topics);

            // ── kpis ───────────────────────────────────────────
            const withReadiness = deduped.filter(s => s.readiness !== null);
            const uniqueStudents = [...new Map(deduped.map(s => [s.id, s])).values()];
            setKpis({
                avgReadiness: withReadiness.length
                    ? Math.round(withReadiness.reduce((a, s) => a + s.readiness, 0) / withReadiness.length)
                    : 0,
                atRisk: withReadiness.filter(s => s.readiness < 50).length,
                totalStudents: uniqueStudents.length,
                avgImprovement: deduped.length
                    ? Math.round(deduped.reduce((a, s) => a + (s.improvement || 0), 0) / deduped.length)
                    : 0,
            });

        } catch {
        } finally {
            setLoading(false);
        }
    }

    // ── export Excel ──────────────────────────────────────────────

    async function exportExcel() {
        setExporting('excel');
        try {
            const XLSX = await import('xlsx');
            const wb = XLSX.utils.book_new();

            // Sheet 1: Summary KPIs
            const summaryData = [
                ['Metric', 'Value'],
                ['Average Readiness', `${kpis.avgReadiness}%`],
                ['Total Students', kpis.totalStudents],
                ['At-Risk Students (<50%)', kpis.atRisk],
                ['Avg. Improvement', `${kpis.avgImprovement > 0 ? '+' : ''}${kpis.avgImprovement}%`],
                ['Report Generated', new Date().toLocaleString()],
                ['Scope', selectedClassId === 'all' ? 'All Classes' : classes.find(c => String(c.id || c.classId) === String(selectedClassId))?.name || ''],
            ];
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Summary');

            // Sheet 2: Students
            const studentHeaders = ['Name', 'Class', 'Readiness %', 'Status', 'Avg Score %', 'Improvement %'];
            const studentData = [
                studentHeaders,
                ...studentRows.map(s => [
                    s.name, s.className,
                    s.readiness ?? '—',
                    readinessLabel(s.readiness),
                    s.avgScore,
                    s.improvement >= 0 ? `+${s.improvement}` : `${s.improvement}`,
                ])
            ];
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(studentData), 'Students');

            // Sheet 3: Topic Mastery
            const topicHeaders = ['Class', 'Topic', 'Avg Readiness %', 'Students Struggling', 'Total Students', '% Struggling'];
            const topicData = [
                topicHeaders,
                ...topicRows.map(t => [
                    t.className, t.topic, t.avgReadiness, t.studentsStruggling, t.totalStudents,
                    t.totalStudents > 0 ? Math.round((t.studentsStruggling / t.totalStudents) * 100) : 0
                ])
            ];
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(topicData), 'Topic Mastery');

            // Sheet 4: Readiness Over Time
            if (chartData.length > 0) {
                const keys = Object.keys(chartData[0]).filter(k => k !== 'week');
                const header = ['Week', ...keys];
                const rows = chartData.map(row => [row.week, ...keys.map(k => row[k] ?? '')]);
                XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([header, ...rows]), 'Readiness Over Time');
            }

            const fileName = `ExamNation_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);
        } catch {
        } finally {
            setExporting(null);
        }
    }

    // ── export PDF ────────────────────────────────────────────────

    async function exportPDF() {
        setExporting('pdf');
        try {
            const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
                import('html2canvas'),
                import('jspdf'),
            ]);

            const el = reportRef.current;
            if (!el) return;

            const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');

            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const margin = 10;
            const contentW = pageW - margin * 2;
            const imgH = (canvas.height * contentW) / canvas.width;

            // Paginate if taller than one page
            let yPos = 0;
            while (yPos < imgH) {
                if (yPos > 0) pdf.addPage();
                pdf.addImage(imgData, 'PNG', margin, margin - yPos, contentW, imgH);
                yPos += pageH - margin * 2;
            }

            const fileName = `ExamNation_Report_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);
        } catch {
        } finally {
            setExporting(null);
        }
    }

    // ── chart series keys ─────────────────────────────────────────

    const chartKeys = chartData.length > 0
        ? Object.keys(chartData[0]).filter(k => k !== 'week')
        : [];

    const scopeLabel = selectedClassId === 'all'
        ? 'All Classes'
        : classes.find(c => String(c.id || c.classId) === String(selectedClassId))?.name || '';

    // ── render ────────────────────────────────────────────────────

    return (
        <div className="tr-root">
            {/* Toolbar */}
            <div className="tr-toolbar">
                <div className="tr-toolbar-left">
                    <h2>Reports</h2>
                    <select
                        className="tr-class-select"
                        value={selectedClassId}
                        onChange={e => setSelectedClassId(e.target.value)}
                    >
                        <option value="all">All Classes</option>
                        {classes.map(c => (
                            <option key={c.id || c.classId} value={c.id || c.classId}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                    <button className="tr-refresh-btn" onClick={fetchReportData} disabled={loading} title="Refresh">
                        <BiRefresh size={16} className={loading ? 'tr-spin' : ''} />
                    </button>
                </div>
                <div className="tr-toolbar-right">
                    <button
                        className="tr-export-btn excel"
                        onClick={exportExcel}
                        disabled={exporting !== null || loading}
                    >
                        <BiTable size={16} />
                        {exporting === 'excel' ? 'Exporting…' : 'Export Excel'}
                    </button>
                    <button
                        className="tr-export-btn pdf"
                        onClick={exportPDF}
                        disabled={exporting !== null || loading}
                    >
                        <BiFileBlank size={16} />
                        {exporting === 'pdf' ? 'Exporting…' : 'Export PDF'}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="tr-loading">
                    <div className="spinner" />
                    <p>Loading report data…</p>
                </div>
            ) : (
                <div className="tr-report" ref={reportRef}>
                    {/* Report header (shows in PDF) */}
                    <div className="tr-report-header">
                        <div>
                            <h1>ExamNation — Class Report</h1>
                            <p className="tr-meta">{scopeLabel} &nbsp;·&nbsp; Generated {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </div>

                    {/* KPIs */}
                    <div className="tr-kpis">
                        <div className="tr-kpi">
                            <span className="tr-kpi-value">{kpis.avgReadiness}%</span>
                            <span className="tr-kpi-label">Avg. Readiness</span>
                        </div>
                        <div className="tr-kpi">
                            <span className="tr-kpi-value">{kpis.totalStudents}</span>
                            <span className="tr-kpi-label">Total Students</span>
                        </div>
                        <div className="tr-kpi" style={{ color: kpis.atRisk > 0 ? '#dc2626' : '#16a34a' }}>
                            <span className="tr-kpi-value">{kpis.atRisk}</span>
                            <span className="tr-kpi-label">At Risk (&lt;50%)</span>
                        </div>
                        <div className="tr-kpi" style={{ color: kpis.avgImprovement >= 0 ? '#16a34a' : '#dc2626' }}>
                            <span className="tr-kpi-value">{kpis.avgImprovement >= 0 ? '+' : ''}{kpis.avgImprovement}%</span>
                            <span className="tr-kpi-label">Avg. Improvement</span>
                        </div>
                    </div>

                    {/* Readiness over time */}
                    {chartData.length > 0 && (
                        <div className="tr-section">
                            <h3 className="tr-section-title">Readiness Over Time</h3>
                            <div className="tr-chart-wrap">
                                <ResponsiveContainer width="100%" height={240}>
                                    <LineChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                                        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                                        <Tooltip formatter={(v) => `${Math.round(v)}%`} />
                                        <Legend />
                                        {chartKeys.map((key, i) => (
                                            <Line
                                                key={key}
                                                type="monotone"
                                                dataKey={key}
                                                stroke={CLASS_COLORS[i % CLASS_COLORS.length]}
                                                strokeWidth={2}
                                                dot={false}
                                            />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Topic mastery bar chart + table */}
                    {topicRows.length > 0 && (
                        <div className="tr-section">
                            <h3 className="tr-section-title">Topic Mastery Breakdown</h3>
                            <div className="tr-chart-wrap">
                                <ResponsiveContainer width="100%" height={Math.max(180, topicRows.length * 36)}>
                                    <BarChart
                                        layout="vertical"
                                        data={topicRows.map(t => ({ ...t, label: selectedClassId === 'all' ? `${t.topic} (${t.className})` : t.topic }))}
                                        margin={{ top: 4, right: 32, left: 8, bottom: 4 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                                        <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={200} />
                                        <Tooltip formatter={(v) => `${v}%`} />
                                        <Bar dataKey="avgReadiness" name="Avg Readiness" radius={[0, 4, 4, 0]}>
                                            {topicRows.map((entry, i) => (
                                                <rect key={i} fill={readinessColor(entry.avgReadiness)} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <table className="tr-table">
                                <thead>
                                    <tr>
                                        {selectedClassId === 'all' && <th>Class</th>}
                                        <th>Topic</th>
                                        <th>Avg Readiness</th>
                                        <th>Struggling</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topicRows.map((t, i) => (
                                        <tr key={i}>
                                            {selectedClassId === 'all' && <td className="tr-muted">{t.className}</td>}
                                            <td>{t.topic}</td>
                                            <td>
                                                <span style={{ color: readinessColor(t.avgReadiness), fontWeight: 600 }}>
                                                    {t.avgReadiness}%
                                                </span>
                                            </td>
                                            <td style={{ color: t.studentsStruggling > 0 ? '#dc2626' : '#16a34a' }}>
                                                {t.studentsStruggling}
                                            </td>
                                            <td>{t.totalStudents}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Student table */}
                    {studentRows.length > 0 && (
                        <div className="tr-section">
                            <h3 className="tr-section-title">Student Performance</h3>
                            <table className="tr-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Class</th>
                                        <th>Readiness</th>
                                        <th>Status</th>
                                        <th>Avg Score</th>
                                        <th>Improvement</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentRows.map((s, i) => (
                                        <tr key={i}>
                                            <td>{s.name}</td>
                                            <td className="tr-muted">{s.className}</td>
                                            <td>
                                                <div className="tr-bar-wrap">
                                                    <div
                                                        className="tr-bar-fill"
                                                        style={{
                                                            width: `${s.readiness ?? 0}%`,
                                                            background: readinessColor(s.readiness)
                                                        }}
                                                    />
                                                </div>
                                                <span style={{ color: readinessColor(s.readiness), fontWeight: 600, fontSize: 13 }}>
                                                    {s.readiness != null ? `${s.readiness}%` : '—'}
                                                </span>
                                            </td>
                                            <td>
                                                <span
                                                    className="tr-status-pill"
                                                    style={{ color: readinessColor(s.readiness), background: `${readinessColor(s.readiness)}18` }}
                                                >
                                                    {readinessLabel(s.readiness)}
                                                </span>
                                            </td>
                                            <td>{s.avgScore != null ? `${s.avgScore}%` : '—'}</td>
                                            <td style={{ color: s.improvement >= 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                                                {s.improvement >= 0 ? '+' : ''}{s.improvement}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {studentRows.length === 0 && topicRows.length === 0 && !loading && (
                        <div className="tr-empty">
                            <BiDownload size={48} />
                            <h3>No data available yet</h3>
                            <p>Students need to complete assignments or practice sessions for report data to appear.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
