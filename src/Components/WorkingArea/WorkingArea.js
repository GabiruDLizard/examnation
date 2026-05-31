import React, { useState, useRef, useEffect } from 'react'

export default function WorkingArea({setting, QuestionList, }) {
    
    if (setting === "Practice") {
        return (
            <>
                <QuestionPanel />
                <AnswerPanel />
            </>
        )
    }

    if (setting === "Exam") {
        return (
            <>
                <QuestionPanel />
            </>
        )
    }

    return null
}