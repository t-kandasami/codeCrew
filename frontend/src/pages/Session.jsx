import React from 'react';
import { useParams } from 'react-router-dom';
import ChatBox from '../components/ChatBox';
import WhiteBoard from '../components/WhiteBoard';
import Quiz from '../components/Quiz';

export default function Session() {
  const { id } = useParams();
  return (
    <div className="session-container">
      <h2>Session {id}</h2>
      <div className="session-grid">
        <ChatBox sessionId={id} />
        <WhiteBoard sessionId={id} />
        <Quiz sessionId={id} />
      </div>
    </div>
  );
}
