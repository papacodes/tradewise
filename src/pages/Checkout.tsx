import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { TrendingUp, Check, ArrowLeft, CreditCard, Shield } from 'lucide-react';
import { toast } from 'sonner';

export const Checkout = React.memo(() => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const plan = searchParams.get('plan');
  
  useEffect(() => {
    document.title = 'Checkout - TradeTrackr';
    
    // Redirect if not authenticated
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);
  
  // Plan details
  const planDetails = {
    professional: {
      name: 'Professional',
      price: '$19',
      period: 'per month',
      description: 'For serious traders who need comprehensive analytics',
      features: [
        'Unlimited trades',
        'Advanced analytics & insights',
        'Up to 5 trading accounts',
        'Confluence & mistake tracking',
        'Priority email support',
        'Export data (CSV, PDF)',
        'Custom performance reports'
      ]
    },
    enterprise: {
      name: 'Enterprise',
      price: '$99',
      period: 'per month',
      description: 'For trading firms and professional money managers',
      features: [
        'Everything in Professional',
        'Unlimited trading accounts',
        'Team collaboration tools',
        'API access & integrations',
        'Dedicated account manager',
        'Custom branding',
        'Advanced security features',
        'SLA guarantee',
        'Phone & chat support'
      ]
    }
  };
  
  const selectedPlan = plan && planDetails[plan as keyof typeof planDetails];
  
  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    
    setIsProcessing(true);
    
    try {
      // TODO: Integrate with Stripe or payment processor
      // For now, simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Successfully subscribed to ${selectedPlan.name} plan!`);
      navigate('/dashboard');
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to process subscription. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#121417] flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }
  
  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-[#121417] text-white">
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Invalid Plan</h1>
          <p className="text-gray-400 mb-8">The selected plan is not available.</p>
          <Link
            to="/pricing"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Pricing
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#121417] text-white">
      {/* Header */}
      <header className="border-b border-gray-700 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <TrendingUp className="w-6 h-6 text-blue-500" />
            <span className="text-xl font-bold">TradeTrackr</span>
          </div>
          <Link
            to="/dashboard"
            className="text-sm font-medium hover:text-blue-400 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </header>
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Pricing
          </Link>
          <h1 className="text-3xl font-bold mb-2">Complete Your Subscription</h1>
          <p className="text-gray-400">Upgrade to unlock advanced trading analytics</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Plan Summary */}
          <div className="bg-[#1a1d23] rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-bold mb-4">Plan Summary</h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-400">{selectedPlan.name}</h3>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold">{selectedPlan.price}</span>
                <span className="text-gray-400">/{selectedPlan.period}</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">{selectedPlan.description}</p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">What's included:</h4>
              {selectedPlan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Shield className="w-4 h-4" />
                <span>14-day free trial • Cancel anytime</span>
              </div>
            </div>
          </div>
          
          {/* Payment Form */}
          <div className="bg-[#1a1d23] rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-bold mb-6">Payment Information</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white disabled:opacity-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-3 py-2 pl-10 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  />
                  <CreditCard className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Expiry</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">CVC</label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
            
            <button
              onClick={handleSubscribe}
              disabled={isProcessing}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                `Start ${selectedPlan.name} Trial`
              )}
            </button>
            
            <p className="text-xs text-gray-400 text-center mt-4">
              By subscribing, you agree to our Terms of Service and Privacy Policy.
              Your trial starts today and you won't be charged until the trial period ends.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Checkout;