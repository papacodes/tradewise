import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { cacheUtils } from '../utils/cacheUtils';
import { Plus, Search, Filter, ArrowUpDown, Calendar, TrendingUp, TrendingDown, Eye, Edit, Trash2 } from 'lucide-react';
import { useCachedTrades, useCachedAccounts } from '../hooks/useSupabaseCache';


interface Trade {
  id: string;
  user_id: string;
  account_id: string;
  trade_name: string;
  trade_date: string;
  symbol: string;
  news_impact?: string;
  market_bias: string;
  trading_session: string;
  entry_time: string;
  entry_price: number;
  stop_loss_price: number;
  take_profit_price: number;
  position_size: number;
  is_profitable: boolean;
  exit_reason: string;
  confluences: string[];
  mistakes: string[];
  pnl_amount: number;
  created_at: string;
}



type SortField = 'trade_date' | 'symbol' | 'pnl_amount' | 'entry_price';
type SortDirection = 'asc' | 'desc';

export const Trades: React.FC = React.memo(() => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProfitable, setFilterProfitable] = useState<'all' | 'profitable' | 'loss'>('all');
  const [filterSession, setFilterSession] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('trade_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Use cached data hooks
  const accountsQuery = useCachedAccounts(user?.id);
  const { data: accounts, loading: accountsLoading } = accountsQuery;
  const accountIds = useMemo(() => accounts?.map(acc => acc.id) || [], [accounts]);
  const tradesQuery = useCachedTrades(user?.id, accountIds);
  const { data: trades, loading: tradesLoading } = tradesQuery;
  
  const loading = accountsLoading || tradesLoading;

  useEffect(() => {
    document.title = 'Trades - TradeTrackr';
  }, []);

  // Handler functions
  const handleViewTrade = useCallback((trade: Trade) => {
    setSelectedTrade(trade);
    setShowViewModal(true);
  }, []);

  const handleEditTrade = useCallback((trade: Trade) => {
    navigate(`/trade-log/edit/${trade.id}`);
  }, [navigate]);

  const handleDeleteTrade = useCallback((trade: Trade) => {
    setSelectedTrade(trade);
    setShowDeleteModal(true);
  }, []);

  const confirmDeleteTrade = useCallback(async () => {
    if (!selectedTrade || !user) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', selectedTrade.id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update cache
      cacheUtils.invalidateAfterTradeOperation(user.id);
      
      toast.success('Trade deleted successfully');
      setShowDeleteModal(false);
      setSelectedTrade(null);
    } catch (error) {
      console.error('Error deleting trade:', error);
      toast.error('Failed to delete trade');
    } finally {
      setDeleting(false);
    }
  }, [selectedTrade, user]);



  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField, sortDirection]);

  const filteredAndSortedTrades = useMemo(() => {
    if (!trades) return [];
    
    return trades
      .filter(trade => {
        // Search filter
        if (searchTerm && !trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !trade.trade_name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }

        // Profitability filter
        if (filterProfitable === 'profitable' && !trade.is_profitable) return false;
        if (filterProfitable === 'loss' && trade.is_profitable) return false;

        // Session filter
        if (filterSession !== 'all' && trade.trading_session !== filterSession) return false;

        return true;
      })
      .sort((a, b) => {
        // Primary sort: Always by trade_date (newest first)
        const dateA = new Date(a.trade_date).getTime();
        const dateB = new Date(b.trade_date).getTime();
        
        // If dates are different, sort by date (newest first)
        if (dateA !== dateB) {
          return dateB - dateA;
        }
        
        // Secondary sort: If dates are the same, use the selected sort field
        let aValue: string | number = a[sortField];
        let bValue: string | number = b[sortField];

        if (sortField === 'trade_date') {
          aValue = dateA;
          bValue = dateB;
        }

        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
  }, [trades, searchTerm, filterProfitable, filterSession, sortField, sortDirection]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const getExitPrice = useCallback((trade: Trade) => {
    return trade.is_profitable ? trade.take_profit_price : trade.stop_loss_price;
  }, []);

  const getAccountName = useCallback((accountId: string) => {
    const account = accounts?.find(acc => acc.id === accountId);
    return account?.name || 'Unknown Account';
  }, [accounts]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-white text-lg">Loading trades...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-3 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Trade History</h1>
            <p className="text-sm sm:text-base text-gray-400">View and manage your trading history</p>
          </div>
          <Link
            to="/trade-log"
            className="mt-4 sm:mt-0 inline-flex items-center px-3 sm:px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors btn-touch text-responsive-base"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Add New Trade
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-800 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by symbol or trade name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent input-touch text-responsive-base"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center justify-center px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 btn-touch text-responsive-base"
            >
              <Filter className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Filters
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* Profitability Filter */}
                <div>
                  <label className="block text-white font-medium mb-2 text-sm sm:text-base">Outcome</label>
                  <select
                    value={filterProfitable}
                    onChange={(e) => setFilterProfitable(e.target.value as 'all' | 'profitable' | 'loss')}
                    className="w-full px-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 input-touch text-responsive-base"
                  >
                    <option value="all">All Trades</option>
                    <option value="profitable">Profitable Only</option>
                    <option value="loss">Losses Only</option>
                  </select>
                </div>

                {/* Session Filter */}
                <div>
                  <label className="block text-white font-medium mb-2 text-sm sm:text-base">Session</label>
                  <select
                    value={filterSession}
                    onChange={(e) => setFilterSession(e.target.value)}
                    className="w-full px-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 input-touch text-responsive-base"
                  >
                    <option value="all">All Sessions</option>
                    <option value="london">London</option>
                    <option value="new_york">New York</option>
                    <option value="tokyo">Tokyo</option>
                    <option value="sydney">Sydney</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Trades Table */}
        {(accounts?.length || 0) === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-yellow-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">No Trading Accounts Found</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  You need to add a trading account before viewing trades.
                </p>
                <Link
                  to="/accounts"
                  className="inline-flex items-center mt-3 text-sm font-medium text-yellow-800 hover:text-yellow-900"
                >
                  Add Trading Account
                </Link>
              </div>
            </div>
          </div>
        ) : filteredAndSortedTrades.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-white text-lg font-medium mb-2">No Trades Found</h3>
            <p className="text-gray-400 mb-4">
              {(trades?.length || 0) === 0 
                ? "You haven't logged any trades yet." 
                : "No trades match your current filters."}
            </p>
            <Link
              to="/trade-log"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Log Your First Trade
            </Link>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('trade_date')}
                        className="flex items-center text-white font-medium hover:text-blue-400 focus:outline-none text-xs sm:text-base"
                      >
                        Date
                        <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                      </button>
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('symbol')}
                        className="flex items-center text-white font-medium hover:text-blue-400 focus:outline-none text-xs sm:text-base"
                      >
                        Symbol
                        <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                      </button>
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-white font-medium text-xs sm:text-base">Type</th>
                    <th className="px-3 sm:px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('pnl_amount')}
                        className="flex items-center text-white font-medium hover:text-blue-400 focus:outline-none text-xs sm:text-base"
                      >
                        P&L
                        <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                      </button>
                    </th>
                    <th className="hidden sm:table-cell px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('entry_price')}
                        className="flex items-center text-white font-medium hover:text-blue-400 focus:outline-none"
                      >
                        Entry
                        <ArrowUpDown className="h-4 w-4 ml-1" />
                      </button>
                    </th>
                    <th className="hidden sm:table-cell px-6 py-3 text-left text-white font-medium">Exit</th>
                    <th className="hidden sm:table-cell px-6 py-3 text-left text-white font-medium">Session</th>
                    <th className="hidden sm:table-cell px-6 py-3 text-left text-white font-medium">Size</th>
                    <th className="hidden sm:table-cell px-6 py-3 text-left text-white font-medium">Account</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-white font-medium text-xs sm:text-base">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredAndSortedTrades.map((trade) => (
                    <tr key={trade.id} className="hover:bg-gray-700 transition-colors">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-white">
                        <div>
                          <div className="font-medium text-xs sm:text-base">{formatDate(trade.trade_date)}</div>
                          <div className="text-xs sm:text-sm text-gray-400 truncate max-w-[100px] sm:max-w-none">{trade.trade_name}</div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className="font-medium text-white text-xs sm:text-base">{trade.symbol}</div>
                        <div className="text-xs sm:text-sm text-gray-400 capitalize">{trade.market_bias}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className={`inline-flex items-center px-1 sm:px-2 py-1 rounded-full text-xs font-medium ${
                          trade.is_profitable 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {trade.is_profitable ? (
                            <><TrendingUp className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />Profit</>
                          ) : (
                            <><TrendingDown className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />Loss</>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className={`font-medium text-xs sm:text-base ${
                          trade.is_profitable ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {formatCurrency(trade.pnl_amount || 0)}
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 text-white font-mono">
                        {trade.entry_price.toFixed(5)}
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 text-white font-mono">
                        {getExitPrice(trade).toFixed(5)}
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4">
                        <span className="text-gray-300 capitalize">{trade.trading_session}</span>
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 text-white font-mono">
                        {trade.position_size?.toFixed(2) || '1.00'}
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4">
                        <div className="text-white font-medium">{getAccountName(trade.account_id)}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <button
                            onClick={() => handleViewTrade(trade)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-gray-600 rounded-lg transition-colors touch-target"
                            title="View Details"
                          >
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                          <button
                            onClick={() => handleEditTrade(trade)}
                            className="text-yellow-400 hover:text-yellow-300 hover:bg-gray-600 rounded-lg transition-colors touch-target"
                            title="Edit Trade"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTrade(trade)}
                            className="text-red-400 hover:text-red-300 hover:bg-gray-600 rounded-lg transition-colors touch-target"
                            title="Delete Trade"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {filteredAndSortedTrades.length > 0 && (
          <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
              <h3 className="text-white font-medium mb-2 text-sm sm:text-base">Total Trades</h3>
              <p className="text-xl sm:text-2xl font-bold text-white">{filteredAndSortedTrades.length}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
              <h3 className="text-white font-medium mb-2 text-sm sm:text-base">Win Rate</h3>
              <p className="text-xl sm:text-2xl font-bold text-white">
                {((filteredAndSortedTrades.filter(t => t.is_profitable).length / filteredAndSortedTrades.length) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
              <h3 className="text-white font-medium mb-2 text-sm sm:text-base">Total P&L</h3>
              <p className={`text-xl sm:text-2xl font-bold ${
                filteredAndSortedTrades.reduce((sum, t) => sum + (t.pnl_amount || 0), 0) >= 0 
                  ? 'text-green-400' 
                  : 'text-red-400'
              }`}>
                {formatCurrency(filteredAndSortedTrades.reduce((sum, t) => sum + (t.pnl_amount || 0), 0))}
              </p>
            </div>
          </div>
        )}

        {/* View Trade Modal */}
        {showViewModal && selectedTrade && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-bold text-white">Trade Details</h2>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors touch-target"
                  >
                    ×
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-gray-400 text-xs sm:text-sm mb-1">Trade Name</label>
                    <p className="text-white font-medium text-sm sm:text-base">{selectedTrade.trade_name}</p>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs sm:text-sm mb-1">Account</label>
                    <p className="text-white font-medium text-sm sm:text-base">{getAccountName(selectedTrade.account_id)}</p>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs sm:text-sm mb-1">Symbol</label>
                    <p className="text-white font-medium text-sm sm:text-base">{selectedTrade.symbol}</p>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs sm:text-sm mb-1">Date</label>
                    <p className="text-white font-medium text-sm sm:text-base">{formatDate(selectedTrade.trade_date)}</p>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Entry Price</label>
                    <p className="text-white font-mono">{selectedTrade.entry_price.toFixed(5)}</p>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Exit Price</label>
                    <p className="text-white font-mono">{getExitPrice(selectedTrade).toFixed(5)}</p>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Stop Loss</label>
                    <p className="text-white font-mono">{selectedTrade.stop_loss_price.toFixed(5)}</p>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Take Profit</label>
                    <p className="text-white font-mono">{selectedTrade.take_profit_price.toFixed(5)}</p>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Position Size</label>
                    <p className="text-white font-mono">{selectedTrade.position_size?.toFixed(2) || '1.00'}</p>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">P&L</label>
                    <p className={`font-medium ${
                      selectedTrade.is_profitable ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(selectedTrade.pnl_amount || 0)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Market Bias</label>
                    <p className="text-white font-medium capitalize">{selectedTrade.market_bias}</p>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Trading Session</label>
                    <p className="text-white font-medium capitalize">{selectedTrade.trading_session}</p>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">News Impact</label>
                    <p className="text-white font-medium capitalize">{selectedTrade.news_impact}</p>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Exit Reason</label>
                    <p className="text-white font-medium capitalize">{selectedTrade.exit_reason.replace('_', ' ')}</p>
                  </div>
                </div>
                
                {selectedTrade.confluences && selectedTrade.confluences.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-gray-400 text-sm mb-2">Confluences</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedTrade.confluences.map((confluence, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full"
                        >
                          {confluence}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedTrade.mistakes && selectedTrade.mistakes.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-gray-400 text-sm mb-2">Mistakes</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedTrade.mistakes.map((mistake, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-red-600 text-white text-xs rounded-full"
                        >
                          {mistake}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-4 py-3 sm:py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm sm:text-base min-h-[44px]"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleEditTrade(selectedTrade);
                    }}
                    className="px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-h-[44px]"
                  >
                    Edit Trade
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedTrade && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-gray-800 rounded-lg max-w-md w-full mx-2 sm:mx-0">
              <div className="p-4 sm:p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-white">Delete Trade</h3>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-gray-300 text-sm sm:text-base">
                    Are you sure you want to delete the trade "{selectedTrade.trade_name}" for {selectedTrade.symbol}? 
                    This action cannot be undone.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleting}
                    className="px-4 py-3 sm:py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 text-sm sm:text-base min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteTrade}
                    disabled={deleting}
                    className="px-4 py-3 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 flex items-center text-sm sm:text-base min-h-[44px]"
                  >
                    {deleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      'Delete Trade'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
});

export default Trades;