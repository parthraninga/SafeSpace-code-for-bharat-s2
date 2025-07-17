import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useForm } from 'react-hook-form';
import OTPForm from './OTPForm';

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('email'); // 'email', 'mobile', 'email-otp', 'mobile-otp'
  const [showOTPForm, setShowOTPForm] = useState(false);
  const [otpData, setOtpData] = useState({ type: '', identifier: '' });
  
  const { 
    login, 
    loginWithMobile, 
    sendEmailOTP, 
    sendMobileOTP, 
    isLoading 
  } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: errorsEmail },
  } = useForm();

  const {
    register: registerMobile,
    handleSubmit: handleSubmitMobile,
    formState: { errors: errorsMobile },
  } = useForm();

  const {
    register: registerEmailOTP,
    handleSubmit: handleSubmitEmailOTP,
    formState: { errors: errorsEmailOTP },
  } = useForm();

  const {
    register: registerMobileOTP,
    handleSubmit: handleSubmitMobileOTP,
    formState: { errors: errorsMobileOTP },
  } = useForm();

  const onSubmitEmail = async (data) => {
    const result = await login(data.email, data.password);
    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  const onSubmitMobile = async (data) => {
    const result = await loginWithMobile(data.mobile, data.password);
    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  const onSubmitEmailOTP = async (data) => {
    const result = await sendEmailOTP(data.email);
    if (result.success) {
      setOtpData({ type: 'email', identifier: data.email });
      setShowOTPForm(true);
    }
  };

  const onSubmitMobileOTP = async (data) => {
    const result = await sendMobileOTP(data.mobile);
    if (result.success) {
      setOtpData({ type: 'mobile', identifier: data.mobile });
      setShowOTPForm(true);
    }
  };

  const handleOTPSuccess = () => {
    navigate(from, { replace: true });
  };

  const handleOTPBack = () => {
    setShowOTPForm(false);
    setOtpData({ type: '', identifier: '' });
  };

  const handleGoogleLogin = () => {
    // Redirect to Google OAuth
    window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/auth/google`;
  };

  if (showOTPForm) {
    return (
      <OTPForm
        type={otpData.type}
        identifier={otpData.identifier}
        onBack={handleOTPBack}
        onSuccess={handleOTPSuccess}
      />
    );
  }

  const tabs = [
    { id: 'email', label: 'Email + Password', icon: '📧' },
    { id: 'mobile', label: 'Mobile + Password', icon: '📱' },
    { id: 'email-otp', label: 'Email + OTP', icon: '🔐' },
    { id: 'mobile-otp', label: 'Mobile + OTP', icon: '💬' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        <div>
          <motion.div
            className="mx-auto h-12 w-12 bg-primary-600 dark:bg-primary-500 rounded-xl flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-white font-bold text-xl">🛡️</span>
          </motion.div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Welcome back to SafeSpace
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
            Your AI-powered safety companion for Indian cities
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <motion.div
          className="mt-8 space-y-6 glass-morphism bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg p-8 rounded-2xl border border-white/20 dark:border-gray-700/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <AnimatePresence mode="wait">
            {/* Email + Password Form */}
            {activeTab === 'email' && (
              <motion.form
                key="email-form"
                onSubmit={handleSubmitEmail(onSubmitEmail)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email address
                  </label>
                  <input
                    {...registerEmail('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    type="email"
                    autoComplete="email"
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                    placeholder="Enter your email"
                  />
                  {errorsEmail.email && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errorsEmail.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      {...registerEmail('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters',
                        },
                      })}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errorsEmail.password && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errorsEmail.password.message}</p>
                  )}
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </motion.button>
              </motion.form>
            )}

            {/* Mobile + Password Form */}
            {activeTab === 'mobile' && (
              <motion.form
                key="mobile-form"
                onSubmit={handleSubmitMobile(onSubmitMobile)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mobile Number
                  </label>
                  <input
                    {...registerMobile('mobile', {
                      required: 'Mobile number is required',
                      pattern: {
                        value: /^[6-9]\d{9}$/,
                        message: 'Invalid mobile number',
                      },
                    })}
                    type="tel"
                    autoComplete="tel"
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                    placeholder="Enter your mobile number"
                  />
                  {errorsMobile.mobile && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errorsMobile.mobile.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      {...registerMobile('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters',
                        },
                      })}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errorsMobile.password && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errorsMobile.password.message}</p>
                  )}
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </motion.button>
              </motion.form>
            )}

            {/* Email + OTP Form */}
            {activeTab === 'email-otp' && (
              <motion.form
                key="email-otp-form"
                onSubmit={handleSubmitEmailOTP(onSubmitEmailOTP)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email address
                  </label>
                  <input
                    {...registerEmailOTP('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    type="email"
                    autoComplete="email"
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                    placeholder="Enter your email"
                  />
                  {errorsEmailOTP.email && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errorsEmailOTP.email.message}</p>
                  )}
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? 'Sending OTP...' : 'Send OTP'}
                </motion.button>
              </motion.form>
            )}

            {/* Mobile + OTP Form */}
            {activeTab === 'mobile-otp' && (
              <motion.form
                key="mobile-otp-form"
                onSubmit={handleSubmitMobileOTP(onSubmitMobileOTP)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mobile Number
                  </label>
                  <input
                    {...registerMobileOTP('mobile', {
                      required: 'Mobile number is required',
                      pattern: {
                        value: /^[6-9]\d{9}$/,
                        message: 'Invalid mobile number',
                      },
                    })}
                    type="tel"
                    autoComplete="tel"
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                    placeholder="Enter your mobile number"
                  />
                  {errorsMobileOTP.mobile && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errorsMobileOTP.mobile.message}</p>
                  )}
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? 'Sending OTP...' : 'Send OTP'}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Additional Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500"
              >
                Forgot your password?
              </Link>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with</span>
              </div>
            </div>

            <motion.button
              type="button"
              onClick={handleGoogleLogin}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </motion.button>

            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginForm;
