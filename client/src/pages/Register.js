import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  CheckCircle,
  X
} from 'lucide-react';
import { hasJoinApplication as dsHasJoinApplication } from '../utils/datastore';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasSpecial = /[@$!%*?&]/.test(password);
    return { minLength, hasNumber, hasLetter, hasUpper, hasLower, hasSpecial };
  };

  const passwordValidation = validatePassword(formData.password);
  const passwordsMatch = formData.password === formData.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!acceptTerms) {
      return;
    }

    if (!passwordsMatch) {
      return;
    }

    if (
      !passwordValidation.minLength ||
      !passwordValidation.hasNumber ||
      !passwordValidation.hasUpper ||
      !passwordValidation.hasLower ||
      !passwordValidation.hasSpecial ||
      (formData.lastName?.trim().length < 2)
    ) {
      return;
    }

    // Require prior join application matching first name, last name, and email
    const joined = dsHasJoinApplication({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
    });
    if (!joined) {
      toast.error("Please join first via 'Are you a victim? Join the DAO' and use the same name and email to sign up.");
      navigate('/join-notice');
      return;
    }

    setLoading(true);

    const result = await register({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      acceptTerms
    });
    
    if (result.success) {
      navigate('/dashboard');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-black/20"></div>
      
      {/* Background Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-purple-500/20 rounded-full animate-float"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-blue-500/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-yellow-500/20 rounded-full animate-float" style={{ animationDelay: '4s' }}></div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative max-w-md w-full space-y-8"
      >
        <div className="glass-effect rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">D</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Sign up</h2>
            <p className="text-gray-300">Create your DOA account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                  First name*
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="input-field pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-purple-500"
                    placeholder="First name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                  Last name*
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`input-field bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-purple-500 ${formData.lastName && formData.lastName.trim().length < 2 ? 'border-red-500' : ''}`}
                  placeholder="Last name"
                />
                {formData.lastName && formData.lastName.trim().length < 2 && (
                  <p className="mt-1 text-sm text-red-400">Last name must be at least 2 characters</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email*
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-purple-500"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password*
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-purple-500"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                  )}
                </button>
              </div>
              
              {/* Password Requirements */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <div className={`flex items-center space-x-2 text-sm ${passwordValidation.minLength ? 'text-green-400' : 'text-gray-400'}`}>
                    {passwordValidation.minLength ? <CheckCircle size={16} /> : <X size={16} />}
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`flex items-center space-x-2 text-sm ${passwordValidation.hasNumber ? 'text-green-400' : 'text-gray-400'}`}>
                    {passwordValidation.hasNumber ? <CheckCircle size={16} /> : <X size={16} />}
                    <span>Contains a number</span>
                  </div>
                  <div className={`flex items-center space-x-2 text-sm ${passwordValidation.hasUpper ? 'text-green-400' : 'text-gray-400'}`}>
                    {passwordValidation.hasUpper ? <CheckCircle size={16} /> : <X size={16} />}
                    <span>Contains an uppercase letter</span>
                  </div>
                  <div className={`flex items-center space-x-2 text-sm ${passwordValidation.hasLower ? 'text-green-400' : 'text-gray-400'}`}>
                    {passwordValidation.hasLower ? <CheckCircle size={16} /> : <X size={16} />}
                    <span>Contains a lowercase letter</span>
                  </div>
                  <div className={`flex items-center space-x-2 text-sm ${passwordValidation.hasSpecial ? 'text-green-400' : 'text-gray-400'}`}>
                    {passwordValidation.hasSpecial ? <CheckCircle size={16} /> : <X size={16} />}
                    <span>Contains a special character (@$!%*?&)</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Password confirmation*
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`input-field pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-purple-500 ${
                    formData.confirmPassword && !passwordsMatch ? 'border-red-500' : ''
                  }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                  )}
                </button>
              </div>
              {formData.confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-sm text-red-400">Passwords do not match</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                id="accept-terms"
                name="accept-terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="accept-terms" className="ml-2 block text-sm text-gray-300">
                I accept the{' '}
                <a href="#" className="text-purple-400 hover:text-purple-300">
                  Privacy policy
                </a>{' '}
                and{' '}
                <a href="#" className="text-purple-400 hover:text-purple-300">
                  Terms of use
                </a>
                *
              </label>
              {!acceptTerms && (
                <p className="ml-2 text-sm text-red-400">You must accept the terms to continue</p>
              )}
            </div>

            <button
              type="submit"
              disabled={
                loading ||
                !acceptTerms ||
                !passwordsMatch ||
                !passwordValidation.minLength ||
                !passwordValidation.hasNumber ||
                !passwordValidation.hasUpper ||
                !passwordValidation.hasLower ||
                !passwordValidation.hasSpecial ||
                (formData.lastName?.trim().length < 2)
              }
              className="w-full btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Creating account...</span>
                </div>
              ) : (
                'Sign up'
              )}
            </button>


          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-300">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-purple-400 hover:text-purple-300 transition-colors"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;