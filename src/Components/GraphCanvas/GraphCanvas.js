import React, { useRef, useEffect, useState, useCallback } from 'react';
import './GraphCanvas.css';

// ── Constants ──────────────────────────────────────────────────────────────────

const GRID_MIN   = -10;
const GRID_MAX   =  10;
const POINT_R    =  5;   // dot radius px
const HIT_R      = 10;   // click radius to select existing point

// ── Helpers ────────────────────────────────────────────────────────────────────

// Convert graph coords → canvas px
const toCanvas = (gx, gy, w, h) => ({
    x: ((gx - GRID_MIN) / (GRID_MAX - GRID_MIN)) * w,
    y: h - ((gy - GRID_MIN) / (GRID_MAX - GRID_MIN)) * h,
});

// Convert canvas px → graph coords (rounded to 0.5)
const toGraph = (cx, cy, w, h) => ({
    x: Math.round(((cx / w) * (GRID_MAX - GRID_MIN) + GRID_MIN) * 2) / 2,
    y: Math.round(((1 - cy / h) * (GRID_MAX - GRID_MIN) + GRID_MIN) * 2) / 2,
});

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// ── Drawing ────────────────────────────────────────────────────────────────────

const drawGrid = (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // Minor grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let v = GRID_MIN; v <= GRID_MAX; v++) {
        const { x } = toCanvas(v, 0, w, h);
        const { y } = toCanvas(0, v, w, h);
        ctx.beginPath(); ctx.moveTo(x, 0);    ctx.lineTo(x, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, y);    ctx.lineTo(w, y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    const ox = toCanvas(0, 0, w, h);
    ctx.beginPath(); ctx.moveTo(ox.x, 0);   ctx.lineTo(ox.x, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, ox.y);   ctx.lineTo(w, ox.y); ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let v = GRID_MIN; v <= GRID_MAX; v++) {
        if (v === 0) continue;
        const px = toCanvas(v, 0, w, h);
        ctx.fillText(v, px.x, ox.y + 4);
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let v = GRID_MIN; v <= GRID_MAX; v++) {
        if (v === 0) continue;
        const py = toCanvas(0, v, w, h);
        ctx.fillText(v, ox.x - 4, py.y);
    }
};

