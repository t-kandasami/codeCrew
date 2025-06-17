import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { 
  Brain, Sparkles, Loader2, CheckCircle, AlertCircle, 
  BookOpen, Calculator, Globe, History, Languages, 
  Plus, Edit, Trash2, Save 
} from 'lucide-react';
import API from '../api';

const AIQuizGenerator = ({ sessionId, onQuestionsGenerated }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [subject, setSubject] = useState('science');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [gradeLevel, setGradeLevel] = useState('primary');
  const [questionCount, setQuestionCount] = useState(10);
  
  // Question editing state
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingIndex, setEditingIndex] = useState(-1);

  const subjects = [
    { value: 'science', label: 'Science', icon: <BookOpen className="w-4 h-4" /> },
    { value: 'math', label: 'Mathematics', icon: <Calculator className="w-4 h-4" /> },
    { value: 'english', label: 'English', icon: <Languages className="w-4 h-4" /> },
    { value: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
    { value: 'geography', label: 'Geography', icon: <Globe className="w-4 h-4" /> }
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

  const generateQuestions = async () => {
    setIsGenerating(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await API.post('/ai/generate-questions', {
        subject,
        topic: topic || undefined,
        difficulty,
        grade_level: gradeLevel,
        count: questionCount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setGeneratedQuestions(response.data.questions);
      setSuccess(`Successfully generated ${response.data.questions.length} questions!`);
    } catch (err) {
      console.error('Failed to generate questions:', err);
      setError(err.response?.data?.detail || 'Failed to generate questions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveQuestionsToSession = async () => {
    if (generatedQuestions.length === 0) {
      setError('No questions to save');
      return;
    }

    setIsGenerating(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
      // Save each question to the session
      const savedQuestions = [];
      for (const question of generatedQuestions) {
        const response = await API.post(`/sessions/${sessionId}/quizzes`, {
          question_text: question.question,
          correct_answer: question.correct_answer
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        savedQuestions.push(response.data);
      }
      
      setSuccess(`Successfully saved ${savedQuestions.length} questions to the session!`);
      
      // Call the callback to refresh the quiz list
      if (onQuestionsGenerated) {
        onQuestionsGenerated(savedQuestions);
      }
      
      // Clear the generated questions
      setGeneratedQuestions([]);
    } catch (err) {
      console.error('Failed to save questions:', err);
      setError(err.response?.data?.detail || 'Failed to save questions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const editQuestion = (index) => {
    setEditingIndex(index);
    setEditingQuestion({ ...generatedQuestions[index] });
  };

  const saveQuestionEdit = () => {
    if (editingIndex >= 0 && editingQuestion) {
      const updatedQuestions = [...generatedQuestions];
      updatedQuestions[editingIndex] = editingQuestion;
      setGeneratedQuestions(updatedQuestions);
      setEditingIndex(-1);
      setEditingQuestion(null);
    }
  };

  const cancelQuestionEdit = () => {
    setEditingIndex(-1);
    setEditingQuestion(null);
  };

  const deleteQuestion = (index) => {
    const updatedQuestions = generatedQuestions.filter((_, i) => i !== index);
    setGeneratedQuestions(updatedQuestions);
  };

  const QuestionCard = ({ question, index }) => {
    const isEditing = editingIndex === index;
    
    if (isEditing) {
      return (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div>
                <Label>Question</Label>
                <Input
                  value={editingQuestion.question}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    question: e.target.value
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Options</Label>
                {editingQuestion.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...editingQuestion.options];
                        newOptions[optionIndex] = e.target.value;
                        setEditingQuestion({
                          ...editingQuestion,
                          options: newOptions
                        });
                      }}
                    />
                    <Button
                      size="sm"
                      variant={editingQuestion.correct_answer === option ? "default" : "outline"}
                      onClick={() => setEditingQuestion({
                        ...editingQuestion,
                        correct_answer: option
                      })}
                    >
                      Correct
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button size="sm" onClick={saveQuestionEdit}>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={cancelQuestionEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card className="mb-4">
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
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Quiz Generator
          </CardTitle>
          <CardDescription>
            Generate quiz questions using AI for your session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Subject Selection */}
            <div>
              <Label>Subject</Label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md mt-1"
              >
                {subjects.map(subj => (
                  <option key={subj.value} value={subj.value}>
                    {subj.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic (Optional) */}
            <div>
              <Label>Topic (Optional)</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Photosynthesis, Algebra, Grammar"
                className="mt-1"
              />
            </div>

            {/* Difficulty */}
            <div>
              <Label>Difficulty</Label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md mt-1"
              >
                {difficulties.map(diff => (
                  <option key={diff.value} value={diff.value}>
                    {diff.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Grade Level */}
            <div>
              <Label>Grade Level</Label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md mt-1"
              >
                {gradeLevels.map(grade => (
                  <option key={grade.value} value={grade.value}>
                    {grade.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Question Count */}
            <div>
              <Label>Number of Questions</Label>
              <Input
                type="number"
                min="5"
                max="20"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>

          {/* Generate Button */}
          <div className="mt-6">
            <Button
              onClick={generateQuestions}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Questions...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Questions with AI
                </>
              )}
            </Button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mt-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {success}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Questions */}
      {generatedQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Generated Questions ({generatedQuestions.length})</CardTitle>
              <Button onClick={saveQuestionsToSession} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save to Session
                  </>
                )}
              </Button>
            </div>
            <CardDescription>
              Review and edit the generated questions before saving them to your session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {generatedQuestions.map((question, index) => (
                <QuestionCard key={index} question={question} index={index} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIQuizGenerator; 