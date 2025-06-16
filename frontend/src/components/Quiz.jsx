import React, { useState, useEffect } from 'react';
import API from '../api';

export default function Quiz({ sessionId }) {
  const [quizzes, setQuizzes] = useState([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [selected, setSelected] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => { fetchQuizzes(); }, []);
  const fetchQuizzes = async () => {
    const res = await API.get(`/sessions/${sessionId}/quizzes`);
    setQuizzes(res.data);
  };

  const createQuiz = async () => {
    await API.post(`/sessions/${sessionId}/quizzes`, { question_text: question, correct_answer: answer });
    setQuestion('');
    setAnswer('');
    fetchQuizzes();
  };

  const submitAnswer = async (quizId) => {
    const r = await API.post(`/sessions/${sessionId}/quizzes/${quizId}/responses`, { selected_answer: selected });
    setResults(prev => [...prev, r.data]);
  };

  return (
    <div className="quiz">
      <h3>Quiz</h3>
      <div>
        <input
          placeholder="Question"
          value={question}
          onChange={e => setQuestion(e.target.value)}
        />
        <input
          placeholder="Answer"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
        />
        <button onClick={createQuiz}>Create</button>
      </div>
      {quizzes.map(q => (
        <div key={q.id} style={{ marginTop: '10px' }}>
          <p>{q.question_text}</p>
          <input
            placeholder="Your answer"
            onChange={e => setSelected(e.target.value)}
          />
          <button onClick={() => submitAnswer(q.id)}>Submit</button>
        </div>
      ))}
      {results.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <h4>Results</h4>
          {results.map(res => (
            <div key={res.id}>{res.is_correct ? 'Correct' : 'Wrong'}</div>
          ))}
        </div>
      )}
    </div>
  );
}
