import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Eye, Edit, Trash2, ChevronRight, ChevronDown, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Layout } from '../components/Layout';

import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useCachedAccounts, useCachedTrades } from '../hooks/useSupabaseCache';
import { cacheUtils } from '../utils/cacheUtils';

interface TradingAccount {
  id: string;
  name: string;
  starting_balance: number;
  currency: string;
  created_at: string;
  current_balance?: number;
  total_pnl?: number;
  is_profitable?: boolean;
  profit_percentage?: number;
}

interface Trade {
  id: string;
  trade_name: string;
  trade_date: string;
  symbol: string;
  pnl_amount: number;
  is_profitable: boolean;
  exit_reason: 'take_profit' | 'stop_loss' | 'manual_exit';
  entry_price: number;
  created_at: string;
}

interface AccountWithTrades extends TradingAccount {
  recent_trades: Trade[];
  expanded?: boolean;
}

export const Accounts: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountWithTrades | null>(null);
  const [newAccount, setNewAccount] = useState({
    name: '',
    starting_balance: '',
    currency: 'USD'
  });
  const [editAccount, setEditAccount] = useState({
    name: '',
    currency: 'USD'
  });

  // Use cached data hooks
  const accountsQuery = useCachedAccounts(user?.id);
  const { data: accountsData, loading: accountsLoading } = accountsQuery;
  
  const accountIds = useMemo(() => accountsData?.map(acc => acc.id) || [], [accountsData]);
  
  const tradesQuery = useCachedTrades(user?.id, accountIds);
  const { data: tradesData, loading: tradesLoading } = tradesQuery;
  
  const loading = accountsLoading || tradesLoading;

  useEffect(() => {
    document.title = 'Accounts - TradeWise';
  }, []);

  // Process accounts with trades data
  const accounts = useMemo(() => {
    if (!accountsData) {
      return [];
    }

    return accountsData.map(account => {
      const accountTrades = tradesData?.filter(trade => trade.account_id === account.id) || [];
      
      // Calculate total P&L from all trades
      const total_pnl = accountTrades.reduce((sum, trade) => {
        return sum + (trade.pnl_amount || 0);
      }, 0);
      
      // Calculate current balance
      const current_balance = (account.starting_balance || 0) + total_pnl;
      
      // Calculate profit percentage
      const profit_percentage = account.starting_balance && account.starting_balance > 0 
        ? (total_pnl / account.starting_balance) * 100 
        : 0;
      
      // Determine if account is profitable
      const is_profitable = total_pnl >= 0;
      
      // Get the 5 most recent trades sorted by trade_date in descending order
      const recentTrades = accountTrades
        .sort((a, b) => new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime())
        .slice(0, 5);
      
      return {
        ...account,
        trades: accountTrades,
        recent_trades: recentTrades,
        total_pnl,
        current_balance,
        profit_percentage,
        is_profitable
      };
    });
  }, [accountsData, tradesData]);

  // Manual refresh function for user-triggered updates
  const refreshAccounts = useCallback(async () => {
    try {
      await accountsQuery.refetch();
      await tradesQuery.refetch();
      // Invalidate related cache after manual refresh
      cacheUtils.invalidateAfterAccountOperation(user?.id || '');
      toast.success('Accounts refreshed successfully');
    } catch (error) {
      console.error('Error refreshing accounts:', error);
      toast.error('Failed to refresh accounts');
    }
  }, [accountsQuery, tradesQuery, user?.id]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAccount.name || !newAccount.starting_balance) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('trading_accounts')
        .insert({
          user_id: user?.id,
          name: newAccount.name,
          starting_balance: parseFloat(newAccount.starting_balance),
          currency: newAccount.currency
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh accounts to get updated data with calculations
      await refreshAccounts();
      setNewAccount({ name: '', starting_balance: '', currency: 'USD' });
      setShowCreateModal(false);
      toast.success('Account created successfully');
    } catch (error) {
      console.error('Error creating account:', error);
      toast.error('Failed to create account');
    }
  };

  const handleViewAccount = (account: AccountWithTrades) => {
    setSelectedAccount(account);
    setShowViewModal(true);
  };

  const handleEditAccount = (account: AccountWithTrades) => {
    setSelectedAccount(account);
    setEditAccount({
      name: account.name,
      currency: account.currency
    });
    setShowEditModal(true);
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAccount || !editAccount.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('trading_accounts')
        .update({
          name: editAccount.name,
          currency: editAccount.currency
        })
        .eq('id', selectedAccount.id);

      if (error) throw error;

      await refreshAccounts();
      setShowEditModal(false);
      setSelectedAccount(null);
      toast.success('Account updated successfully');
    } catch (error) {
      console.error('Error updating account:', error);
      toast.error('Failed to update account');
    }
  };

  const handleDeleteAccount = (account: AccountWithTrades) => {
    setSelectedAccount(account);
    setShowDeleteModal(true);
  };



  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());

  const toggleAccountExpansion = (accountId: string) => {
    setExpandedAccounts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accountId)) {
        newSet.delete(accountId);
      } else {
        newSet.add(accountId);
      }
      return newSet;
    });
  };

  const handleViewAllTrades = (accountId: string) => {
    navigate('/trades', { state: { accountFilter: accountId } });
  };



  const confirmDeleteAccount = async () => {
    if (!selectedAccount) return;


    try {
      const { error } = await supabase
        .from('trading_accounts')
        .delete()
        .eq('id', selectedAccount.id);

      if (error) throw error;

      setShowDeleteModal(false);
      setSelectedAccount(null);
      await refreshAccounts();
      
      toast.success('Account deleted successfully!');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Accounts</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Account
          </button>
        </div>



        {/* Accounts Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="bg-gray-900 px-6 py-3 border-b border-gray-700">
            <div className="grid grid-cols-6 gap-4 text-sm font-medium text-white">
              <div>Account</div>
              <div>Starting Balance</div>
              <div>Current Balance</div>
              <div>P&L</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-700">
            {accounts.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-400">
                <p>No trading accounts found.</p>
                <p className="text-sm mt-1">Create your first account to get started.</p>
              </div>
            ) : (
              accounts.map((account) => (
                <div key={account.id}>
                  {/* Main Account Row */}
                  <div className="px-6 py-4 hover:bg-gray-750 transition-colors">
                    <div className="grid grid-cols-6 gap-4 items-center">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleAccountExpansion(account.id)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          {expandedAccounts.has(account.id) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                        <div className="text-white font-medium">{account.name}</div>
                      </div>
                      <div className="text-white">
                        {formatCurrency(account.starting_balance, account.currency)}
                      </div>
                      <div className="text-white font-medium">
                        {formatCurrency(account.current_balance || account.starting_balance, account.currency)}
                      </div>
                      <div className={`font-medium ${
                        (account.total_pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatCurrency(account.total_pnl || 0, account.currency)}
                        <div className="text-xs opacity-75">
                          ({(account.profit_percentage || 0).toFixed(1)}%)
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {account.is_profitable ? (
                          <>
                            <TrendingUp className="w-4 h-4 text-green-400" />
                            <span className="text-green-400 text-sm font-medium">Profitable</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="w-4 h-4 text-red-400" />
                            <span className="text-red-400 text-sm font-medium">Loss</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleViewAccount(account)}
                          className="text-blue-400 hover:text-blue-300 p-1 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEditAccount(account)}
                          className="text-gray-400 hover:text-gray-300 p-1 rounded transition-colors"
                          title="Edit Account"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteAccount(account)}
                          className="text-red-400 hover:text-red-300 p-1 rounded transition-colors"
                          title="Delete Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Trade History */}
                  {expandedAccounts.has(account.id) && (
                    <div className="px-6 pb-4 bg-gray-750">
                      <div className="border-t border-gray-600 pt-4">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-white font-medium">Recent Trades</h3>
                          <button
                            onClick={() => handleViewAllTrades(account.id)}
                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm transition-colors"
                          >
                            View All Trades
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                        
                        {account.recent_trades.length === 0 ? (
                          <div className="text-gray-400 text-sm py-4 text-center">
                            No trades found for this account.
                          </div>
                        ) : (
                          <div className="bg-gray-800 rounded border border-gray-600 overflow-hidden">
                            <div className="bg-gray-900 px-4 py-2 border-b border-gray-600">
                              <div className="grid grid-cols-5 gap-4 text-xs font-medium text-gray-300">
                                <div>Date</div>
                                <div>Symbol</div>
                                <div>Trade Name</div>
                                <div>Outcome</div>
                                <div>P&L</div>
                              </div>
                            </div>
                            <div className="divide-y divide-gray-600">
                              {account.recent_trades.map((trade: Trade) => (
                                <div key={trade.id} className="px-4 py-2">
                                  <div className="grid grid-cols-5 gap-4 items-center text-sm">
                                    <div className="text-gray-300">
                                      {new Date(trade.trade_date).toLocaleDateString()}
                                    </div>
                                    <div className="text-white font-medium">{trade.symbol}</div>
                                    <div className="text-gray-300">{trade.trade_name}</div>
                                    <div className={`font-medium ${
                                      trade.is_profitable ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                      {trade.is_profitable ? 'Profit' : 'Loss'}
                                    </div>
                                    <div className={`font-medium ${
                                      trade.pnl_amount >= 0 ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                      {formatCurrency(trade.pnl_amount, account.currency)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create Account Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold text-white mb-4">Create New Account</h2>
              
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter account name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Starting Balance
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newAccount.starting_balance}
                    onChange={(e) => setNewAccount({ ...newAccount, starting_balance: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter starting balance"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Currency
                  </label>
                  <select
                    value={newAccount.currency}
                    onChange={(e) => setNewAccount({ ...newAccount, currency: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                    <option value="CAD">CAD</option>
                    <option value="AUD">AUD</option>
                  </select>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Account Modal */}
        {showEditModal && selectedAccount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold text-white mb-4">Edit Account</h2>
              
              <form onSubmit={handleUpdateAccount} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={editAccount.name}
                    onChange={(e) => setEditAccount({ ...editAccount, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter account name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Currency
                  </label>
                  <select
                    value={editAccount.currency}
                    onChange={(e) => setEditAccount({ ...editAccount, currency: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                    <option value="CAD">CAD</option>
                    <option value="AUD">AUD</option>
                  </select>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                  >
                    Update Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Account Modal */}
        {showViewModal && selectedAccount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4">
              <h2 className="text-xl font-bold text-white mb-4">Account Details</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Account Name
                    </label>
                    <div className="text-white font-medium">{selectedAccount.name}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Currency
                    </label>
                    <div className="text-white">{selectedAccount.currency}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Starting Balance
                    </label>
                    <div className="text-white font-medium">
                      {formatCurrency(selectedAccount.starting_balance, selectedAccount.currency)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Current Balance
                    </label>
                    <div className="text-white font-medium">
                      {formatCurrency(selectedAccount.current_balance || selectedAccount.starting_balance, selectedAccount.currency)}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Total P&L
                    </label>
                    <div className={`font-medium ${
                      (selectedAccount.total_pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(selectedAccount.total_pnl || 0, selectedAccount.currency)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Profitability
                    </label>
                    <div className="flex items-center gap-2">
                      {selectedAccount.is_profitable ? (
                        <>
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          <span className="text-green-400 font-medium">Profitable</span>
                          <span className="text-green-400 text-sm">({(selectedAccount.profit_percentage || 0).toFixed(1)}%)</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-4 h-4 text-red-400" />
                          <span className="text-red-400 font-medium">Loss</span>
                          <span className="text-red-400 text-sm">({(selectedAccount.profit_percentage || 0).toFixed(1)}%)</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-600">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Recent Trades ({selectedAccount.recent_trades.length})
                    </label>
                    <button
                      onClick={() => handleViewAllTrades(selectedAccount.id)}
                      className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                    >
                      View All
                    </button>
                  </div>
                  {selectedAccount.recent_trades.length === 0 ? (
                    <div className="text-gray-400 text-sm py-2">
                      No trades found for this account.
                    </div>
                  ) : (
                    <div className="text-sm text-gray-300">
                      Last trade: {selectedAccount.recent_trades?.[0]?.trade_date ? new Date(selectedAccount.recent_trades[0].trade_date).toLocaleDateString() : 'No trades'}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Account Modal */}
        {showDeleteModal && selectedAccount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold text-white mb-4">Delete Account</h2>
              
              <div className="mb-6">
                <p className="text-gray-300 mb-2">
                  Are you sure you want to delete the account <strong className="text-white">{selectedAccount.name}</strong>?
                </p>
                <p className="text-red-400 text-sm">
                  This action cannot be undone. All associated trades will also be deleted.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteAccount}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};