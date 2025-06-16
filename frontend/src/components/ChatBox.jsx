import React, { useState, useEffect, useRef } from 'react';

export default function ChatBox({ sessionId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(
      `${process.env.REACT_APP_API_URL?.replace(/^http/, 'ws') || 'ws://localhost:8000'}/ws/${sessionId}/chat`
    );
    ws.current.onmessage = e => {
      const msg = JSON.parse(e.data);
      setMessages(prev => [...prev, msg]);
    };
    return () => ws.current.close();
  }, [sessionId]);

  const sendMessage = () => {
    ws.current.send(JSON.stringify({ text }));
    setText('');
  };

  return (
    <div className="chatbox">
      <h3>Chat</h3>
      <div className="messages" style={{ height: '200px', overflowY: 'auto' }}>
        {messages.map((m, i) => (
          <div key={i}>
            <strong>{m.sender}:</strong> {m.text}
          </div>
        ))}
      </div>
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Type a message"
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}