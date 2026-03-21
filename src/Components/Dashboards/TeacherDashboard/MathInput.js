/**
 * MathInput — teacher-friendly math entry using MathQuill (visual editor).
 *
 * mode="text"  → regular textarea for mixed text + math, with a persistent
 *                "Insert Math" panel at the bottom. Teacher types visually,
 *                clicks Insert, and $latex$ is dropped in at the cursor.
 *
 * mode="math"  → pure MathQuill field (no textarea). For fields that are
 *                always a single math expression (e.g. Correct Answer).
 *                Value is stored as the raw LaTeX string.
 */

import React, { useRef, useState, useEffect } from 'react';
import { addStyles, EditableMathField } from 'react-mathquill';
import './MathInput.css';

// Inject MathQuill CSS once
addStyles();

// ── Insert math panel (used by mode="text") ───────────────────────────────────
function MathInsertPanel({ targetRef, onInsert }) {
    const [mqLatex, setMqLatex] = useState('');

    const handleInsert = () => {
        const latex = mqLatex.trim();
        if (!latex) return;

        const el = targetRef?.current;
        if (el) {
            // Insert at cursor in the target textarea
            const start = el.selectionStart ?? el.value.length;
            const end = el.selectionEnd ?? el.value.length;
            const before = el.value.substring(0, start);
            const after = el.value.substring(end);
            const newValue = before + `$${latex}$` + after;

            // Trigger React's onChange
            const setter = Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype, 'value'
            ).set;
            setter.call(el, newValue);
            el.dispatchEvent(new Event('input', { bubbles: true }));

            requestAnimationFrame(() => {
                el.focus();
                const pos = start + latex.length + 2;
                el.setSelectionRange(pos, pos);
            });
        } else {
            onInsert?.(`$${latex}$`);
        }

        setMqLatex('');
    };

    const handleKey = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); handleInsert(); }
    };

    return (
        <div className="mi-insert-panel">
            <span className="mi-panel-label">Insert Math</span>
            <div className="mi-mq-wrap">
                <EditableMathField
                    latex={mqLatex}
                    onChange={(mf) => setMqLatex(mf.latex())}
                    config={{ spaceBehavesLikeTab: true, autoCommands: 'pi theta sqrt sum alpha beta delta sigma', autoOperatorNames: 'sin cos tan log ln' }}
                    className="mi-mq-field"
                    onKeyDown={handleKey}
                />
            </div>
            <button
                type="button"
                className="mi-insert-btn"
                onClick={handleInsert}
                disabled={!mqLatex.trim()}
                title="Insert math into the field above (or press Enter)"
            >
                Insert ↑
            </button>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MathInput({
    mode = 'text',     // 'text' | 'math'
    value = '',
    onChange,
    rows = 4,
    placeholder = '',
    required = false,
    label,             // optional label (rendered outside by parent, but kept for ref)
}) {
    const textareaRef = useRef(null);

    if (mode === 'math') {
        // Pure MathQuill field — no textarea
        return (
            <div className="mi-math-root">
                <EditableMathField
                    latex={value}
                    onChange={(mf) => onChange?.(mf.latex())}
                    config={{
                        spaceBehavesLikeTab: true,
                        autoCommands: 'pi theta sqrt sum alpha beta delta sigma',
                        autoOperatorNames: 'sin cos tan log ln',
                    }}
                    className={`mi-mq-standalone ${required && !value ? 'mi-required' : ''}`}
                />
                {!value && (
                    <div className="mi-math-hint">
                        Type naturally: <code>x^2</code>, <code>sqrt</code>, <code>1/2</code>, <code>pi</code> …
                    </div>
                )}
            </div>
        );
    }

    // mode="text" — textarea + insert panel
    return (
        <div className="mi-text-root">
            <textarea
                ref={textareaRef}
                className="mi-textarea"
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                rows={rows}
                placeholder={placeholder}
                required={required}
            />
            <MathInsertPanel targetRef={textareaRef} />
        </div>
    );
}
