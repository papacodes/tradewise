import React, { useState, useEffect } from 'react';
import { Shield, AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface MFAVerificationProps {
  factorId: string;
  email: string;
  password: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const MFAVerification: React.FC<MFAVerificationProps> = ({ factorId, email, onSuccess, onCancel }) => {
  // Suppress unused parameter warning
  void email;
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  // Remove unused state
  const [selectedFactorId, setSelectedFactorId] = useState<string>('');
  const [challengeId, setChallengeId] = useState<string>('');
  const [attemptsLeft, setAttemptsLeft] = useState<number>(3);

  useEffect(() => {
    loadMFAFactors();
  }, []);

  const loadMFAFactors = async () => {
    try {
      // Use the provided factorId directly
      setSelectedFactorId(factorId);
      await createChallenge(factorId);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const createChallenge = async (factorId: string) => {
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factorId
      });
      
      if (challengeError) throw challengeError;
      if (challenge) {
        setChallengeId(challenge.id);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const verifyMFA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    if (!challengeId) {
      setError('MFA challenge not initialized');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId: factorId,
        challengeId,
        code: verificationCode
      });

      if (error) throw error;

      toast.success('Successfully verified!');
      onSuccess();
    } catch (err: any) {
      const newAttemptsLeft = attemptsLeft - 1;
      setAttemptsLeft(newAttemptsLeft);
      
      if (newAttemptsLeft <= 0) {
        setError('Too many failed attempts. Please try again later.');
        toast.error('Account temporarily locked due to too many failed attempts');
      } else {
        setError(`Invalid verification code. ${newAttemptsLeft} attempts remaining.`);
        toast.error('Invalid verification code');
      }
      
      setVerificationCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(value);
    setError('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && verificationCode.length === 6 && !isLoading) {
      verifyMFA();
    }
  };

  const resendChallenge = async () => {
    if (selectedFactorId) {
      await createChallenge(selectedFactorId);
      toast.success('New verification code requested');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Two-Factor Authentication</h3>
        <p className="text-gray-600">
          {email && (
            <span className="block mb-2 font-medium">{email}</span>
          )}
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      <div className="space-y-6">
        {/* Verification Code Input */}
        <div>
          <input
            type="text"
            value={verificationCode}
            onChange={handleCodeChange}
            onKeyPress={handleKeyPress}
            placeholder="000000"
            className="w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={6}
            disabled={isLoading || attemptsLeft <= 0}
            autoFocus
          />
          
          {error && (
            <div className="flex items-center space-x-2 mt-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          {attemptsLeft < 3 && attemptsLeft > 0 && (
            <div className="mt-2 text-sm text-yellow-600">
              {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={verifyMFA}
            disabled={isLoading || verificationCode.length !== 6 || attemptsLeft <= 0}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
          >
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </button>
          
          <div className="flex justify-between items-center text-sm">
            <button
              onClick={resendChallenge}
              disabled={isLoading}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Request new code
            </button>
            
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-700 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to login</span>
            </button>
          </div>
        </div>

        {/* Help Text */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Having trouble?</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Make sure your device's time is synchronized</li>
            <li>• Try refreshing your authenticator app</li>
            <li>• Check that you're using the correct account</li>
            <li>• Contact support if you've lost access to your device</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MFAVerification;