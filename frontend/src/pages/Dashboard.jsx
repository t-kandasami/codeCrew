import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

export default function Dashboard() {
  const [sessions, setSessions] = useState([]);
  const [title, setTitle] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    const res = await API.get('/sessions'); // ensure backend implements GET /sessions
    setSessions(res.data);
  };

  const createSession = async () => {
    const res = await API.post('/sessions', { title });
    navigate(`/session/${res.data.id}`);
  };

  return (
    <div className="dashboard-container">
      <h2>Dashboard</h2>
      <div>
        <input
          placeholder="Session Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <button onClick={createSession}>Create Session</button>
      </div>
      <ul>
        {sessions.map(s => (
          <li key={s.id} onClick={() => navigate(`/session/${s.id}`)}>
            {s.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
