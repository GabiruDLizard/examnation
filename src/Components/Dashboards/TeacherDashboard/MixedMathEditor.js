/**
 * MixedMathEditor — WYSIWYG editor for mixed text + inline math.
 *
 * The teacher types plain text normally. Clicking a math toolbar button
 * inserts a MathQuill widget inline at the cursor — no raw LaTeX ever visible.
 *
 * Value format (stored/serialised): "plain text $latex$ more text"
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { EditableMathField, addStyles } from 'react-mathquill';
import './MixedMathEditor.css';

addStyles();

// ── Helpers ────────────────────────────────────────────────────────────────────

const genId = () => Math.random().toString(36).slice(2, 9);

const parseToSegments = (str) => {
    if (!str) return [{ id: genId(), type: 'text', content: '' }];
    const segs = [];
    const re = /\$([^$\n]+)\$/g;
    let last = 0, m;
    while ((m = re.exec(str)) !== null) {
        if (m.index > last)
            segs.push({ id: genId(), type: 'text', content: str.slice(last, m.index) });
        segs.push({ id: genId(), type: 'math', content: m[1] });
        last = re.lastIndex;
    }
    if (last < str.length)
        segs.push({ id: genId(), type: 'text', content: str.slice(last) });
    // Always end with a text segment so there's somewhere to type
    if (segs.length === 0 || segs[segs.length - 1].type !== 'text')
        segs.push({ id: genId(), type: 'text', content: '' });
    return segs;
};

const serializeSegments = (segs) =>
    segs.map(s => s.type === 'math' ? `$${s.content}$` : s.content).join('');

// Get caret character offset within a contenteditable element
const getCaretOffset = (el) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return (el.textContent || '').length;
    const range = sel.getRangeAt(0);
    if (!el.contains(range.startContainer)) return (el.textContent || '').length;
    const pre = range.cloneRange();
    pre.selectNodeContents(el);
    pre.setEnd(range.startContainer, range.startOffset);
    return pre.toString().length;
};

// Place cursor at a character offset within a contenteditable element
const setCaret = (el, offset) => {
    if (!el) return;
    try {
        const sel = window.getSelection();
        const range = document.createRange();
        const node = el.firstChild || el;
        const safe = Math.min(offset, node.textContent?.length ?? 0);
        range.setStart(node, safe);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
    } catch { /* ignore */ }
};

// ── Text Segment ───────────────────────────────────────────────────────────────

