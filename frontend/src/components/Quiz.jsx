import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { CheckCircle, XCircle, Loader2, FileText, Award, Plus } from 'lucide-react';
import API from '../api';

export default function Quiz({ sessionId }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submittedAnswers, setSubmittedAnswers] = useState({});
  const [results, setResults] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [userRole, setUserRole] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchQuizzes();
    const role = localStorage.getItem('userRole');
    setUserRole(role);
  }, [sessionId]);

  const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await API.get(`/sessions/${sessionId}/quizzes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuizzes(response.data);
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, answer) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const submitAnswer = async (questionId) => {
    if (!selectedAnswers[questionId]) {
      alert('Please select an answer before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await API.post(
        `/sessions/${sessionId}/quizzes/${questionId}/responses`,
        { selected_answer: selectedAnswers[questionId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSubmittedAnswers(prev => ({
        ...prev,
        [questionId]: true
      }));
      
      setResults(prev => ({
        ...prev,
        [questionId]: response.data
      }));
      
      // Move to next question if available
      const currentIndex = quizzes.findIndex(q => q.id === questionId);
      if (currentIndex < quizzes.length - 1) {
        setCurrentQuestionIndex(currentIndex + 1);
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      alert('Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitAllAnswers = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      
      for (const [questionId, answer] of Object.entries(selectedAnswers)) {
        if (!submittedAnswers[questionId]) {
          await API.post(
            `/sessions/${sessionId}/quizzes/${questionId}/responses`,
            { selected_answer: answer },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      }
      
      setShowResults(true);
    } catch (error) {
      console.error('Failed to submit answers:', error);
      alert('Failed to submit answers. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateScore = () => {
    const correctAnswers = Object.values(results).filter(result => result.is_correct).length;
    const totalQuestions = quizzes.length;
    return {
      correct: correctAnswers,
      total: totalQuestions,
      percentage: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
    };
  };

  const getQuestionOptions = (quiz) => {
    // If the quiz has options stored, use them
    if (quiz.options && Array.isArray(quiz.options)) {
      return quiz.options;
    }
    
    // Fallback: create options from the correct answer (for backward compatibility)
    return [quiz.correct_answer, 'Option B', 'Option C', 'Option D'];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="text-center p-8">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Quiz Available</h3>
        <p className="text-gray-600 mb-4">
          {userRole === 'teacher' 
            ? 'No quiz questions have been created for this session yet.'
            : 'No quiz questions are available for this session.'
          }
        </p>
        {userRole === 'teacher' && (
          <Button
            onClick={() => navigate(`/session/${sessionId}/quiz/create`)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Quiz
          </Button>
        )}
      </div>
    );
  }

  if (showResults) {
    const score = calculateScore();
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Quiz Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {score.correct}/{score.total}
            </div>
            <div className="text-lg text-gray-600">
              {score.percentage}% Correct
            </div>
            <div className="mt-4">
              {score.percentage >= 80 && (
                <div className="text-green-600 font-medium">Excellent work! 🎉</div>
              )}
              {score.percentage >= 60 && score.percentage < 80 && (
                <div className="text-yellow-600 font-medium">Good job! 👍</div>
              )}
              {score.percentage < 60 && (
                <div className="text-red-600 font-medium">Keep practicing! 💪</div>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            {quizzes.map((quiz, index) => {
              const result = results[quiz.id];
              const userAnswer = selectedAnswers[quiz.id];
              const options = getQuestionOptions(quiz);
              
              return (
                <Card key={quiz.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium">Question {index + 1}</h4>
                      {result && (
                        <div className="flex items-center gap-2">
                          {result.is_correct ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          <span className={`text-sm font-medium ${
                            result.is_correct ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {result.is_correct ? 'Correct' : 'Incorrect'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <p className="mb-3">{quiz.question_text}</p>
                    
                    <div className="space-y-2">
                      {options.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className={`p-3 rounded border ${
                            userAnswer === option
                              ? result?.is_correct
                                ? 'bg-green-50 border-green-200 text-green-800'
                                : 'bg-red-50 border-red-200 text-red-800'
                              : option === quiz.correct_answer && result
                                ? 'bg-green-50 border-green-200 text-green-800'
                                : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          {String.fromCharCode(65 + optionIndex)}. {option}
                          {option === quiz.correct_answer && result && (
                            <CheckCircle className="w-4 h-4 inline ml-2 text-green-600" />
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {quiz.explanation && result && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                        <strong>Explanation:</strong> {quiz.explanation}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <div className="mt-6 text-center">
            <Button
              onClick={() => {
                setShowResults(false);
                setCurrentQuestionIndex(0);
                setSelectedAnswers({});
                setSubmittedAnswers({});
                setResults({});
              }}
              variant="outline"
            >
              Take Quiz Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuiz = quizzes[currentQuestionIndex];
  const options = getQuestionOptions(currentQuiz);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Session Quiz ({currentQuestionIndex + 1} of {quizzes.length})
          </CardTitle>
          {userRole === 'teacher' && (
            <Button
              variant="outline"
              onClick={() => navigate(`/session/${sessionId}/quiz/create`)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Quiz
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">{currentQuiz.question_text}</h3>
          
          <div className="space-y-3">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(currentQuiz.id, option)}
                className={`w-full p-4 text-left rounded border transition-colors ${
                  selectedAnswers[currentQuiz.id] === option
                    ? 'bg-blue-50 border-blue-500 text-blue-800'
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium mr-3">
                  {String.fromCharCode(65 + index)}.
                </span>
                {option}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {currentQuestionIndex > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
              >
                Previous
              </Button>
            )}
            
            {currentQuestionIndex < quizzes.length - 1 && (
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              >
                Next
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {!submittedAnswers[currentQuiz.id] && (
              <Button
                onClick={() => submitAnswer(currentQuiz.id)}
                disabled={!selectedAnswers[currentQuiz.id] || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Answer'
                )}
              </Button>
            )}
            
            {Object.keys(selectedAnswers).length === quizzes.length && (
              <Button
                onClick={submitAllAnswers}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Finish Quiz'
                )}
              </Button>
            )}
          </div>
        </div>
        
        {submittedAnswers[currentQuiz.id] && results[currentQuiz.id] && (
          <div className="mt-4 p-3 rounded border">
            <div className="flex items-center gap-2 mb-2">
              {results[currentQuiz.id].is_correct ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={`font-medium ${
                results[currentQuiz.id].is_correct ? 'text-green-600' : 'text-red-600'
              }`}>
                {results[currentQuiz.id].is_correct ? 'Correct!' : 'Incorrect'}
              </span>
            </div>
            {currentQuiz.explanation && (
              <p className="text-sm text-gray-600">{currentQuiz.explanation}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 