import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import API from '../api';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const res = await API.post('/signup', {
        name,
        email,
        password,
        role
      });
      
      if (res.data) {
        // After successful signup, log the user in
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        
        const loginRes = await API.post('/token', formData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
        
        if (loginRes.data && loginRes.data.access_token) {
          localStorage.setItem('token', loginRes.data.access_token);
          localStorage.setItem('userRole', loginRes.data.role);
          
          // Fetch user details
          try {
            const userRes = await API.get('/users/me', {
              headers: {
                'Authorization': `Bearer ${loginRes.data.access_token}`
              }
            });
            
            if (userRes.data) {
              localStorage.setItem('userId', userRes.data.id);
              localStorage.setItem('userName', userRes.data.name);
              localStorage.setItem('userEmail', userRes.data.email);
            }
          } catch (userErr) {
            console.error('Failed to fetch user details:', userErr);
          }
          
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.response?.data?.detail || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold text-gray-900">
              Create account
            </CardTitle>
            <CardDescription className="text-gray-600">
              Join CodeCrew and start your learning journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 