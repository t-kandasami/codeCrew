import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { 
  Plus, Save, Trash2, Edit, Brain, Sparkles, Loader2, CheckCircle, 
  AlertCircle, ArrowLeft, FileText, BookOpen, Users, Settings, RefreshCw
} from 'lucide-react';
import API from '../api';

const QuizCreator = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState('');
  
  // Quiz state
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correct_answer: '',
    explanation: ''
  });
  const [editingIndex, setEditingIndex] = useState(-1);
  
  // AI Generation state
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSettings, setAiSettings] = useState({
    subject: 'science',
    topic: '',
    difficulty: 'medium',
    grade_level: 'primary',
    count: 5
  });

  useEffect(() => {
    fetchSessionDetails();
    fetchExistingQuizzes();
    const role = localStorage.getItem('userRole');
    setUserRole(role);
  }, [sessionId]);

  const fetchSessionDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await API.get(`/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSession(response.data);
      setQuizTitle(`${response.data.title} - Quiz`);
    } catch (error) {
      console.error('Failed to fetch session details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingQuizzes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await API.get(`/sessions/${sessionId}/quizzes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Convert existing quizzes to the format expected by the component
      const existingQuestions = response.data.map(quiz => ({
        question: quiz.question_text,
        options: quiz.options || [quiz.correct_answer, 'Option B', 'Option C', 'Option D'],
        correct_answer: quiz.correct_answer,
        explanation: quiz.explanation || ''
      }));
      
      setQuestions(existingQuestions);
    } catch (error) {
      console.error('Failed to fetch existing quizzes:', error);
    }
  };

  const addQuestion = () => {
    if (currentQuestion.question.trim() && currentQuestion.correct_answer.trim()) {
      if (editingIndex >= 0) {
        // Update existing question
        const updatedQuestions = [...questions];
        updatedQuestions[editingIndex] = { ...currentQuestion };
        setQuestions(updatedQuestions);
        setEditingIndex(-1);
      } else {
        // Add new question
        setQuestions([...questions, { ...currentQuestion }]);
      }
      
      // Reset current question
      setCurrentQuestion({
        question: '',
        options: ['', '', '', ''],
        correct_answer: '',
        explanation: ''
      });
    }
  };

  const editQuestion = (index) => {
    setCurrentQuestion({ ...questions[index] });
    setEditingIndex(index);
  };

  const deleteQuestion = (index) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
  };

  const updateOption = (index, value) => {
    const updatedOptions = [...currentQuestion.options];
    updatedOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: updatedOptions });
  };

  const setCorrectAnswer = (answer) => {
    setCurrentQuestion({ ...currentQuestion, correct_answer: answer });
  };

  const generateQuestionsWithAI = async () => {
    setIsGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await API.post('/ai/generate-questions', aiSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const aiQuestions = response.data.questions.map(q => ({
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation || ''
      }));
      
      // Add AI questions to existing questions instead of replacing
      setQuestions(prev => [...prev, ...aiQuestions]);
      setShowAIGenerator(false);
    } catch (error) {
      console.error('Failed to generate questions:', error);
      alert('Failed to generate questions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveQuiz = async () => {
    if (questions.length === 0) {
      alert('Please add at least one question to the quiz.');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      // Save each question to the session
      for (const question of questions) {
        await API.post(`/sessions/${sessionId}/quizzes`, {
          question_text: question.question,
          options: question.options,
          correct_answer: question.correct_answer,
          explanation: question.explanation
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      alert('Quiz saved successfully!');
      navigate(`/session/${sessionId}`);
    } catch (error) {
      console.error('Failed to save quiz:', error);
      alert('Failed to save quiz. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const subjects = [
    { value: 'science', label: 'Science' },
    { value: 'math', label: 'Mathematics' },
    { value: 'english', label: 'English' },
    { value: 'history', label: 'History' },
    { value: 'geography', label: 'Geography' }
  ];

  const difficulties = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' }
  ];

  const gradeLevels = [
    { value: 'primary', label: 'Primary School' },
    { value: 'middle', label: 'Middle School' },
    { value: 'high', label: 'High School' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading quiz creator...</p>
        </div>
      </div>
    );
  }

  if (userRole !== 'teacher') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p>Only teachers can create quizzes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/session/${sessionId}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Session
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Quiz Creator</h1>
              <p className="text-gray-600">Create quiz for: {session?.title}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={saveQuiz}
              disabled={saving || questions.length === 0}
              className="flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Quiz
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Quiz Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Quiz Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quizTitle">Quiz Title</Label>
                <Input
                  id="quizTitle"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="Enter quiz title"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Questions Count</Label>
                <div className="mt-1 p-2 bg-gray-100 rounded border">
                  {questions.length} questions
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Generator Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Question Generator
            </CardTitle>
            <CardDescription>
              Generate additional questions using AI to add to your quiz
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <Label>Subject</Label>
                <select
                  value={aiSettings.subject}
                  onChange={(e) => setAiSettings({...aiSettings, subject: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md mt-1"
                >
                  {subjects.map(subj => (
                    <option key={subj.value} value={subj.value}>
                      {subj.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label>Topic (Optional)</Label>
                <Input
                  value={aiSettings.topic}
                  onChange={(e) => setAiSettings({...aiSettings, topic: e.target.value})}
                  placeholder="e.g., Photosynthesis"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label>Difficulty</Label>
                <select
                  value={aiSettings.difficulty}
                  onChange={(e) => setAiSettings({...aiSettings, difficulty: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md mt-1"
                >
                  {difficulties.map(diff => (
                    <option key={diff.value} value={diff.value}>
                      {diff.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label>Grade Level</Label>
                <select
                  value={aiSettings.grade_level}
                  onChange={(e) => setAiSettings({...aiSettings, grade_level: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md mt-1"
                >
                  {gradeLevels.map(grade => (
                    <option key={grade.value} value={grade.value}>
                      {grade.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div>
                <Label>Number of Questions</Label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={aiSettings.count}
                  onChange={(e) => setAiSettings({...aiSettings, count: parseInt(e.target.value)})}
                  className="mt-1 w-32"
                />
              </div>
              
              <Button
                onClick={generateQuestionsWithAI}
                disabled={isGenerating}
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate & Add Questions
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Manual Question Editor */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              {editingIndex >= 0 ? 'Edit Question' : 'Add Manual Question'}
            </CardTitle>
            <CardDescription>
              Create your own custom questions to add to the quiz
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="question">Question</Label>
                <Input
                  id="question"
                  value={currentQuestion.question}
                  onChange={(e) => setCurrentQuestion({...currentQuestion, question: e.target.value})}
                  placeholder="Enter your question here..."
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label>Options</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      />
                      <Button
                        size="sm"
                        variant={currentQuestion.correct_answer === option ? "default" : "outline"}
                        onClick={() => setCorrectAnswer(option)}
                        disabled={!option.trim()}
                      >
                        Correct
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="explanation">Explanation (Optional)</Label>
                <Input
                  id="explanation"
                  value={currentQuestion.explanation}
                  onChange={(e) => setCurrentQuestion({...currentQuestion, explanation: e.target.value})}
                  placeholder="Explain why this answer is correct..."
                  className="mt-1"
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={addQuestion} disabled={!currentQuestion.question.trim() || !currentQuestion.correct_answer.trim()}>
                  {editingIndex >= 0 ? 'Update Question' : 'Add Question'}
                </Button>
                {editingIndex >= 0 && (
                  <Button variant="outline" onClick={() => {
                    setEditingIndex(-1);
                    setCurrentQuestion({
                      question: '',
                      options: ['', '', '', ''],
                      correct_answer: '',
                      explanation: ''
                    });
                  }}>
                    Cancel Edit
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions List */}
        {questions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                All Quiz Questions ({questions.length})
              </CardTitle>
              <CardDescription>
                Review and edit all questions before saving
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium">Question {index + 1}</h4>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => editQuestion(index)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => deleteQuestion(index)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="mb-3">{question.question}</p>
                      
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <div
                            key={optionIndex}
                            className={`p-2 rounded border ${
                              option === question.correct_answer
                                ? 'bg-green-50 border-green-200 text-green-800'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            {String.fromCharCode(65 + optionIndex)}. {option}
                            {option === question.correct_answer && (
                              <CheckCircle className="w-4 h-4 inline ml-2 text-green-600" />
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {question.explanation && (
                        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                          <strong>Explanation:</strong> {question.explanation}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default QuizCreator; 