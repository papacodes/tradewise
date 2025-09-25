import { useState } from 'react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, BarChart3, Shield, Zap, ArrowRight, Menu, X } from 'lucide-react';
// import { useAuth } from '../hooks/useAuth'; // Commented out as not currently used
import { initializeCacheManagement } from '../utils/cacheManager';
import { clearAllCache } from '../hooks/useSupabaseCache';

export const Landing = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // const { user } = useAuth(); // Commented out as not currently used

  // Clear caches when landing on the page (but don't force signout)
  useEffect(() => {
    document.title = 'TradeWise - Trading Platform';
    
    const initializeCleanState = async () => {
      try {
        console.log('🎯 Landing page: Initializing clean cache state...');
        
        // Clear in-memory cache for fresh start
        clearAllCache();
        
        // Initialize comprehensive cache management (clears browser storage in dev mode)
        await initializeCacheManagement();
        
        console.log('✅ Landing page initialized with clean cache state');
      } catch (error) {
        console.error('❌ Error during landing page cache initialization:', error);
      }
    };

    initializeCleanState();
  }, []); // Remove user and signOut dependencies to avoid unnecessary re-runs

  return (
    <div className="min-h-screen bg-[#121417] text-white">
      {/* Header */}
      <header className="border-b border-gray-700 px-10 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-lg font-bold">TradeWise</span>
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
            <div className="fixed top-0 right-0 h-full w-64 bg-gray-900 border-l border-gray-800 z-50 transform transition-transform duration-300 ease-in-out">
              <div className="flex items-center justify-between p-4 border-b border-gray-800">
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
                  className="text-gray-300 hover:text-white transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/features"
                  className="text-gray-300 hover:text-white transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link
                  to="/pricing"
                  className="text-gray-300 hover:text-white transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link
                  to="/support"
                  className="text-gray-300 hover:text-white transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Support
                </Link>
                <div className="pt-4 border-t border-gray-800">
                  <Link
                    to="/login"
                    className="block text-gray-300 hover:text-white transition-colors py-2 mb-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    className="block bg-[#1273d4] hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="px-10 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Master Your Trading Journey with
              <span className="text-blue-400"> TradeWise</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Track your trades, analyze performance, and improve your trading strategy with our comprehensive trading journal platform.
            </p>
            <div className="flex items-center justify-center gap-4 mb-16">
              <Link
                to="/register"
                className="bg-[#1273d4] hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-lg transition-colors flex items-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="border border-gray-600 hover:border-gray-500 text-white font-medium py-4 px-8 rounded-lg transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-10 py-20 bg-[#1a1d23]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">
              Everything you need to improve your trading
            </h2>
            <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto">
              Our platform provides comprehensive tools to track, analyze, and optimize your trading performance.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="bg-blue-500/10 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Performance Analytics</h3>
                <p className="text-gray-400">
                  Comprehensive analytics and insights to track your trading performance with detailed charts and metrics.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="bg-green-500/10 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Trade Analysis</h3>
                <p className="text-gray-400">
                  Deep dive into your trades with confluence tracking, mistake analysis, and performance patterns.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="bg-purple-500/10 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Secure Data Storage</h3>
                <p className="text-gray-400">
                  Your trading data is securely stored and protected with enterprise-grade security measures.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-10 py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              Ready to transform your trading?
            </h2>
            <p className="text-gray-400 mb-8">
              Join thousands of traders who are already using TradeWise to improve their performance.
            </p>
            <Link
              to="/register"
              className="bg-[#1273d4] hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              Start Your Free Trial
              <Zap className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

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
};