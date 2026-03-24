import React from 'react';
import { BiChevronRight } from 'react-icons/bi';
import './Breadcrumb.css';

export default function Breadcrumb({ crumbs }) {
    if (!crumbs || crumbs.length <= 1) return null;

    return (
        <nav className="breadcrumb" aria-label="Breadcrumb">
            {crumbs.map((crumb, i) => {
                const isLast = i === crumbs.length - 1;
                return (
                    <span key={i} className="breadcrumb-item">
                        {i > 0 && <BiChevronRight className="breadcrumb-sep" aria-hidden="true" />}
                        {!isLast && crumb.onClick ? (
                            <button className="breadcrumb-link" onClick={crumb.onClick}>
                                {crumb.label}
                            </button>
                        ) : (
                            <span className={isLast ? 'breadcrumb-current' : 'breadcrumb-text'}>
                                {crumb.label}
                            </span>
                        )}
                    </span>
                );
            })}
        </nav>
    );
}
