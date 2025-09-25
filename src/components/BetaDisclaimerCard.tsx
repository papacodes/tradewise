import React, { useState, useEffect } from 'react';
import { TestTube, X, MessageCircle } from 'lucide-react';

const BetaDisclaimerCard: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem('beta-disclaimer-dismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('beta-disclaimer-dismissed', 'true');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-blue-900/50 border border-blue-700 rounded-lg p-4 mb-6 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-blue-300 hover:text-white transition-colors"
        aria-label="Dismiss beta notice"
      >
        <X size={18} />
      </button>
      
      <div className="flex items-start gap-3 pr-8">
        <div className="flex-shrink-0">
          <TestTube className="w-6 h-6 text-blue-400" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-white font-semibold text-lg mb-2">
            Public Beta Version
          </h3>
          
          <p className="text-blue-100 text-sm leading-relaxed mb-3">
            Welcome to TradeTrackr's public beta! You're experiencing our latest features as we continue to improve the platform. 
            While we've tested extensively, you may encounter occasional bugs or unexpected behavior.
          </p>
          
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1 text-blue-300">
              <MessageCircle size={14} />
              <span>Found a bug? We'd love your feedback!</span>
            </div>
            <span className="text-blue-400 font-medium">
              Thank you for helping us test &#38; improve TradeTrackr
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BetaDisclaimerCard;