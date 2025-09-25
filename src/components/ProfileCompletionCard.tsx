import React, { useState, useEffect } from 'react';
import { User, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../types/user';

interface ProfileCompletionCardProps {
  userProfile?: UserProfile;
  onCompleteClick?: () => void;
}

const STORAGE_KEY = 'profile-completion-card-dismissed';

export const ProfileCompletionCard: React.FC<ProfileCompletionCardProps> = ({ 
  userProfile, 
  onCompleteClick 
}) => {
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    setIsDismissed(dismissed === 'true');
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsDismissed(true);
  };

  const handleCompleteClick = () => {
    if (onCompleteClick) {
      onCompleteClick();
    } else {
      navigate('/profile?tab=personal');
    }
  };

  // Check if profile is incomplete
  const isProfileIncomplete = !userProfile?.first_name || 
                             !userProfile?.last_name || 
                             !userProfile?.phone_number || 
                             !userProfile?.date_of_birth;

  // Don't show if dismissed or profile is complete
  if (isDismissed || !isProfileIncomplete) {
    return null;
  }

  const missingFields = [];
  if (!userProfile?.first_name) missingFields.push('First Name');
  if (!userProfile?.last_name) missingFields.push('Last Name');
  if (!userProfile?.phone_number) missingFields.push('Phone Number');
  if (!userProfile?.date_of_birth) missingFields.push('Date of Birth');

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">
              Complete Your Profile
            </h3>
            <p className="text-gray-400 mb-3">
              Help us provide you with a better trading experience by completing your profile information.
            </p>
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Missing information:</p>
              <div className="flex flex-wrap gap-2">
                {missingFields.map((field) => (
                  <span 
                    key={field}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900 text-yellow-300"
                  >
                    {field}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCompleteClick}
                className="flex items-center space-x-2 bg-[#1273d4] hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
              >
                <span>Complete Profile</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-300 text-sm font-medium transition-colors duration-200"
              >
                Remind me later
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-300 transition-colors duration-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ProfileCompletionCard;