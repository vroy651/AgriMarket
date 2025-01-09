import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api'; // Axios instance for API calls
import { Loader2 } from 'lucide-react'; // Import loader for visual feedback
import './styles/SignupPage.css'; // Import your styles

const SignupPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    password: '',
    password2: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({ ...prevFormData, [name]: value })); // Use functional updates
    setError(''); // Clear error when typing
  };


    const validateForm = () => {
      if (!formData.username.trim()) {
        setError('Username is required.');
        return false;
      }
      if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          setError('Valid email is required.');
          return false
      }
      if(!formData.first_name.trim()){
        setError('First Name is required.')
        return false
      }
      if (!formData.password.trim()) {
        setError('Password is required.');
        return false;
      }
        if(formData.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return false
        }
      if (formData.password !== formData.password2) {
        setError("Passwords do not match.");
        return false
      }
      return true;
    };


  const handleSubmit = async (e) => {
    e.preventDefault();

    if(!validateForm()) return
    setIsLoading(true); // Start loading
      setError('');

    try {
      // Signup API call
        const signupResponse = await api.post('users/signup/', formData);

        if (signupResponse.status === 201) {
        // Login immediately after successful signup
        const loginResponse = await api.post('users/login/', {
          username: formData.username,
          password: formData.password,
        });


        if (loginResponse.status === 200) {
          const { access, refresh } = loginResponse.data;
            login(access, refresh);
            navigate('/');
        } else {
            const loginError = loginResponse.data?.detail || 'Failed to log in after signup. Please try manually.';
            setError(loginError);
        }

      } else {
            const signupError = signupResponse.data?.message || 'Failed to sign up. Please try again.';
           setError(signupError);
      }
    } catch (err) {
         const errorMessage = err.response?.data?.message || 'An error occurred during signup.';
        setError(errorMessage);
      console.error('Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <h2>Sign Up</h2>
        {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Enter your username"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
          />
        </div>
          <div className="form-group">
              <label htmlFor="first_name">First Name:</label>
              <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="Enter your first name"
                  required
              />
          </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password2">Confirm Password:</label>
          <input
            type="password"
            id="password2"
            name="password2"
            value={formData.password2}
            onChange={handleChange}
            placeholder="Re-enter your password"
            required
          />
        </div>
        <button type="submit" className="button" disabled={isLoading}>
          {isLoading ? (
            <span className="button-loading">
              <Loader2 className="animate-spin mr-2" size={16} />
              Signing Up...
            </span>
          ) : (
            'Sign Up'
          )}
        </button>
      </form>
    </div>
  );
};

export default SignupPage;