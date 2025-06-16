import React, { useRef, useEffect } from 'react';

export default function WhiteBoard({ sessionId }) {
  const canvasRef = useRef();
  const wsRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 400;
    ctx.lineWidth = 2;

    wsRef.current = new WebSocket(
      `${process.env.REACT_APP_API_URL?.replace(/^http/, 'ws') || 'ws://localhost:8000'}/ws/${sessionId}/whiteboard`
    );
    wsRef.current.onmessage = e => {
      const { x0, y0, x1, y1 } = JSON.parse(e.data);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    };

    let drawing = false;
    let prev = {};
    
    const getMousePos = (canvas, e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const handleDown = e => {
      drawing = true;
      prev = getMousePos(canvas, e);
    };

    const handleMove = e => {
      if (!drawing) return;
      const pos = getMousePos(canvas, e);
      wsRef.current.send(JSON.stringify({ x0: prev.x, y0: prev.y, x1: pos.x, y1: pos.y }));
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      prev = pos;
    };

    const handleUp = () => { drawing = false; };

    canvas.addEventListener('mousedown', handleDown);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleUp);
    canvas.addEventListener('mouseleave', handleUp);

    return () => {
      wsRef.current.close();
      canvas.removeEventListener('mousedown', handleDown);
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseup', handleUp);
      canvas.removeEventListener('mouseleave', handleUp);
    };
  }, [sessionId]);

  return (
    <div className="whiteboard">
      <h3>Whiteboard</h3>
      <canvas ref={canvasRef} style={{ border: '1px solid #ccc' }} />
    </div>
  );
}
