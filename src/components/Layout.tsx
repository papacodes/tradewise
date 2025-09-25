import React, { useState, useCallback, memo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { User, TrendingUp, LogOut, X, Menu } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = memo(({ children }) => {
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = useCallback((path: string) => {
    return location.pathname === path;
  }, [location.pathname]);

  const handleShowLogoutModal = useCallback(() => {
    setShowLogoutModal(true);
  }, []);

  const handleHideLogoutModal = useCallback(() => {
    setShowLogoutModal(false);
  }, []);

  const handleLogout = useCallback(async () => {
    setShowLogoutModal(false);
    await signOut();
    navigate('/');
  }, [signOut, navigate]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-700 px-4 md:px-10 py-3">
        <div className="flex items-center gap-4">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          <h1 className="text-white text-lg font-bold">TradeWise</h1>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <nav className="flex items-center gap-9">
            <Link
              to="/dashboard"
              className={`text-sm font-medium transition-colors ${
                isActive('/dashboard')
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/trades"
              className={`text-sm font-medium transition-colors ${
                isActive('/trades')
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Trades
            </Link>
            <Link
              to="/analytics"
              className={`text-sm font-medium transition-colors ${
                isActive('/analytics')
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Analytics
            </Link>
            <Link
              to="/accounts"
              className={`text-sm font-medium transition-colors ${
                isActive('/accounts')
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Accounts
            </Link>
            <Link
              to="/profile"
              className={`text-sm font-medium transition-colors ${
                isActive('/profile')
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Profile
            </Link>
          </nav>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <button
                onClick={handleShowLogoutModal}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-md transition-colors border border-gray-600"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <button
            onClick={toggleMobileMenu}
            className="text-gray-300 hover:text-white transition-colors p-2"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={closeMobileMenu}>
          <div 
            className="fixed top-0 right-0 h-full w-64 bg-gray-800 border-l border-gray-700 transform transition-transform duration-300 ease-in-out z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-white text-lg font-semibold">Menu</h2>
              <button
                onClick={closeMobileMenu}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <nav className="flex flex-col p-4 space-y-4">
              <Link
                to="/dashboard"
                onClick={closeMobileMenu}
                className={`text-base font-medium transition-colors py-2 px-3 rounded-md ${
                  isActive('/dashboard')
                    ? 'text-white bg-gray-700'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/trades"
                onClick={closeMobileMenu}
                className={`text-base font-medium transition-colors py-2 px-3 rounded-md ${
                  isActive('/trades')
                    ? 'text-white bg-gray-700'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                Trades
              </Link>
              <Link
                to="/analytics"
                onClick={closeMobileMenu}
                className={`text-base font-medium transition-colors py-2 px-3 rounded-md ${
                  isActive('/analytics')
                    ? 'text-white bg-gray-700'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                Analytics
              </Link>
              <Link
                to="/accounts"
                onClick={closeMobileMenu}
                className={`text-base font-medium transition-colors py-2 px-3 rounded-md ${
                  isActive('/accounts')
                    ? 'text-white bg-gray-700'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                Accounts
              </Link>
              <Link
                to="/profile"
                onClick={closeMobileMenu}
                className={`text-base font-medium transition-colors py-2 px-3 rounded-md ${
                  isActive('/profile')
                    ? 'text-white bg-gray-700'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                Profile
              </Link>
              
              <div className="pt-4 border-t border-gray-700">
                <button
                  onClick={() => {
                    closeMobileMenu();
                    handleShowLogoutModal();
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-base font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Confirm Logout</h3>
              <button
                onClick={handleHideLogoutModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to log out? You'll need to sign in again to access your account.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleHideLogoutModal}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-md transition-colors border border-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});