import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Send, MessageSquare } from 'lucide-react';

export default function ChatBox({ sessionId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const wsUrl = `ws://localhost:8000/ws/session/${sessionId}?token=${token}`;
    
    ws.current = new WebSocket(wsUrl);
    
    ws.current.onopen = () => {
      console.log('Chat WebSocket connected');
      setIsConnected(true);
    };
    
    ws.current.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'chat_message') {
        setMessages(prev => [...prev, msg]);
      }
    };
    
    ws.current.onclose = () => {
      console.log('Chat WebSocket disconnected');
      setIsConnected(false);
    };
    
    ws.current.onerror = (error) => {
      console.error('Chat WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [sessionId]);

  const sendMessage = () => {
    if (text.trim() && ws.current && ws.current.readyState === WebSocket.OPEN) {
      const message = {
        type: 'chat_message',
        message: text.trim(),
        timestamp: new Date().toISOString()
      };
      ws.current.send(JSON.stringify(message));
      setText('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Session Chat
          {!isConnected && (
            <span className="text-xs text-red-500 ml-2">(Disconnected)</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto mb-4 space-y-2 max-h-96">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-blue-600">
                    {msg.userName || 'Unknown'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                  <p className="text-sm">{msg.message}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={!isConnected}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!text.trim() || !isConnected}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}