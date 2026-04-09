/**
 * MathFieldEditor — rich text editor with inline rendered math.
 *
 * Prose types naturally. Toolbar buttons insert rendered KaTeX math inline.
 * Clicking a rendered math node opens a small LaTeX input popover to edit it.
 *
 * Value format in/out: plain text with $latex$ delimiters, e.g.
 *   "Find x when $\frac{x}{2} = 4$"
 */
import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mathematics from '@tiptap/extension-mathematics';
import 'katex/dist/katex.min.css';
import './MathFieldEditor.css';

// ── Serialise TipTap JSON → "text $latex$ text" ──────────────────────────────

const serializeDoc = (doc) => {
    const serializeNode = (node) => {
        switch (node.type) {
            case 'text':       return node.text || '';
            case 'hardBreak':  return '\n';
            case 'inlineMath': return `$${node.attrs?.latex || ''}$`;
            case 'blockMath':  return `$$${node.attrs?.latex || ''}$$`;
            case 'paragraph':
                return (node.content?.map(serializeNode).join('') ?? '') + '\n';
            default:
                return node.content?.map(serializeNode).join('') ?? '';
        }
    };
    if (!doc?.content) return '';
    return doc.content.map(serializeNode).join('').trimEnd();
};

// ── Parse "text $latex$ text" → TipTap JSON doc ──────────────────────────────

const parseToDoc = (str) => {
    if (!str) return { type: 'doc', content: [{ type: 'paragraph' }] };
    const lines = str.split('\n');
    const paragraphs = lines.map(line => {
        const parts = [];
        const re = /\$([^$\n]+)\$/g;
        let last = 0, m;
        while ((m = re.exec(line)) !== null) {
            if (m.index > last)
                parts.push({ type: 'text', text: line.slice(last, m.index) });
            parts.push({ type: 'inlineMath', attrs: { latex: m[1] } });
            last = re.lastIndex;
        }
        if (last < line.length)
            parts.push({ type: 'text', text: line.slice(last) });
        return { type: 'paragraph', content: parts.length ? parts : undefined };
    });
    return { type: 'doc', content: paragraphs };
};

// ── Convert bare "X/Y" to "\frac{X}{Y}" (top-level slash only) ───────────────

const autoFrac = (latex) => {
    const s = latex.trim();
    if (s.includes('\\frac') || !s.includes('/')) return s;
    let depth = 0;
    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (c === '{' || c === '(') depth++;
        else if (c === '}' || c === ')') depth--;
        else if (c === '/' && depth === 0) {
            const num = s.slice(0, i).trim();
            const den = s.slice(i + 1).trim();
            if (num && den) return `\\frac{${num}}{${den}}`;
        }
    }
    return s;
};

// ── Walk ProseMirror nodes and build a LaTeX string for a range ───────────────

const getLatexInRange = (doc, from, to) => {
    let out = '';
    doc.nodesBetween(from, to, (node, pos) => {
        if (node.isText) {
            const s = Math.max(from, pos);
            const e = Math.min(to, pos + node.nodeSize);
            out += node.text.slice(s - pos, e - pos);
        } else if (node.type.name === 'inlineMath') {
            out += node.attrs.latex;
        }
        return true;
    });
    return out.trim();
};

// ── Toolbar definitions ───────────────────────────────────────────────────────

