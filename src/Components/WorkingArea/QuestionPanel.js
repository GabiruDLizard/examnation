// import React, { useState, useRef, useEffect } from 'react'

// export default function QuestionPanel() {
//     return (
//         <div className="questionCard">
//             <div className="question-header">
//                 <div className="question-title">
//                     {question?.UniqueName || "Practice Problem"}
//                     <span className={`difficulty-badge ${question.Difficulty.toLowerCase()}`}>
//                       {question.Difficulty}
//                     </span>
//                   </div>
//                 </div>
//                 <div className="question-content">
//                   <div className="problem-statement">
//                     <h4>Problem</h4>
//                     <div className="questionText">
//                       {renderQuestionText(question["Question Text"])}
//                     </div>
//                     <div className="question-image">
//                       {question["Image URL"] && <img src={question["Image URL"]} alt="Question Visual" />}
//                     </div>
//                     {(() => { const h = getAnswerFormatHint(question.Solution); return h && (
//                       <div className="answer-format-hint">
//                         <span className="answer-format-text">{h.text}</span>
//                         <span className="answer-format-example">e.g. {h.example}</span>
//                       </div>
//                     ); })()}
//                   </div>
//                 </div>
//             </div>
//         </div>
//     );
// }