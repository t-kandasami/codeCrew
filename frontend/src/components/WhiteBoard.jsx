import React, { useRef, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { PenTool, Eraser, RotateCcw } from 'lucide-react';

export default function WhiteBoard({ sessionId }) {
  const canvasRef = useRef();
  const wsRef = useRef();
  const [isConnected, setIsConnected] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen'); // 'pen' or 'eraser'

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Set default drawing style
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000000';

    const token = localStorage.getItem('token');
    const wsUrl = `ws://localhost:8000/ws/session/${sessionId}?token=${token}`;
    
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      console.log('Whiteboard WebSocket connected');
      setIsConnected(true);
    };
    
    wsRef.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'whiteboard_draw') {
        drawLine(ctx, data.x0, data.y0, data.x1, data.y1, data.color, data.width);
      } else if (data.type === 'whiteboard_clear') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    
    wsRef.current.onclose = () => {
      console.log('Whiteboard WebSocket disconnected');
      setIsConnected(false);
    };
    
    wsRef.current.onerror = (error) => {
      console.error('Whiteboard WebSocket error:', error);
      setIsConnected(false);
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

    const drawLine = (ctx, x0, y0, x1, y1, color, width) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.restore();
    };

    const handleDown = (e) => {
      drawing = true;
      setIsDrawing(true);
      prev = getMousePos(canvas, e);
    };

    const handleMove = (e) => {
      if (!drawing) return;
      const pos = getMousePos(canvas, e);
      
      // Draw locally
      drawLine(ctx, prev.x, prev.y, pos.x, pos.y, ctx.strokeStyle, ctx.lineWidth);
      
      // Send to server
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'whiteboard_draw',
          x0: prev.x,
          y0: prev.y,
          x1: pos.x,
          y1: pos.y,
          color: ctx.strokeStyle,
          width: ctx.lineWidth
        }));
      }
      
      prev = pos;
    };

    const handleUp = () => {
      drawing = false;
      setIsDrawing(false);
    };

    canvas.addEventListener('mousedown', handleDown);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleUp);
    canvas.addEventListener('mouseleave', handleUp);

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      canvas.removeEventListener('mousedown', handleDown);
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseup', handleUp);
      canvas.removeEventListener('mouseleave', handleUp);
    };
  }, [sessionId]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'whiteboard_clear'
      }));
    }
  };

  const setDrawingTool = (newTool) => {
    setTool(newTool);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (newTool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 20;
    } else {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border border-gray-200 rounded-lg">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 font-semibold text-gray-900">
            <PenTool className="w-5 h-5" />
            Collaborative Whiteboard
            {!isConnected && (
              <span className="text-xs text-red-500 ml-2">(Disconnected)</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant={tool === 'pen' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDrawingTool('pen')}
            >
              <PenTool className="w-4 h-4" />
            </Button>
            <Button
              variant={tool === 'eraser' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDrawingTool('eraser')}
            >
              <Eraser className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearCanvas}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1 p-0">
        <div className="relative w-full h-full min-h-[600px]">
          <canvas
            ref={canvasRef}
            className="border border-gray-300 rounded-lg cursor-crosshair w-full h-full"
            style={{
              cursor: isDrawing ? 'crosshair' : 'default'
            }}
          />
          {!isConnected && (
            <div className="absolute inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center">
              <div className="text-center">
                <div className="text-gray-500 mb-2">Connecting to whiteboard...</div>
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
