import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, Users, BookOpen, Trash2, UserPlus, Video, FileText, PenTool, Play, Edit, MoreVertical } from 'lucide-react';
import API from '../api';

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [showEditSessionForm, setShowEditSessionForm] = useState(false);
  const [showEditClassForm, setShowEditClassForm] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [userRole, setUserRole] = useState('');
  
  // Form states
  const [className, setClassName] = useState('');
  const [classDescription, setClassDescription] = useState('');
  const [editClassName, setEditClassName] = useState('');
  const [editClassDescription, setEditClassDescription] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
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
      setClasses(response.data);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await API.get('/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await API.post('/classes', {
        name: className,
        description: classDescription
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setClassName('');
      setClassDescription('');
      setShowCreateForm(false);
      fetchClasses();
    } catch (error) {
      console.error('Failed to create class:', error);
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
      setShowEditClassForm(false);
      setSelectedClass(null);
      fetchClasses();
    } catch (error) {
      console.error('Failed to update class:', error);
    }
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await API.post(`/classes/${selectedClass.id}/enroll/${selectedStudent}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSelectedStudent('');
      setShowEnrollForm(false);
      setSelectedClass(null);
      fetchClasses();
    } catch (error) {
      console.error('Failed to enroll student:', error);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await API.post('/sessions', {
        title: sessionTitle,
        class_id: selectedClass.id,
        session_type: sessionType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
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

  const handleRemoveStudent = async (classId, studentId) => {
    try {
      const token = localStorage.getItem('token');
      await API.delete(`/classes/${classId}/enroll/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchClasses();
    } catch (error) {
      console.error('Failed to remove student:', error);
    }
  };

  const openEnrollForm = async (classObj) => {
    setSelectedClass(classObj);
    await fetchStudents();
    setShowEnrollForm(true);
  };

  const openEditClassForm = (classObj) => {
    setSelectedClass(classObj);
    setEditClassName(classObj.name);
    setEditClassDescription(classObj.description || '');
    setShowEditClassForm(true);
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

  const joinSession = (session) => {
    // Navigate to the session page
    window.location.href = `/session/${session.id}`;
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading classes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Classes</h1>
        {userRole === 'teacher' && (
          <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Class
          </Button>
        )}
      </div>

      {/* Create Class Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Class</CardTitle>
            <CardDescription>Create a new class group for your students</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <Label htmlFor="className">Class Name</Label>
                <Input
                  id="className"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Enter class name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="classDescription">Description</Label>
                <Input
                  id="classDescription"
                  value={classDescription}
                  onChange={(e) => setClassDescription(e.target.value)}
                  placeholder="Enter class description (optional)"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Class</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit Class Form */}
      {showEditClassForm && selectedClass && (
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
                <Button type="button" variant="outline" onClick={() => setShowEditClassForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Enroll Student Form */}
      {showEnrollForm && selectedClass && (
        <Card>
          <CardHeader>
            <CardTitle>Enroll Student in {selectedClass.name}</CardTitle>
            <CardDescription>Add a student to this class</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEnrollStudent} className="space-y-4">
              <div>
                <Label htmlFor="student">Select Student</Label>
                <select
                  id="student"
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Choose a student...</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Enroll Student</Button>
                <Button type="button" variant="outline" onClick={() => setShowEnrollForm(false)}>
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

      {/* Classes List */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {classes.map(classObj => (
          <Card key={classObj.id} className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {classObj.name}
              </CardTitle>
              <CardDescription>
                {classObj.description || 'No description provided'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  {classObj.student_count || 0} students enrolled
                </div>
                
                {/* Sessions Section */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Sessions</h4>
                  {classObj.sessions && classObj.sessions.length > 0 ? (
                    <div className="space-y-1">
                      {classObj.sessions.map(session => (
                        <div key={session.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                          {getSessionTypeIcon(session.session_type || 'live')}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{session.title}</div>
                            <div className="text-xs text-gray-500">{getSessionTypeLabel(session.session_type || 'live')}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" onClick={() => joinSession(session)}>
                              <Play className="w-3 h-3" />
                            </Button>
                            {userRole === 'teacher' && (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => openEditSessionForm(session)}>
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDeleteSession(session.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">No sessions yet</p>
                  )}
                </div>
                
                {userRole === 'teacher' && (
                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openEditClassForm(classObj)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Class
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => openEnrollForm(classObj)}
                      className="flex items-center gap-1"
                    >
                      <UserPlus className="w-4 h-4" />
                      Add Student
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openSessionForm(classObj)}
                      className="flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add Session
                    </Button>
                  </div>
                )}
                
                <div className="text-xs text-gray-500">
                  Created: {new Date(classObj.created_at).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {classes.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">
              {userRole === 'teacher' 
                ? 'No classes created yet. Create your first class to get started!'
                : 'You are not enrolled in any classes yet.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 