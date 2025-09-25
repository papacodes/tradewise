import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  BarChart3, 
  Shield, 
  Zap, 
  Target, 
  Calendar, 
  PieChart, 
  FileText,
  Users,
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export const Features = React.memo(() => {
  useEffect(() => {
    document.title = 'Features - TradeWise';
  }, []);

  const features = useMemo(() => [
    {
      icon: <BarChart3 className="w-8 h-8 text-blue-400" />,
      title: "Advanced Analytics",
      description: "Comprehensive performance tracking with detailed charts, profit/loss analysis, and win rate statistics.",
      benefits: ["Real-time P&L tracking", "Win/Loss ratio analysis", "Performance trends", "Risk metrics"]
    },
    {
      icon: <Target className="w-8 h-8 text-green-400" />,
      title: "Trade Journal",
      description: "Log every trade with detailed information including entry/exit points, strategy, and market conditions.",
      benefits: ["Detailed trade logging", "Strategy tracking", "Market condition notes", "Screenshot uploads"]
    },
    {
      icon: <PieChart className="w-8 h-8 text-purple-400" />,
      title: "Portfolio Management",
      description: "Manage multiple trading accounts and track performance across different strategies and timeframes.",
      benefits: ["Multiple account support", "Strategy comparison", "Asset allocation", "Risk distribution"]
    },
    {
      icon: <FileText className="w-8 h-8 text-orange-400" />,
      title: "Confluence Tracking",
      description: "Track what factors contributed to your successful trades and identify patterns in your decision-making.",
      benefits: ["Pattern recognition", "Success factors", "Decision analysis", "Improvement insights"]
    },
    {
      icon: <Calendar className="w-8 h-8 text-red-400" />,
      title: "Mistake Analysis",
      description: "Learn from your mistakes by categorizing and analyzing what went wrong in losing trades.",
      benefits: ["Error categorization", "Learning insights", "Improvement tracking", "Behavioral analysis"]
    },
    {
      icon: <Shield className="w-8 h-8 text-cyan-400" />,
      title: "Secure & Private",
      description: "Your trading data is encrypted and securely stored with enterprise-grade security measures.",
      benefits: ["End-to-end encryption", "Secure cloud storage", "Privacy protection", "Data backup"]
    }
  ], []);



  return (
    <div className="min-h-screen bg-[#121417] text-white">
      {/* Header */}
      <header className="border-b border-gray-700 px-10 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-lg font-bold">TradeWise</span>
          </div>
          <div className="flex items-center gap-8">
            <nav className="flex items-center gap-9">
              <Link to="/" className="text-sm font-medium hover:text-blue-400 transition-colors">
                Home
              </Link>
              <Link to="/features" className="text-sm font-medium text-blue-400">
                Features
              </Link>
              <Link to="/pricing" className="text-sm font-medium hover:text-blue-400 transition-colors">
                Pricing
              </Link>
              <Link to="/support" className="text-sm font-medium hover:text-blue-400 transition-colors">
                Support
              </Link>
            </nav>
            <div className="flex items-center gap-4">
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
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-10 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Powerful Features for
            <span className="text-blue-400"> Serious Traders</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Everything you need to track, analyze, and improve your trading performance in one comprehensive platform.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-10 py-20 bg-[#1a1d23]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-[#121417] p-8 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors">
                <div className="bg-gray-800/50 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-gray-400 mb-6">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="px-10 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">
            Built for Professional Traders
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold mb-6">Real-time Performance Tracking</h3>
              <p className="text-gray-400 mb-6">
                Monitor your trading performance in real-time with comprehensive dashboards that show your P&L, 
                win rates, and risk metrics across all your trading accounts.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <span>Real-time updates</span>
                </li>
                <li className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-green-400" />
                  <span>Multi-account support</span>
                </li>
                <li className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span>Lightning-fast performance</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-8 rounded-xl border border-gray-700">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">Performance Dashboard</h4>
                <p className="text-gray-400 text-sm">
                  Visualize your trading data with interactive charts and comprehensive analytics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-10 py-20 bg-[#1a1d23] text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">
            Ready to elevate your trading?
          </h2>
          <p className="text-gray-400 mb-8">
            Start using TradeWise today and take your trading performance to the next level.
          </p>
          <Link
            to="/register"
            className="bg-[#1273d4] hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-lg transition-colors inline-flex items-center gap-2"
          >
            Get Started Free
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
              <span className="font-bold">TradeWise</span>
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
            © 2024 TradeWise. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
});