const TOOLBAR_GROUPS = [
    {
        label: 'Structures',
        buttons: [
            { label: 'x²',   title: 'Exponent',       latex: 'x^{2}' },
            { label: 'xₙ',   title: 'Subscript',       latex: 'x_{n}' },
            { label: '√x',   title: 'Square root',     latex: '\\sqrt{x}' },
            { label: 'ⁿ√x',  title: 'Nth root',        latex: '\\sqrt[n]{x}' },
            { label: 'a/b',  title: 'Fraction',         latex: '\\frac{a}{b}' },
            { label: '|x|',  title: 'Absolute value',  latex: '\\left|x\\right|' },
            { label: '∫',    title: 'Integral',         latex: '\\int_{a}^{b}' },
            { label: '∑',    title: 'Sum',              latex: '\\sum_{i=0}^{n}' },
            { label: 'lim',  title: 'Limit',            latex: '\\lim_{x \\to 0}' },
            { label: 'vec',  title: 'Vector',           latex: '\\vec{x}' },
            { label: '(  )', title: 'Parentheses',      latex: '\\left(x\\right)' },
            { label: '[  ]', title: 'Brackets',         latex: '\\left[x\\right]' },
        ]
    },
    {
        label: 'Operators',
        buttons: [
            { label: '±',  title: 'Plus or minus',    latex: '\\pm' },
            { label: '·',  title: 'Dot multiply',      latex: '\\cdot' },
            { label: '×',  title: 'Cross multiply',    latex: '\\times' },
            { label: '÷',  title: 'Divide',            latex: '\\div' },
            { label: '≤',  title: 'Less or equal',     latex: '\\leq' },
            { label: '≥',  title: 'Greater or equal',  latex: '\\geq' },
            { label: '≠',  title: 'Not equal',         latex: '\\neq' },
            { label: '≈',  title: 'Approximately',     latex: '\\approx' },
            { label: '~',  title: 'Similar to',        latex: '\\sim' },
            { label: '∝',  title: 'Proportional to',  latex: '\\propto' },
            { label: '∞',  title: 'Infinity',          latex: '\\infty' },
            { label: '∴',  title: 'Therefore',         latex: '\\therefore' },
            { label: '∵',  title: 'Because',           latex: '\\because' },
        ]
    },
    {
        label: 'Sets',
        buttons: [
            { label: '∈',  title: 'Element of',        latex: '\\in' },
            { label: '∉',  title: 'Not element of',    latex: '\\notin' },
            { label: '⊂',  title: 'Subset',            latex: '\\subset' },
            { label: '⊆',  title: 'Subset or equal',   latex: '\\subseteq' },
            { label: '∪',  title: 'Union',             latex: '\\cup' },
            { label: '∩',  title: 'Intersection',      latex: '\\cap' },
            { label: 'ℝ',  title: 'Real numbers',      latex: '\\mathbb{R}' },
            { label: 'ℤ',  title: 'Integers',          latex: '\\mathbb{Z}' },
            { label: 'ℕ',  title: 'Natural numbers',   latex: '\\mathbb{N}' },
            { label: 'ℚ',  title: 'Rationals',         latex: '\\mathbb{Q}' },
            { label: 'ℂ',  title: 'Complex numbers',   latex: '\\mathbb{C}' },
        ]
    },
    {
        label: 'Arrows',
        buttons: [
            { label: '→',  title: 'Right arrow',        latex: '\\rightarrow' },
            { label: '←',  title: 'Left arrow',         latex: '\\leftarrow' },
            { label: '↔',  title: 'Double arrow',       latex: '\\leftrightarrow' },
            { label: '⇒',  title: 'Implies',            latex: '\\Rightarrow' },
            { label: '⇔',  title: 'If and only if',     latex: '\\Leftrightarrow' },
            { label: '→∞', title: 'Approaches infinity',latex: '\\to \\infty' },
        ]
    },
    {
        label: 'Science',
        buttons: [
            { label: '°',    title: 'Degree',                  latex: '^{\\circ}' },
            { label: '°C',   title: 'Degrees Celsius',         latex: '^{\\circ}\\text{C}' },
            { label: '°F',   title: 'Degrees Fahrenheit',      latex: '^{\\circ}\\text{F}' },
            { label: '×10ⁿ', title: 'Scientific notation',     latex: '\\times 10^{n}' },
            { label: '⇌',    title: 'Equilibrium arrows',      latex: '\\rightleftharpoons' },
            { label: '∠',    title: 'Angle',                   latex: '\\angle' },
            { label: '△',    title: 'Triangle',                latex: '\\triangle' },
            { label: '⊥',    title: 'Perpendicular',           latex: '\\perp' },
            { label: '∥',    title: 'Parallel',                latex: '\\parallel' },
            { label: '≅',    title: 'Congruent',               latex: '\\cong' },
            { label: '∂',    title: 'Partial derivative',      latex: '\\partial' },
            { label: '∇',    title: 'Nabla / gradient',        latex: '\\nabla' },
            { label: 'Å',    title: 'Angstrom',                latex: '\\text{Å}' },
            { label: '½',    title: 'Half-life / one-half',    latex: '\\frac{1}{2}' },
            { label: 'eˣ',   title: 'Exponential',             latex: 'e^{x}' },
            { label: 'ln',   title: 'Natural log',             latex: '\\ln' },
            { label: 'log',  title: 'Logarithm',               latex: '\\log' },
            { label: 'pH',   title: 'pH notation',             latex: '\\text{pH}' },
            { label: 'Δ',    title: 'Change in (Delta)',        latex: '\\Delta' },
            { label: 'λ',    title: 'Wavelength (lambda)',      latex: '\\lambda' },
            { label: 'ν',    title: 'Frequency (nu)',          latex: '\\nu' },
            { label: 'ρ',    title: 'Density (rho)',           latex: '\\rho' },
        ]
    },
    {
        label: 'Greek',
        buttons: [
            { label: 'α',  title: 'Alpha',   latex: '\\alpha' },
            { label: 'β',  title: 'Beta',    latex: '\\beta' },
            { label: 'γ',  title: 'Gamma',   latex: '\\gamma' },
            { label: 'δ',  title: 'Delta',   latex: '\\delta' },
            { label: 'ε',  title: 'Epsilon', latex: '\\epsilon' },
            { label: 'ζ',  title: 'Zeta',    latex: '\\zeta' },
            { label: 'η',  title: 'Eta',     latex: '\\eta' },
            { label: 'θ',  title: 'Theta',   latex: '\\theta' },
            { label: 'λ',  title: 'Lambda',  latex: '\\lambda' },
            { label: 'μ',  title: 'Mu',      latex: '\\mu' },
            { label: 'π',  title: 'Pi',      latex: '\\pi' },
            { label: 'ρ',  title: 'Rho',     latex: '\\rho' },
            { label: 'σ',  title: 'Sigma',   latex: '\\sigma' },
            { label: 'τ',  title: 'Tau',     latex: '\\tau' },
            { label: 'φ',  title: 'Phi',     latex: '\\phi' },
            { label: 'χ',  title: 'Chi',     latex: '\\chi' },
            { label: 'ψ',  title: 'Psi',     latex: '\\psi' },
            { label: 'ω',  title: 'Omega',   latex: '\\omega' },
            { label: 'Γ',  title: 'Gamma',   latex: '\\Gamma' },
            { label: 'Δ',  title: 'Delta',   latex: '\\Delta' },
            { label: 'Θ',  title: 'Theta',   latex: '\\Theta' },
            { label: 'Λ',  title: 'Lambda',  latex: '\\Lambda' },
            { label: 'Π',  title: 'Pi',      latex: '\\Pi' },
            { label: 'Σ',  title: 'Sigma',   latex: '\\Sigma' },
            { label: 'Φ',  title: 'Phi',     latex: '\\Phi' },
            { label: 'Ψ',  title: 'Psi',     latex: '\\Psi' },
            { label: 'Ω',  title: 'Omega',   latex: '\\Omega' },
        ]
    },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function MathFieldEditor({ value, onChange, placeholder }) {
    const [toolbarOpen, setToolbarOpen] = useState(false);

    // Math edit popover state
    const [editingMath, setEditingMath] = useState(null); // { pos, x, y }
    const [editLatex, setEditLatex] = useState('');
    const editInputRef = useRef(null);

    // Keep a stable ref to the editor for use inside callbacks
    const editorRef = useRef(null);
    const suppressUpdate = useRef(false);

    const editor = useEditor({
        extensions: [StarterKit, Mathematics],
        content: parseToDoc(value),
        editorProps: {
            attributes: { class: 'mfe-editor-inner' },
            handleKeyDown(view, event) {
                if (event.key !== ' ' && event.key !== 'Enter') return false;

                const { state } = view;
                const sel = state.selection;
                if (!sel.empty) return false;

                const { $from } = sel;
                // '\0' stands in for math nodes in the text representation
                const textBefore = state.doc.textBetween($from.start(), $from.pos, '', '\0');

                // (anything except parens)/denom  OR  number/number
                const match =
                    textBefore.match(/\(([^()]*)\)\/([^\s/]+)$/) ||
                    textBefore.match(/(\d[\d.]*)\s*\/\s*(\d[\d.]*)$/);

                if (!match) return false;

                const matchStart = $from.pos - match[0].length;
                const mathNodeType = state.schema.nodes.inlineMath;
                if (!mathNodeType) return false;

                let numLatex, denLatex;

                if (match[0].startsWith('(')) {
                    // (expr)/denom — numerator may contain math nodes
                    const numFrom = matchStart + 1;                      // after '('
                    const numTo   = matchStart + 1 + match[1].length;   // before ')'
                    const denFrom = numTo + 2;                           // after ')/'
                    numLatex = autoFrac(getLatexInRange(state.doc, numFrom, numTo));
                    denLatex = autoFrac(getLatexInRange(state.doc, denFrom, $from.pos));
                } else {
                    numLatex = match[1].trim();
                    denLatex = match[2].trim();
                }

                const latex = `\\frac{${numLatex}}{${denLatex}}`;
                view.dispatch(state.tr.replaceWith(matchStart, $from.pos, mathNodeType.create({ latex })));
                return false;
            },
        },
        onUpdate({ editor }) {
            if (suppressUpdate.current) return;
            onChange?.(serializeDoc(editor.getJSON()));
        },
    });

    useEffect(() => { editorRef.current = editor; }, [editor]);

    // Focus the popover input when it opens
    useEffect(() => {
        if (editingMath) editInputRef.current?.focus();
    }, [editingMath]);

    // Sync external value changes (form reset etc.)
    const prevValue = useRef(value);
    useEffect(() => {
        if (!editor || value === prevValue.current) return;
        prevValue.current = value;
        suppressUpdate.current = true;
        editor.commands.setContent(parseToDoc(value), false);
        suppressUpdate.current = false;
    }, [value, editor]);

    // Apply the edited LaTeX back into the document
    const commitEdit = () => {
        const ed = editorRef.current;
        if (!ed || !editingMath) return;
        const latex = autoFrac(editLatex);
        ed.chain()
            .command(({ tr }) => {
                tr.setNodeMarkup(editingMath.pos, undefined, { latex });
                return true;
            })
            .run();
        setEditingMath(null);
    };

    // Insert math — into the popover input if it's open, otherwise as a new node
    const insertMath = (latex) => {
        if (editingMath && editInputRef.current) {
            const input = editInputRef.current;
            const start = input.selectionStart ?? editLatex.length;
            const end   = input.selectionEnd   ?? editLatex.length;
            const next  = editLatex.slice(0, start) + latex + editLatex.slice(end);
            setEditLatex(next);
            // Place cursor inside the first {} of the inserted template, or after it
            const bracePos = latex.indexOf('{}');
            const cursorPos = bracePos >= 0 ? start + bracePos + 1 : start + latex.length;
            requestAnimationFrame(() => {
                input.focus();
                input.setSelectionRange(cursorPos, cursorPos);
            });
            return;
        }
        if (!editor) return;
        editor.chain().focus().insertContent({
            type: 'inlineMath',
            attrs: { latex },
        }).run();
    };

    return (
        <div className="mfe-root">
            {/* Editor */}
            <div
                className="mfe-editor-wrap"
                onClick={e => {
                    // Find the nearest math render node from the click target
                    const mathEl = e.target.closest('.tiptap-mathematics-render');
                    if (!mathEl || !editor) return;
                    const latex = mathEl.getAttribute('data-latex') ?? '';
                    // Get ProseMirror document position from the DOM element
                    let pos = null;
                    try { pos = editor.view.posAtDOM(mathEl, 0); } catch { return; }
                    if (pos == null) return;
                    setEditLatex(latex);
                    setEditingMath({ pos, x: e.clientX, y: e.clientY });
                }}
            >
                {(!value || value.trim() === '') && placeholder && (
                    <span className="mfe-placeholder" aria-hidden>{placeholder}</span>
                )}
                <EditorContent editor={editor} />
            </div>

            {/* Math edit popover */}
            {editingMath && (
                <div
                    className="mfe-math-popover"
                    style={{ top: editingMath.y + 12, left: editingMath.x }}
                    onMouseDown={e => e.preventDefault()}
                >
                    <span className="mfe-popover-label">Edit LaTeX</span>
                    <input
                        ref={editInputRef}
                        className="mfe-popover-input"
                        value={editLatex}
                        onChange={e => setEditLatex(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
                            if (e.key === 'Escape') setEditingMath(null);
                        }}
                        onBlur={commitEdit}
                        placeholder="e.g. \frac{1}{2}"
                        spellCheck={false}
                    />
                    <button className="mfe-popover-confirm" onMouseDown={e => { e.preventDefault(); commitEdit(); }}>✓</button>
                </div>
            )}

            {/* Toolbar */}
            <div className="mfe-toolbar-wrap">
                <button
                    type="button"
                    className={`mfe-toggle ${toolbarOpen ? 'open' : ''}`}
                    onMouseDown={e => { e.preventDefault(); setToolbarOpen(o => !o); }}
                >
                    <span className="mfe-toggle-icon">∑</span>
                    <span className="mfe-toggle-label">Math &amp; Science symbols</span>
                    <span className="mfe-toggle-chevron">{toolbarOpen ? '▲' : '▼'}</span>
                </button>

                {toolbarOpen && (
                    <div className="mfe-toolbar">
                        {TOOLBAR_GROUPS.map(group => (
                            <div key={group.label} className="mfe-group">
                                <span className="mfe-group-label">{group.label}</span>
                                {group.buttons.map(btn => (
                                    <button
                                        key={btn.label}
                                        type="button"
                                        className="mfe-btn"
                                        title={btn.title}
                                        onMouseDown={e => { e.preventDefault(); insertMath(btn.latex); }}
                                    >
                                        {btn.label}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
