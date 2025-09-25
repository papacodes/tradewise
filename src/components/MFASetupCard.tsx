import React from 'react';
import { Shield, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MFASetupCardProps {
  onSetupClick?: () => void;
}

export const MFASetupCard: React.FC<MFASetupCardProps> = ({ onSetupClick }) => {
  const navigate = useNavigate();

  const handleSetupClick = () => {
    if (onSetupClick) {
      onSetupClick();
    } else {
      navigate('/profile?tab=security');
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">
              Secure Your Account with Two-Factor Authentication
            </h3>
            <p className="text-gray-400 mb-4">
              Add an extra layer of security to your trading account. Enable MFA to protect your investments and personal data from unauthorized access.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-300">
                Enhanced Security
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-300">
                Industry Standard
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900 text-purple-300">
                Quick Setup
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={handleSetupClick}
          className="flex items-center space-x-2 bg-[#1273d4] hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
        >
          <span>Enable MFA</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-600">
        <p className="text-sm text-gray-400">
          <strong>Recommended:</strong> Use authenticator apps like Google Authenticator, Microsoft Authenticator, or Authy for the best security.
        </p>
      </div>
    </div>
  );
};

export default MFASetupCard;