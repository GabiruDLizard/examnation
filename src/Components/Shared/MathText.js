import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Renders a string that may contain inline $latex$ and $$latex$$ math.
 * Uses KaTeX for synchronous, reliable rendering.
 */
const MathText = ({ children }) => {
    if (!children) return null;
    // Split on $$...$$ first (display), then $...$  (inline) — only if content contains LaTeX chars
    const parts = children.split(/(\$\$[^$]+\$\$|\$[^$\n]*[\\^_{}\[\]][^$\n]*\$)/g);
    return (
        <span>
            {parts.map((part, i) => {
                const display = part.match(/^\$\$([^$]+)\$\$$/);
                const inline  = part.match(/^\$([^$\n]*[\\^_{}\[\]][^$\n]*)\$$/);
                const latex   = display?.[1] || inline?.[1];
                if (latex) {
                    try {
                        return (
                            <span
                                key={i}
                                dangerouslySetInnerHTML={{
                                    __html: katex.renderToString(latex, {
                                        throwOnError: false,
                                        displayMode: !!display,
                                    }),
                                }}
                            />
                        );
                    } catch {
                        return <span key={i}>{part}</span>;
                    }
                }
                return <span key={i}>
                    {part.split('\n').map((line, j, arr) => (
                        <React.Fragment key={j}>
                            {line}
                            {j < arr.length - 1 && <br />}
                        </React.Fragment>
                    ))}
                </span>;
            })}
        </span>
    );
};

export default MathText;