const drawPoints = (ctx, points, w, h, pendingPoint) => {
    points.forEach(p => {
        const { x, y } = toCanvas(p.x, p.y, w, h);
        ctx.beginPath();
        ctx.arc(x, y, POINT_R, 0, Math.PI * 2);
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
        ctx.strokeStyle = '#1d4ed8';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    });

    // Ghost point while drawing a line
    if (pendingPoint) {
        const { x, y } = toCanvas(pendingPoint.x, pendingPoint.y, w, h);
        ctx.beginPath();
        ctx.arc(x, y, POINT_R, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59,130,246,0.4)';
        ctx.fill();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
};

const drawLines = (ctx, lines, w, h) => {
    lines.forEach(l => {
        const a = toCanvas(l.x1, l.y1, w, h);
        const b = toCanvas(l.x2, l.y2, w, h);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.stroke();
    });
};

const drawPreviewLine = (ctx, from, to, w, h) => {
    const a = toCanvas(from.x, from.y, w, h);
    const b = toCanvas(to.x, to.y, w, h);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = 'rgba(239,68,68,0.45)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function GraphCanvas({ onStateChange }) {
    const canvasRef = useRef(null);
    const [tool, setTool]           = useState('point');   // 'point' | 'line' | 'erase'
    const [points, setPoints]       = useState([]);
    const [lines, setLines]         = useState([]);
    const [linePending, setLinePending] = useState(null);  // first point of in-progress line
    const [mouseGraph, setMouseGraph]   = useState(null);  // current mouse pos in graph coords

    // Redraw whenever state changes
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const { width: w, height: h } = canvas;
        drawGrid(ctx, w, h);
        drawLines(ctx, lines, w, h);
        if (linePending && mouseGraph) drawPreviewLine(ctx, linePending, mouseGraph, w, h);
        drawPoints(ctx, points, w, h, linePending);
    }, [points, lines, linePending, mouseGraph]);

    // Notify parent
    useEffect(() => {
        onStateChange?.({ points, lines });
    }, [points, lines, onStateChange]);

    const getGraphCoords = useCallback((e) => {
        const canvas = canvasRef.current;
        const rect   = canvas.getBoundingClientRect();
        const scaleX = canvas.width  / rect.width;
        const scaleY = canvas.height / rect.height;
        return toGraph(
            (e.clientX - rect.left) * scaleX,
            (e.clientY - rect.top)  * scaleY,
            canvas.width,
            canvas.height,
        );
    }, []);

    const handleMouseMove = useCallback((e) => {
        if (tool === 'line') setMouseGraph(getGraphCoords(e));
    }, [tool, getGraphCoords]);

    const handleMouseLeave = useCallback(() => {
        setMouseGraph(null);
    }, []);

    const handleClick = useCallback((e) => {
        const g = getGraphCoords(e);

        if (tool === 'point') {
            setPoints(prev => [...prev, g]);
        }

        if (tool === 'line') {
            if (!linePending) {
                setLinePending(g);
            } else {
                setLines(prev => [...prev, { x1: linePending.x, y1: linePending.y, x2: g.x, y2: g.y }]);
                setLinePending(null);
                setMouseGraph(null);
            }
        }

        if (tool === 'erase') {
            const canvas = canvasRef.current;
            const { width: w, height: h } = canvas;
            const clickPx = toCanvas(g.x, g.y, w, h);

            // Erase nearest point within hit radius
            setPoints(prev => {
                const idx = prev.findIndex(p => {
                    const px = toCanvas(p.x, p.y, w, h);
                    return Math.hypot(px.x - clickPx.x, px.y - clickPx.y) <= HIT_R;
                });
                if (idx < 0) return prev;
                const next = [...prev];
                next.splice(idx, 1);
                return next;
            });

            // Erase line if click is close enough to it
            setLines(prev => prev.filter(l => {
                const a = toCanvas(l.x1, l.y1, w, h);
                const b = toCanvas(l.x2, l.y2, w, h);
                // Distance from point to line segment
                const dx = b.x - a.x, dy = b.y - a.y;
                const lenSq = dx * dx + dy * dy;
                const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((clickPx.x - a.x) * dx + (clickPx.y - a.y) * dy) / lenSq));
                const nearX = a.x + t * dx, nearY = a.y + t * dy;
                return Math.hypot(nearX - clickPx.x, nearY - clickPx.y) > HIT_R;
            }));
        }
    }, [tool, linePending, getGraphCoords]);

    const handleClear = () => {
        setPoints([]);
        setLines([]);
        setLinePending(null);
        setMouseGraph(null);
    };

    const cancelLinePending = () => setLinePending(null);

    return (
        <div className="gc-root">
            {/* Toolbar */}
            <div className="gc-toolbar">
                <div className="gc-tool-group">
                    <button
                        className={`gc-tool-btn ${tool === 'point' ? 'active' : ''}`}
                        onClick={() => { setTool('point'); cancelLinePending(); }}
                        title="Plot a point"
                    >
                        · Point
                    </button>
                    <button
                        className={`gc-tool-btn ${tool === 'line' ? 'active' : ''}`}
                        onClick={() => { setTool('line'); cancelLinePending(); }}
                        title="Draw a line between two points"
                    >
                        / Line
                    </button>
                    <button
                        className={`gc-tool-btn ${tool === 'erase' ? 'active erase' : ''}`}
                        onClick={() => { setTool('erase'); cancelLinePending(); }}
                        title="Click a point or line to erase it"
                    >
                        ✕ Erase
                    </button>
                </div>
                <button className="gc-clear-btn" onClick={handleClear}>Clear all</button>
            </div>

            {/* Canvas */}
            <div className="gc-canvas-wrap">
                {linePending && (
                    <div className="gc-hint">Click a second point to complete the line — or switch tools to cancel</div>
                )}
                <canvas
                    ref={canvasRef}
                    width={500}
                    height={500}
                    className={`gc-canvas gc-cursor-${tool}`}
                    onClick={handleClick}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                />
            </div>
        </div>
    );
}
