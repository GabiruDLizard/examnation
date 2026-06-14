import React from 'react';
import './VideoModal.css';

export default function VideoModal({ videoUrl, onClose }) {
    if(videoUrl === "") return null;
    return (
        <div className="video-modal-overlay" onClick={onClose}>
            <div className="video-modal-content" onClick={e => e.stopPropagation()}>
                <button className="close-button" onClick={onClose}>X</button>
                <video src={videoUrl} controls autoPlay width="100%" />
            </div>
        </div>
    );
}