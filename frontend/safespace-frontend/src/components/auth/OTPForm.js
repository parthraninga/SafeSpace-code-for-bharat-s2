import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const OTPForm = ({ 
  type = 'email', // 'email' or 'mobile'
  identifier, // email address or mobile number
  onBack,
  onSuccess 
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const { loginWithEmailOTP, loginWithMobileOTP, sendEmailOTP, sendMobileOTP, isLoading } = useAuth();

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const handleOtpChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      return;
    }

    const result = type === 'email' 
      ? await loginWithEmailOTP(identifier, otpString)
      : await loginWithMobileOTP(identifier, otpString);

    if (result.success) {
      onSuccess();
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    const result = type === 'email' 
      ? await sendEmailOTP(identifier)
      : await sendMobileOTP(identifier);

    if (result.success) {
      setTimeLeft(300);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
            <span className="text-white font-bold text-xl">🔐</span>
          </motion.div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Verify OTP
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter the 6-digit code sent to{' '}
            <span className="font-medium text-primary-600 dark:text-primary-400">
              {type === 'email' ? identifier : `+91-${identifier}`}
            </span>
          </p>
        </div>

        <motion.form
          className="mt-8 space-y-6"
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div>
            <div className="flex justify-center space-x-3 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  maxLength={1}
                />
              ))}
            </div>

            <div className="text-center mb-4">
              {timeLeft > 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Code expires in <span className="font-medium text-red-500">{formatTime(timeLeft)}</span>
                </p>
              ) : (
                <p className="text-sm text-red-500">Code has expired</p>
              )}
            </div>

            <div className="flex space-x-3">
              <motion.button
                type="button"
                onClick={onBack}
                className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Back
              </motion.button>

              <motion.button
                type="submit"
                disabled={isLoading || otp.join('').length !== 6}
                className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? 'Verifying...' : 'Verify'}
              </motion.button>
            </div>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={!canResend || isLoading}
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {canResend ? 'Resend Code' : 'Resend available after expiry'}
              </button>
            </div>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default OTPForm;
