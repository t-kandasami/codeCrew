import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoConference from '../components/VideoConference';
import ChatBox from '../components/ChatBox';
import WhiteBoard from '../components/WhiteBoard';
import Quiz from '../components/Quiz';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  Video, MessageSquare, PenTool, FileText, Users, Settings, 
  Maximize, Minimize, ArrowLeft, Plus
} from 'lucide-react';
import API from '../api';

export default function Session() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [activeTab, setActiveTab] = useState('video'); // video, chat, whiteboard, quiz
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    fetchSessionDetails();
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName') || 'User';
    setUserRole(role);
    setUserName(name);
  }, [id]);

  const fetchSessionDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await API.get(`/sessions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSession(response.data);
    } catch (error) {
      console.error('Failed to fetch session details:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const leaveSession = () => {
    window.location.href = '/dashboard/sessions';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Session Not Found</h2>
          <p className="text-gray-600 mb-4">The session you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={leaveSession} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Sessions
          </Button>
        </div>
      </div>
    );
  }

  // If it's a live video session, show the video conference interface
  if (session.session_type === 'live') {
    return (
      <VideoConference 
        sessionId={id} 
        userRole={userRole} 
        userName={userName} 
      />
    );
  }

  // For other session types, show the tabbed interface
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={leaveSession}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Leave Session
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{session.title}</h1>
              <p className="text-sm text-gray-600">
                {session.session_type === 'quiz' ? 'Quiz Session' : 
                 session.session_type === 'whiteboard' ? 'Whiteboard Session' : 'Session'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>Active Session</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="flex items-center gap-2"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('chat')}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'chat'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </button>
          
          <button
            onClick={() => setActiveTab('whiteboard')}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'whiteboard'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <PenTool className="w-4 h-4" />
            Whiteboard
          </button>
          
          {session.session_type === 'quiz' && (
            <button
              onClick={() => setActiveTab('quiz')}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'quiz'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="w-4 h-4" />
              Quiz
            </button>
          )}
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 p-6">
        {activeTab === 'chat' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Session Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChatBox sessionId={id} />
            </CardContent>
          </Card>
        )}
        
        {activeTab === 'whiteboard' && (
          <div className="h-[calc(100vh-200px)]">
            <WhiteBoard sessionId={id} />
          </div>
        )}
        
        {activeTab === 'quiz' && session.session_type === 'quiz' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Session Quiz
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Quiz sessionId={id} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
