import React, { useState, useEffect } from 'react';
import { Shield, Copy, Check, AlertCircle, Smartphone, Key } from 'lucide-react';
import QRCode from 'qrcode';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface MFASetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

interface MFAEnrollResponse {
  id: string;
  type: string;
  totp: {
    qr_code: string;
    secret: string;
    uri: string;
  };
}

export const MFASetup: React.FC<MFASetupProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<'enroll' | 'verify' | 'complete'>('enroll');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [factorId, setFactorId] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [secretCopied, setSecretCopied] = useState<boolean>(false);

  useEffect(() => {
    if (step === 'enroll') {
      enrollMFA();
    }
  }, [step]);

  const enrollMFA = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'TradeTrackr Authenticator'
      });

      if (error) throw error;

      const enrollData = data as MFAEnrollResponse;
      setFactorId(enrollData.id);
      setSecret(enrollData.totp.secret);
      
      // Generate QR code from the URI
      const qrDataUrl = await QRCode.toDataURL(enrollData.totp.uri, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeUrl(qrDataUrl);
      setStep('verify');
    } catch (err: any) {
      setError(err.message || 'Failed to enroll MFA');
      toast.error('Failed to setup MFA. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyMFA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verificationCode
      });

      if (error) throw error;

      setStep('complete');
      toast.success('MFA has been successfully enabled!');
      
      // Update user profile to reflect MFA is enabled
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ two_factor_enabled: true })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (updateError) {
        console.error('Failed to update profile:', updateError);
      }

      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
      toast.error('Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setSecretCopied(true);
      toast.success('Secret key copied to clipboard');
      setTimeout(() => setSecretCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy secret key');
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(value);
    setError('');
  };

  if (step === 'enroll' && isLoading) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Setting up MFA</h3>
          <p className="text-gray-600">Please wait while we prepare your authenticator setup...</p>
        </div>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Setup Two-Factor Authentication</h3>
          <p className="text-gray-600">Scan the QR code with your authenticator app</p>
        </div>

        <div className="space-y-6">
          {/* QR Code */}
          <div className="text-center">
            <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
              <img src={qrCodeUrl} alt="MFA QR Code" className="w-48 h-48" />
            </div>
          </div>

          {/* Manual Entry */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Manual Entry Key:</span>
              <button
                onClick={copySecret}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {secretCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{secretCopied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <code className="text-sm bg-white p-2 rounded border block break-all">{secret}</code>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <Smartphone className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Recommended Apps:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Google Authenticator</li>
                  <li>• Microsoft Authenticator</li>
                  <li>• Authy</li>
                  <li>• 1Password</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Verification */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter the 6-digit code from your authenticator app:
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={handleCodeChange}
              placeholder="000000"
              className="w-full input-touch text-center text-2xl font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={6}
            />
            {error && (
              <div className="flex items-center space-x-2 mt-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 btn-touch text-responsive-base text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={verifyMFA}
              disabled={isLoading || verificationCode.length !== 6}
              className="flex-1 btn-touch text-responsive-base bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Verifying...' : 'Verify & Enable'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">MFA Successfully Enabled!</h3>
          <p className="text-gray-600 mb-6">
            Your account is now protected with two-factor authentication. You'll need to enter a code from your authenticator app when signing in.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Key className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h4 className="font-medium text-yellow-900 mb-1">Important:</h4>
                <p className="text-sm text-yellow-800">
                  Make sure to save your authenticator app setup. If you lose access to your device, you may need to contact support to regain access to your account.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default MFASetup;