const TextSeg = React.forwardRef(function TextSeg(
    { seg, onInput, onKeyDown, onFocus },
    forwardedRef
) {
    const elRef = useRef(null);

    // Set content on mount only — browser owns the DOM content while typing
    useEffect(() => {
        if (elRef.current) elRef.current.textContent = seg.content;
        if (forwardedRef) forwardedRef.current = elRef.current;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <span
            ref={elRef}
            contentEditable
            suppressContentEditableWarning
            className="mme-text-seg"
            data-segid={seg.id}
            onInput={e => onInput(seg.id, e.currentTarget.textContent)}
            onKeyDown={e => onKeyDown(seg.id, e, elRef.current)}
            onFocus={() => onFocus(seg.id)}
        />
    );
});

// ── Math Segment ───────────────────────────────────────────────────────────────

function MathSeg({ seg, onChange, onKeyDown, onDelete }) {
    return (
        <span className="mme-math-seg" data-segid={seg.id}>
            <EditableMathField
                latex={seg.content}
                onChange={mf => onChange(seg.id, mf.latex())}
                onKeyDown={e => onKeyDown(seg.id, e)}
                config={{
                    spaceBehavesLikeTab: true,
                    autoCommands: 'pi theta sqrt sum int alpha beta delta sigma',
                    autoOperatorNames: 'sin cos tan log ln',
                }}
                className="mme-mq-field"
            />
            <button
                type="button"
                className="mme-math-delete"
                title="Remove math"
                onMouseDown={e => { e.preventDefault(); onDelete(seg.id); }}
            >
                ×
            </button>
        </span>
    );
}

// ── Toolbar ────────────────────────────────────────────────────────────────────

const MATH_BTNS = [
    { label: 'x²',  title: 'Exponent',       latex: '^{}' },
    { label: 'xₙ',  title: 'Subscript',       latex: '_{}'  },
    { label: '√x',  title: 'Square root',     latex: '\\sqrt{}' },
    { label: 'ⁿ√x', title: 'Nth root',        latex: '\\sqrt[n]{}' },
    { label: 'a/b', title: 'Fraction',         latex: '\\frac{}{}' },
    { label: '|x|', title: 'Absolute value',  latex: '\\left|  \\right|' },
];

const SYMBOL_BTNS = [
    { label: '±', sym: '±' }, { label: '×', sym: '×' },
    { label: '÷', sym: '÷' }, { label: '≤', sym: '≤' },
    { label: '≥', sym: '≥' }, { label: '≠', sym: '≠' },
    { label: '≈', sym: '≈' }, { label: '∞', sym: '∞' },
    { label: 'π', sym: 'π' }, { label: 'θ', sym: 'θ' },
    { label: 'α', sym: 'α' }, { label: 'β', sym: 'β' },
    { label: 'Δ', sym: 'Δ' }, { label: 'Σ', sym: 'Σ' },
];

// ── Main Component ─────────────────────────────────────────────────────────────

export default function MixedMathEditor({ value = '', onChange, placeholder = 'Type your question here…' }) {
    const [segments, setSegments] = useState(() => parseToSegments(value));

    // Ref to which text segment currently has focus (id)
    const activeIdRef = useRef(null);
    // Map of segId → DOM element for text segments
    const domRefs = useRef({});

    // Sync to parent when segments change
    const prevRef = useRef(serializeSegments(segments));
    useEffect(() => {
        const s = serializeSegments(segments);
        if (s !== prevRef.current) {
            prevRef.current = s;
            onChange?.(s);
        }
    }, [segments, onChange]);

    // ── Insert math at cursor in active text segment ───────────────────────────
    const insertMath = useCallback((latex) => {
        const activeId = activeIdRef.current;

        setSegments(prev => {
            // Find the active text segment (fall back to last text seg)
            let idx = prev.findIndex(s => s.id === activeId && s.type === 'text');
            if (idx < 0) idx = [...prev].reverse().findIndex(s => s.type === 'text');
            if (idx < 0) idx = prev.length - 1;
            // Adjust for reverse findIndex
            if (activeId === null || prev[idx]?.id !== activeId) {
                idx = prev.length - 1 - ([...prev].reverse().findIndex(s => s.type === 'text'));
            }

            const seg = prev[idx];
            if (!seg) return prev;

            const el = domRefs.current[seg.id];
            const offset = el ? getCaretOffset(el) : (seg.content || '').length;

            const before = (seg.content || '').slice(0, offset);
            const after  = (seg.content || '').slice(offset);

            const newMathId  = genId();
            const afterTextId = genId();

            // Update the DOM content of the "before" span directly so React remount gets right initial value
            if (el) el.textContent = before;

            return [
                ...prev.slice(0, idx),
                { id: seg.id,      type: 'text', content: before },
                { id: newMathId,   type: 'math', content: latex },
                { id: afterTextId, type: 'text', content: after },
                ...prev.slice(idx + 1),
            ];
        });
    }, []);

    // ── Insert symbol into active text segment ─────────────────────────────────
    const insertSymbol = useCallback((sym) => {
        const activeId = activeIdRef.current;
        const el = domRefs.current[activeId];
        if (!el) return;

        const offset = getCaretOffset(el);
        const cur = el.textContent || '';
        const next = cur.slice(0, offset) + sym + cur.slice(offset);
        el.textContent = next;

        requestAnimationFrame(() => setCaret(el, offset + sym.length));

        setSegments(prev =>
            prev.map(s => s.id === activeId ? { ...s, content: next } : s)
        );
    }, []);

    // ── Text segment handlers ──────────────────────────────────────────────────
    const handleTextInput = useCallback((id, content) => {
        setSegments(prev => prev.map(s => s.id === id ? { ...s, content } : s));
    }, []);

    const handleTextKeyDown = useCallback((id, e, el) => {
        if (e.key !== 'Backspace') return;
        const offset = el ? getCaretOffset(el) : 1;
        if (offset !== 0) return;

        // Backspace at position 0 — delete the preceding math segment if any
        setSegments(prev => {
            const idx = prev.findIndex(s => s.id === id);
            if (idx > 0 && prev[idx - 1].type === 'math') {
                e.preventDefault();
                const result = [...prev];
                // Merge: text[idx-2] (if exists) + current text[idx] → one segment
                const curContent = result[idx].content;
                if (idx >= 2 && result[idx - 2].type === 'text') {
                    const mergedContent = result[idx - 2].content + curContent;
                    const mergedId = result[idx - 2].id;
                    result.splice(idx - 2, 3, { id: mergedId, type: 'text', content: mergedContent });
                    // Remount will set textContent via useEffect; move caret
                    const prevLen = result[idx - 2 < 0 ? 0 : idx - 2]?.content?.length ?? 0;
                    requestAnimationFrame(() => {
                        const merged = domRefs.current[mergedId];
                        if (merged) setCaret(merged, prevLen);
                    });
                } else {
                    result.splice(idx - 1, 2, { id: genId(), type: 'text', content: curContent });
                }
                return result;
            }
            return prev;
        });
    }, []);

    // ── Math segment handlers ──────────────────────────────────────────────────
    const handleMathChange = useCallback((id, latex) => {
        setSegments(prev => prev.map(s => s.id === id ? { ...s, content: latex } : s));
    }, []);

    const handleMathKeyDown = useCallback((id, e) => {
        // Tab or ArrowRight at end → jump to next text segment
        if (e.key === 'Tab' || e.key === 'ArrowRight') {
            e.preventDefault();
            setSegments(prev => {
                const idx = prev.findIndex(s => s.id === id);
                const next = prev.slice(idx + 1).find(s => s.type === 'text');
                if (next) {
                    requestAnimationFrame(() => {
                        const el = domRefs.current[next.id];
                        if (el) { el.focus(); setCaret(el, 0); }
                    });
                }
                return prev;
            });
        }
    }, []);

    const handleDeleteMath = useCallback((id) => {
        setSegments(prev => {
            const idx = prev.findIndex(s => s.id === id);
            if (idx < 0) return prev;
            const result = [...prev];
            result.splice(idx, 1);
            // Merge adjacent text segments
            if (idx > 0 && idx < result.length &&
                result[idx - 1].type === 'text' && result[idx].type === 'text') {
                const merged = {
                    id: genId(),
                    type: 'text',
                    content: result[idx - 1].content + result[idx].content,
                };
                result.splice(idx - 1, 2, merged);
            }
            return result;
        });
    }, []);

    // ── Placeholder visibility ─────────────────────────────────────────────────
    const isEmpty = segments.length === 1 &&
        segments[0].type === 'text' &&
        segments[0].content === '';

    return (
        <div className="mme-root">
            {/* Editor surface */}
            <div
                className="mme-editor"
                onClick={e => {
                    if (e.target !== e.currentTarget) return;
                    const lastText = [...segments].reverse().find(s => s.type === 'text');
                    if (lastText) {
                        const el = domRefs.current[lastText.id];
                        if (el) { el.focus(); setCaret(el, (lastText.content || '').length); }
                    }
                }}
            >
                {isEmpty && (
                    <span className="mme-placeholder" aria-hidden>{placeholder}</span>
                )}
                {segments.map(seg =>
                    seg.type === 'text' ? (
                        <TextSeg
                            key={seg.id}
                            seg={seg}
                            ref={el => { domRefs.current[seg.id] = el; }}
                            onInput={handleTextInput}
                            onKeyDown={handleTextKeyDown}
                            onFocus={id => { activeIdRef.current = id; }}
                        />
                    ) : (
                        <MathSeg
                            key={seg.id}
                            seg={seg}
                            onChange={handleMathChange}
                            onKeyDown={handleMathKeyDown}
                            onDelete={handleDeleteMath}
                        />
                    )
                )}
            </div>

            {/* Toolbar */}
            <div className="mme-toolbar">
                <span className="mme-toolbar-section-label">Math</span>
                {MATH_BTNS.map(btn => (
                    <button
                        key={btn.label}
                        type="button"
                        className="mme-btn"
                        title={btn.title}
                        onMouseDown={e => { e.preventDefault(); insertMath(btn.latex); }}
                    >
                        {btn.label}
                    </button>
                ))}
                <span className="mme-toolbar-divider" />
                <span className="mme-toolbar-section-label">Symbols</span>
                {SYMBOL_BTNS.map(btn => (
                    <button
                        key={btn.label}
                        type="button"
                        className="mme-btn mme-btn-sym"
                        onMouseDown={e => { e.preventDefault(); insertSymbol(btn.sym); }}
                    >
                        {btn.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
