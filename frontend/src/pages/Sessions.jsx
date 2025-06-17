import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { 
  Plus, Users, BookOpen, Trash2, UserPlus, Video, FileText, PenTool, Play, Edit, 
  MoreVertical, Calendar, Clock, Settings, Eye, EyeOff, Brain, ArrowRight, UserMinus
} from 'lucide-react';
import API from '../api';

export default function Sessions() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  
  // Form states
  const [showClassEditForm, setShowClassEditForm] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [showEditSessionForm, setShowEditSessionForm] = useState(false);
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  
  // Class edit form
  const [editClassName, setEditClassName] = useState('');
  const [editClassDescription, setEditClassDescription] = useState('');
  
  // Session forms
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionType, setSessionType] = useState('live');
  const [editSessionTitle, setEditSessionTitle] = useState('');
  const [editSessionType, setEditSessionType] = useState('live');

  useEffect(() => {
    fetchClasses();
    const role = localStorage.getItem('userRole');
    setUserRole(role);
  }, []);

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await API.get('/classes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Classes data received:', response.data);
      setClasses(response.data);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClass = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await API.put(`/classes/${selectedClass.id}`, {
        name: editClassName,
        description: editClassDescription
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setEditClassName('');
      setEditClassDescription('');
      setShowClassEditForm(false);
      setSelectedClass(null);
      fetchClasses();
    } catch (error) {
      console.error('Failed to update class:', error);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      console.log('Creating session with data:', {
        title: sessionTitle,
        class_id: selectedClass.id,
        session_type: sessionType
      });
      
      const response = await API.post('/sessions', {
        title: sessionTitle,
        class_id: selectedClass.id,
        session_type: sessionType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Session created successfully:', response.data);
      
      setSessionTitle('');
      setSessionType('live');
      setShowSessionForm(false);
      setSelectedClass(null);
      fetchClasses();
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleEditSession = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await API.put(`/sessions/${selectedSession.id}`, {
        title: editSessionTitle,
        session_type: editSessionType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setEditSessionTitle('');
      setEditSessionType('live');
      setShowEditSessionForm(false);
      setSelectedSession(null);
      fetchClasses();
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await API.delete(`/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchClasses();
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const openClassEditForm = (classObj) => {
    setSelectedClass(classObj);
    setEditClassName(classObj.name);
    setEditClassDescription(classObj.description || '');
    setShowClassEditForm(true);
  };

  const openSessionForm = (classObj) => {
    setSelectedClass(classObj);
    setShowSessionForm(true);
  };

  const openEditSessionForm = (session) => {
    setSelectedSession(session);
    setEditSessionTitle(session.title);
    setEditSessionType(session.session_type);
    setShowEditSessionForm(true);
  };

  const openSessionDetails = (session) => {
    setSelectedSession(session);
    setShowSessionDetails(true);
  };

  const getSessionTypeIcon = (type) => {
    switch (type) {
      case 'live':
        return <Video className="w-4 h-4" />;
      case 'quiz':
        return <FileText className="w-4 h-4" />;
      case 'whiteboard':
        return <PenTool className="w-4 h-4" />;
      default:
        return <Play className="w-4 h-4" />;
    }
  };

  const getSessionTypeLabel = (type) => {
    switch (type) {
      case 'live':
        return 'Live Class';
      case 'quiz':
        return 'Quiz Session';
      case 'whiteboard':
        return 'Whiteboard';
      default:
        return 'Session';
    }
  };

  const getSessionTypeColor = (type) => {
    switch (type) {
      case 'live':
        return 'bg-red-100 text-red-800';
      case 'quiz':
        return 'bg-blue-100 text-blue-800';
      case 'whiteboard':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const joinSession = (session) => {
    window.location.href = `/session/${session.id}`;
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading sessions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sessions</h1>
          <p className="text-gray-600 mt-1">Manage your learning sessions and classes</p>
        </div>
        {userRole === 'teacher' && (
          <div className="flex gap-2">
            <Button onClick={() => window.location.href = '/dashboard/classes'} className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Manage Classes
            </Button>
          </div>
        )}
      </div>

      {/* Debug Section - Remove this after fixing */}
      {/*
      <Card>
        <CardHeader>
          <CardTitle>Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            <p><strong>Classes Count:</strong> {classes.length}</p>
            <p><strong>User Role:</strong> {userRole}</p>
            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            <details className="mt-2">
              <summary className="cursor-pointer">Raw Classes Data</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                {JSON.stringify(classes, null, 2)}
              </pre>
            </details>
          </div>
        </CardContent>
      </Card>
      */}
      {/* Class Edit Form */}
      {showClassEditForm && selectedClass && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Class: {selectedClass.name}</CardTitle>
            <CardDescription>Update class information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateClass} className="space-y-4">
              <div>
                <Label htmlFor="editClassName">Class Name</Label>
                <Input
                  id="editClassName"
                  value={editClassName}
                  onChange={(e) => setEditClassName(e.target.value)}
                  placeholder="Enter class name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="editClassDescription">Description</Label>
                <Input
                  id="editClassDescription"
                  value={editClassDescription}
                  onChange={(e) => setEditClassDescription(e.target.value)}
                  placeholder="Enter class description"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Update Class</Button>
                <Button type="button" variant="outline" onClick={() => setShowClassEditForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Create Session Form */}
      {showSessionForm && selectedClass && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Session in {selectedClass.name}</CardTitle>
            <CardDescription>Create a learning session for your class</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <Label htmlFor="sessionTitle">Session Title</Label>
                <Input
                  id="sessionTitle"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="Enter session title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="sessionType">Session Type</Label>
                <select
                  id="sessionType"
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="live">Live Video Class</option>
                  <option value="quiz">Quiz Session</option>
                  <option value="whiteboard">Whiteboard Session</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Session</Button>
                <Button type="button" variant="outline" onClick={() => setShowSessionForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit Session Form */}
      {showEditSessionForm && selectedSession && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Session</CardTitle>
            <CardDescription>Update session information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEditSession} className="space-y-4">
              <div>
                <Label htmlFor="editSessionTitle">Session Title</Label>
                <Input
                  id="editSessionTitle"
                  value={editSessionTitle}
                  onChange={(e) => setEditSessionTitle(e.target.value)}
                  placeholder="Enter session title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="editSessionType">Session Type</Label>
                <select
                  id="editSessionType"
                  value={editSessionType}
                  onChange={(e) => setEditSessionType(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="live">Live Video Class</option>
                  <option value="quiz">Quiz Session</option>
                  <option value="whiteboard">Whiteboard Session</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Update Session</Button>
                <Button type="button" variant="outline" onClick={() => setShowEditSessionForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Session Details Modal */}
      {showSessionDetails && selectedSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getSessionTypeIcon(selectedSession.session_type)}
              {selectedSession.title}
            </CardTitle>
            <CardDescription>Session details and information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Type</Label>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSessionTypeColor(selectedSession.session_type)}`}>
                    {getSessionTypeLabel(selectedSession.session_type)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Created</Label>
                  <p className="text-sm">{new Date(selectedSession.start_time).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={() => joinSession(selectedSession)} className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Join Session
                </Button>
                {userRole === 'teacher' && (
                  <>
                    <Button variant="outline" onClick={() => {
                      setShowSessionDetails(false);
                      openEditSessionForm(selectedSession);
                    }} className="flex items-center gap-2">
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setShowSessionDetails(false);
                      handleDeleteSession(selectedSession.id);
                    }} className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={() => setShowSessionDetails(false)}>
                  Close
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Classes and Sessions List */}
      <div className="space-y-6">
        {classes.map(classObj => (
          <Card key={classObj.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    {classObj.name}
                  </CardTitle>
                  <CardDescription>
                    {classObj.description || 'No description provided'}
                  </CardDescription>
                </div>
                {userRole === 'teacher' && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openClassEditForm(classObj)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openSessionForm(classObj)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  {classObj.student_count || 0} students enrolled
                </div>
                
                {/* Sessions Section */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Sessions ({classObj.sessions?.length || 0})</h4>
                  {classObj.sessions && classObj.sessions.length > 0 ? (
                    <div className="grid gap-2">
                      {classObj.sessions.map(session => (
                        <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {getSessionTypeIcon(session.session_type)}
                            <div>
                              <div className="font-medium text-sm">{session.title}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSessionTypeColor(session.session_type)}`}>
                                  {getSessionTypeLabel(session.session_type)}
                                </span>
                                <span>•</span>
                                <span>{new Date(session.start_time).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openSessionDetails(session)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => joinSession(session)}>
                              <Play className="w-4 h-4" />
                            </Button>
                            {userRole === 'teacher' && (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => openEditSessionForm(session)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDeleteSession(session.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No sessions created yet</p>
                      {userRole === 'teacher' && (
                        <Button size="sm" variant="outline" className="mt-2" onClick={() => openSessionForm(classObj)}>
                          <Plus className="w-4 h-4 mr-1" />
                          Create First Session
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {classes.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Video className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">
              {userRole === 'teacher' 
                ? 'No classes found. Create your first class to start creating sessions!'
                : 'You are not enrolled in any classes yet.'
              }
            </p>
            {userRole === 'teacher' && (
              <Button className="mt-4" onClick={() => window.location.href = '/dashboard/classes'}>
                <BookOpen className="w-4 h-4 mr-2" />
                Create Your First Class
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 