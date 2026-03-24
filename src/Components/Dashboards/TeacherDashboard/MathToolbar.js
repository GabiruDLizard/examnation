import React, { useState } from 'react';
import './MathToolbar.css';

export function insertAtCursor(textareaRef, text, innerCursorOffset = null) {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = el.value.substring(0, start);
    const after = el.value.substring(end);
    const newValue = before + text + after;

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
    ).set;
    nativeInputValueSetter.call(el, newValue);
    el.dispatchEvent(new Event('input', { bubbles: true }));

    const cursorPos = innerCursorOffset !== null
        ? start + innerCursorOffset
        : start + text.length;

    requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(cursorPos, cursorPos);
    });
}

const TOOLBAR_GROUPS = [
    {
        label: 'Math',
        buttons: [
            { label: 'x²',   title: 'Superscript / exponent', insert: '$^{}$',        cursor: 2 },
            { label: 'xₙ',   title: 'Subscript',              insert: '$_{}$',        cursor: 2 },
            { label: '√x',   title: 'Square root',            insert: '$\\sqrt{}$',   cursor: 7 },
            { label: 'ⁿ√x',  title: 'Nth root',              insert: '$\\sqrt[]{}$', cursor: 7 },
            { label: 'a/b',  title: 'Fraction',               insert: '$\\frac{}{}$', cursor: 7 },
            { label: '|x|',  title: 'Absolute value',         insert: '$|  |$',       cursor: 2 },
        ]
    },
    {
        label: 'Operators',
        buttons: [
            { label: '±', title: 'Plus or minus',    insert: '±' },
            { label: '×', title: 'Multiply',          insert: '×' },
            { label: '÷', title: 'Divide',            insert: '÷' },
            { label: '≤', title: 'Less or equal',     insert: '≤' },
            { label: '≥', title: 'Greater or equal',  insert: '≥' },
            { label: '≠', title: 'Not equal',         insert: '≠' },
            { label: '≈', title: 'Approximately',     insert: '≈' },
            { label: '∞', title: 'Infinity',          insert: '∞' },
        ]
    },
    {
        label: 'Greek',
        buttons: [
            { label: 'π', title: 'Pi',    insert: 'π' },
            { label: 'θ', title: 'Theta', insert: 'θ' },
            { label: 'α', title: 'Alpha', insert: 'α' },
            { label: 'β', title: 'Beta',  insert: 'β' },
            { label: 'Δ', title: 'Delta', insert: 'Δ' },
            { label: 'Σ', title: 'Sigma', insert: 'Σ' },
        ]
    }
];

export default function MathToolbar({ textareaRef }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="math-toolbar-wrap">
            <div className="math-toolbar-toggle-row">
                <button
                    type="button"
                    className={`math-toolbar-toggle ${open ? 'open' : ''}`}
                    onMouseDown={(e) => { e.preventDefault(); setOpen(o => !o); }}
                    title={open ? 'Hide math symbols' : 'Insert math symbols'}
                >
                    <span className="math-toolbar-toggle-icon">∑</span>
                    <span className="math-toolbar-toggle-label">
                        {open ? 'Hide symbols' : 'Math symbols'}
                    </span>
                    <span className="math-toolbar-toggle-chevron">{open ? '▲' : '▼'}</span>
                </button>
            </div>

            {open && (
                <div className="math-toolbar">
                    {TOOLBAR_GROUPS.map(group => (
                        <div key={group.label} className="math-toolbar-group">
                            <span className="math-toolbar-group-label">{group.label}</span>
                            {group.buttons.map(btn => (
                                <button
                                    key={btn.label}
                                    type="button"
                                    className="math-toolbar-btn"
                                    title={btn.title}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        insertAtCursor(textareaRef, btn.insert, btn.cursor ?? null);
                                    }}
                                >
                                    {btn.label}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
