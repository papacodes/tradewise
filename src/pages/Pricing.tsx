import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  TrendingUp, 
  Check, 
  X, 
  Star,
  ArrowRight,
  Zap,
  Crown,
  Users,
  Menu
} from 'lucide-react';

export const Pricing = React.memo(() => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    document.title = 'Pricing - TradeTrackr';
  }, []);

  const plans = useMemo(() => [
    {
      name: "Starter",
      price: "Free",
      period: "Forever",
      description: "Perfect for beginners getting started with trade journaling",
      icon: <Users className="w-6 h-6 text-green-400" />,
      features: [
        { name: "Up to 50 trades per month", included: true },
        { name: "Basic analytics dashboard", included: true },
        { name: "1 trading account", included: true },
        { name: "Basic trade logging", included: true },
        { name: "Email support", included: true },
        { name: "Advanced analytics", included: false },
        { name: "Unlimited trades", included: false },
        { name: "Multiple accounts", included: false },
        { name: "Priority support", included: false }
      ],
      cta: user ? "Current Plan" : "Get Started Free",
      popular: false,
      ctaLink: user ? "/dashboard" : "/register"
    },
    {
      name: "Professional",
      price: "$19",
      period: "per month",
      description: "For serious traders who need comprehensive analytics",
      icon: <Zap className="w-6 h-6 text-blue-400" />,
      features: [
        { name: "Unlimited trades", included: true },
        { name: "Advanced analytics & insights", included: true },
        { name: "Up to 5 trading accounts", included: true },
        { name: "Confluence & mistake tracking", included: true },
        { name: "Priority email support", included: true },
        { name: "Export data (CSV, PDF)", included: true },
        { name: "Custom performance reports", included: true },
        { name: "API access", included: false },
        { name: "White-label solution", included: false }
      ],
      cta: user ? "Upgrade Now" : "Start Free Trial",
      popular: true,
      ctaLink: user ? "/checkout?plan=professional" : "/register"
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "per month",
      description: "For trading firms and professional money managers",
      icon: <Crown className="w-6 h-6 text-purple-400" />,
      features: [
        { name: "Everything in Professional", included: true },
        { name: "Unlimited trading accounts", included: true },
        { name: "Team collaboration tools", included: true },
        { name: "API access & integrations", included: true },
        { name: "Dedicated account manager", included: true },
        { name: "Custom branding", included: true },
        { name: "Advanced security features", included: true },
        { name: "SLA guarantee", included: true },
        { name: "Phone & chat support", included: true }
      ],
      cta: "Contact Sales",
      popular: false,
      ctaLink: "/support"
    }
  ], [user]);

  const handlePlanClick = useCallback((ctaLink: string) => {
    // This could be used for analytics tracking
    console.log('Plan clicked:', ctaLink);
  }, []);

  return (
    <div className="min-h-screen bg-[#121417] text-white">
      {/* Header */}
      <header className="border-b border-gray-700 px-10 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-lg font-bold">TradeTrackr</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <nav className="flex items-center gap-9">
              <Link to="/" className="text-sm font-medium hover:text-blue-400 transition-colors">
                Home
              </Link>
              <Link to="/features" className="text-sm font-medium hover:text-blue-400 transition-colors">
                Features
              </Link>
              <Link to="/pricing" className="text-sm font-medium text-blue-400">
                Pricing
              </Link>
              <Link to="/support" className="text-sm font-medium hover:text-blue-400 transition-colors">
                Support
              </Link>
            </nav>
            <div className="flex items-center gap-4">
              {user ? (
                <Link
                  to="/dashboard"
                  className="bg-[#1273d4] hover:bg-blue-600 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-medium hover:text-blue-400 transition-colors px-4 py-2"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    className="bg-[#1273d4] hover:bg-blue-600 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-gray-300 hover:text-white transition-colors"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="fixed top-0 right-0 h-full w-64 bg-[#1a1d23] border-l border-gray-700 z-50 transform transition-transform duration-300 ease-in-out">
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <span className="text-lg font-semibold text-white">Menu</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-300 hover:text-white transition-colors"
                  aria-label="Close mobile menu"
                >
                  <X size={24} />
                </button>
              </div>
              <nav className="flex flex-col p-4 space-y-4">
                <Link
                  to="/"
                  className="text-sm font-medium hover:text-blue-400 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/features"
                  className="text-sm font-medium hover:text-blue-400 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link
                  to="/pricing"
                  className="text-sm font-medium text-blue-400 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link
                  to="/support"
                  className="text-sm font-medium hover:text-blue-400 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Support
                </Link>
                <div className="pt-4 border-t border-gray-700">
                  {user ? (
                    <Link
                      to="/dashboard"
                      className="block bg-[#1273d4] hover:bg-blue-600 px-4 py-2 rounded-lg text-sm font-bold transition-colors text-center"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="block text-sm font-medium hover:text-blue-400 transition-colors py-2 mb-2"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Log In
                      </Link>
                      <Link
                        to="/register"
                        className="block bg-[#1273d4] hover:bg-blue-600 px-4 py-2 rounded-lg text-sm font-bold transition-colors text-center"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="px-10 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Simple, Transparent
            <span className="text-blue-400"> Pricing</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Choose the plan that fits your trading needs. Start free and upgrade as you grow.
          </p>
          <div className="inline-flex items-center gap-2 bg-[#1a1d23] px-4 py-2 rounded-full text-sm">
            <Star className="w-4 h-4 text-yellow-400" />
            <span>14-day free trial on all paid plans</span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-10 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div 
                key={index} 
                className={`relative bg-[#1a1d23] rounded-xl border ${
                  plan.popular 
                    ? 'border-blue-500 ring-2 ring-blue-500/20' 
                    : 'border-gray-700'
                } p-8 hover:border-gray-600 transition-colors`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center mb-4">
                    {plan.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.price !== "Free" && (
                      <span className="text-gray-400 ml-2">/{plan.period}</span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">{plan.description}</p>
                </div>

                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${
                        feature.included ? 'text-white' : 'text-gray-500'
                      }`}>
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  to={plan.ctaLink}
                  onClick={() => handlePlanClick(plan.ctaLink)}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-10 py-20 bg-[#1a1d23]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-3">Can I change plans anytime?</h3>
              <p className="text-gray-400 text-sm">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, 
                and we'll prorate any billing differences.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">Is there a free trial?</h3>
              <p className="text-gray-400 text-sm">
                Yes! All paid plans come with a 14-day free trial. No credit card required to start.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">What payment methods do you accept?</h3>
              <p className="text-gray-400 text-sm">
                We accept all major credit cards (Visa, MasterCard, American Express) and PayPal.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">Can I cancel anytime?</h3>
              <p className="text-gray-400 text-sm">
                Absolutely. You can cancel your subscription at any time with no cancellation fees. 
                Your data will remain accessible until the end of your billing period.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-10 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">
            Ready to start your trading journey?
          </h2>
          <p className="text-gray-300 text-lg mb-8">
          Join thousands of traders who trust TradeTrackr to improve their performance.
        </p>
          <Link
            to="/register"
            className="bg-[#1273d4] hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-lg transition-colors inline-flex items-center gap-2"
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-700 px-10 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span className="font-bold">TradeTrackr</span>
            </div>
            <div className="flex items-center gap-8">
              <Link to="/features" className="text-sm text-gray-400 hover:text-white transition-colors">
                Features
              </Link>
              <Link to="/pricing" className="text-sm text-gray-400 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link to="/support" className="text-sm text-gray-400 hover:text-white transition-colors">
                Support
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            © 2024 TradeTrackr. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
});