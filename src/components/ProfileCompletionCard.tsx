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
  if (!userProfile?.phone_number) missingFields.push('Phone');
  if (!userProfile?.date_of_birth) missingFields.push('Date of Birth');

  const totalFields = 4;
  const completedFields = totalFields - missingFields.length;
  const completionPercentage = Math.round((completedFields / totalFields) * 100);

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-700 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2 leading-tight">
              Complete Your Profile
            </h3>
            <p className="text-sm sm:text-base text-gray-400 mb-3 sm:mb-4 leading-relaxed">
              Complete your profile to unlock all features and improve your trading experience. Missing information may limit some functionality.
            </p>
            <div className="mb-4">
              <div className="text-xs sm:text-sm text-gray-400 mb-2">
                Missing fields: {missingFields.join(', ')}
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {completionPercentage}% complete
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-start space-x-2 w-full sm:w-auto">
          <button
            onClick={handleCompleteClick}
            className="flex items-center justify-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 rounded-lg transition-colors duration-200 font-medium flex-1 sm:flex-none btn-touch text-responsive-base"
          >
            <span>Complete Profile</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center justify-center touch-target"
            title="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionCard;