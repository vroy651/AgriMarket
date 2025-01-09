import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { api } from '../api';

import "./styles/LoginPage.css";
// import FarmBackground from '../assets/farm-background.jpg'; // Import a relevant background image
// import Logo from '../assets/logo.png'; // Import your application logo

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    const loginData = {
      username: username,
      password: password,
    };

    try {
      const response = await api.post('users/login/', loginData);
      if (response.status === 200) {
        const { access, refresh } = response.data;
        login(access, refresh);
        navigate('/');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to connect to the server. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{
        // backgroundImage: `url(${FarmBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="w-full max-w-md bg-white bg-opacity-90 backdrop-blur-sm rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          {/* {Logo && <img src={Logo} alt="Logo" className="h-16 mx-auto mb-4" />} */}
          <h2 className="text-2xl font-bold mb-2 text-green-700">Welcome to the AgriConnect Hub</h2>
          <p className="text-gray-700">
            Log in to manage your farm, connect with suppliers, and access market insights.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Username / Farm ID
            </label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username or Farm ID"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </span>
            ) : (
              'Log in to AgriConnect'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-2">
            New to AgriConnect?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-green-600 hover:text-green-800 font-semibold"
            >
              Register your Farm
            </button>
          </p>
          <button
            onClick={() => navigate('/forgot-password')}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Forgot your login details?
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;