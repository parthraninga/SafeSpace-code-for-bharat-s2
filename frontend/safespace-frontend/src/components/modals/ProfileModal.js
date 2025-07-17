import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UserCircleIcon, 
  KeyIcon,
  MapPinIcon,
  CameraIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import Modal from '../ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { uploadProfilePicture, changePassword } from '../../utils/api';
import toast from 'react-hot-toast';

const ProfileModal = ({ isOpen, onClose, initialTab = 'profile' }) => {
  const { user, updateProfile, checkAuthStatus } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  

  console.log("user: ", user); 

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    age: '',
    gender: '',
    bloodGroup: '',
    hobbies: [],
    bio: '',
    location: '',
    preferredCities: [],
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    avatar: null
  });

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || '',
        age: user.age || '',
        gender: user.gender || '',
        bloodGroup: user.bloodGroup || '',
        hobbies: user.hobbies || [],
        bio: user.bio || '',
        location: user.location || '',
        preferredCities: user.preferredCities || [],
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        avatar: user.profilePic?.url || user.avatar || null
      });
    }
  }, [user]);

  // Update active tab when initialTab prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Reset password fields when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      setShowCurrentPassword(false);
      setShowNewPassword(false);
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: typeof value === 'string' ? value.split(',').map(item => item.trim()).filter(item => item) : value
    }));
  };



  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPEG, PNG, or GIF)');
        return;
      }

      // Validate file size (1MB limit)
      if (file.size > 1024 * 1024) {
        toast.error('File size must be less than 1MB');
        return;
      }

      try {
        setLoading(true);
        
        // Show preview immediately
        const reader = new FileReader();
        reader.onload = (e) => {
          setFormData(prev => ({
            ...prev,
            avatar: e.target.result
          }));
        };
        reader.readAsDataURL(file);

        // Upload to Cloudinary
        console.log('Attempting upload for user:', user.id || user._id, 'User object:', user);
        const uploadResult = await uploadProfilePicture(user.id || user._id, file);
        
        console.log('Upload result:', uploadResult);
        
        if (uploadResult.success) {
          // Update form data with uploaded image URL
          setFormData(prev => ({
            ...prev,
            avatar: uploadResult.data.secure_url
          }));
          
          toast.success('Profile picture uploaded successfully!');
          
          // Refresh user data to get updated profile picture
          await checkAuthStatus();
        } else {
          console.error('Upload failed:', uploadResult.message);
          
          // Provide more specific error messages
          if (uploadResult.message?.includes('token') || uploadResult.message?.includes('Unauthorized')) {
            toast.error('Session expired. Please log in again.');
            // Force re-authentication
            await checkAuthStatus();
          } else if (uploadResult.message?.includes('Forbidden')) {
            toast.error('You can only upload your own profile picture.');
          } else if (uploadResult.message?.includes('File size')) {
            toast.error('File size must be less than 1MB.');
          } else if (uploadResult.message?.includes('file type')) {
            toast.error('Please upload a valid image file (JPEG, PNG, or GIF).');
          } else {
            toast.error(uploadResult.message || 'Failed to upload profile picture');
          }
          
          // Reset avatar on failure
          setFormData(prev => ({
            ...prev,
            avatar: user.profilePic?.url || user.avatar || null
          }));
        }
      } catch (error) {
        console.error('Avatar upload error:', error);
        
        // Handle different types of errors
        if (error.response?.status === 401) {
          toast.error('Session expired. Please log in again.');
          await checkAuthStatus();
        } else if (error.response?.status === 403) {
          toast.error('You don\'t have permission to upload this file.');
        } else if (error.response?.status === 413) {
          toast.error('File too large. Please select a smaller image.');
        } else {
          toast.error('Failed to upload profile picture. Please try again.');
        }
        
        // Reset avatar on failure
        setFormData(prev => ({
          ...prev,
          avatar: user.profilePic?.url || user.avatar || null
        }));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const updateData = {
        name: formData.name,
        mobile: formData.mobile,
        age: parseInt(formData.age) || undefined,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        hobbies: formData.hobbies,
        bio: formData.bio,
        location: formData.location,
        preferredCities: formData.preferredCities
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined || updateData[key] === '') {
          delete updateData[key];
        }
      });

      const result = await updateProfile(updateData);
      console.log('Profile updated result:', result);
      if (result.success) {
        toast.success('Profile updated successfully!');
        onClose();
      } else {
        toast.error(result.message || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    
    try {
      const result = await changePassword(formData.currentPassword, formData.newPassword);
      
      if (result.success) {
        toast.success('Password changed successfully!');
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        toast.error(result.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserCircleIcon },
    { id: 'security', label: 'Security', icon: KeyIcon },
    { id: 'preferences', label: 'Preferences', icon: MapPinIcon }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Account Settings"
      size="lg"
    >
      <div className="flex flex-col md:flex-row min-h-[500px]">
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-gray-50 dark:bg-gray-800 p-4 space-y-2 md:min-h-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors
                  ${activeTab === tab.id
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{tab.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                    {formData.avatar ? (
                      <img 
                        src={formData.avatar} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserCircleIcon className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-primary-600 rounded-full p-2 cursor-pointer hover:bg-primary-700 transition-colors">
                    <CameraIcon className="w-4 h-4 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      disabled={loading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    placeholder="Enter your mobile number"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    min="1"
                    max="120"
                    placeholder="Enter your age"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Blood Group
                  </label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hobbies
                  </label>
                  <input
                    type="text"
                    name="hobbies"
                    value={Array.isArray(formData.hobbies) ? formData.hobbies.join(', ') : formData.hobbies}
                    onChange={(e) => handleArrayInputChange('hobbies', e.target.value)}
                    placeholder="Enter hobbies separated by commas"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Separate multiple hobbies with commas
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Preferred Cities
                  </label>
                  <input
                    type="text"
                    name="preferredCities"
                    value={Array.isArray(formData.preferredCities) ? formData.preferredCities.join(', ') : formData.preferredCities}
                    onChange={(e) => handleArrayInputChange('preferredCities', e.target.value)}
                    placeholder="Enter preferred cities separated by commas"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Separate multiple cities with commas
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Enter your city or location"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Tell us about yourself..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex justify-end">
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </motion.button>
              </div>
            </form>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Change Password
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? 'Changing...' : 'Change Password'}
                  </motion.button>
                </div>
              </div>
            </form>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Preferences
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Preference settings coming soon...
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ProfileModal;
