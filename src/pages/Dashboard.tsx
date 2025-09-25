import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useCachedTrades, useCachedAccounts } from '../hooks/useSupabaseCache';
import { MFASetupCard } from '../components/MFASetupCard';
import { ProfileCompletionCard } from '../components/ProfileCompletionCard';

interface Trade {
  id: string;
  trade_name: string;
  trade_date: string;
  symbol: string;
  market_bias: string;
  trading_session: string;
  entry_price: number;
  stop_loss_price: number;
  take_profit_price: number;
  position_size: number;
  is_profitable: boolean;
  pnl_amount: number;
  exit_reason: 'take_profit' | 'stop_loss' | 'manual_exit';
  created_at: string;
}

interface DashboardStats {
  totalTrades: number;
  currentPL: number;
  cumulativePL: number;
  winRate: number;
  totalTradesChange: number;
  currentPLChange: number;
  cumulativePLChange: number;
}

interface ChartData {
  month: string;
  pnl: number;
}

interface TradeOutcome {
  name: string;
  value: number;
  color: string;
}

export const Dashboard: React.FC = React.memo(() => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalTrades: 0,
    currentPL: 0,
    cumulativePL: 0,
    winRate: 0,
    totalTradesChange: 0,
    currentPLChange: 0,
    cumulativePLChange: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [tradeOutcomes, setTradeOutcomes] = useState<TradeOutcome[]>([]);

  console.log('🎯 [Dashboard] About to call useCachedAccounts with userId:', user?.id);
  console.log('🎯 [Dashboard] User object:', { user, hasUser: !!user, userId: user?.id });

  // Use cached data hooks with stable references
  const { data: accounts, loading: accountsLoading } = useCachedAccounts(user?.id);

  // Stabilize accountIds to prevent unnecessary re-renders
  const accountIds = useMemo(() => {
    return accounts?.map(account => account.id) || [];
  }, [accounts]);

  const { data: trades, loading: tradesLoading } = useCachedTrades(user?.id, accountIds);

  const isLoading = accountsLoading || tradesLoading;

  useEffect(() => {
    document.title = 'Dashboard - TradeTrackr';
  }, []);

  // Helper function to calculate percentage change
  const calculatePercentageChange = useCallback((current: number, previous: number): number => {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  }, []);

  // Helper function to get trades from a specific time period
  const getTradesFromPeriod = useCallback((trades: Trade[], daysAgo: number): Trade[] => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    
    return trades.filter(trade => {
      const tradeDate = new Date(trade.trade_date);
      return tradeDate >= cutoffDate;
    });
  }, []);

  const calculateStats = useCallback((trades: Trade[]) => {
    const totalTrades = trades.length;
    const winningTrades = trades.filter(trade => trade.is_profitable).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    
    // Calculate P&L
    const currentPL = trades.reduce((sum, trade) => {
      if (trade.pnl_amount) {
        return sum + trade.pnl_amount;
      }
      return sum;
    }, 0);

    // Calculate time-based comparisons (last 30 days vs previous 30 days)
    const last30DaysTrades = getTradesFromPeriod(trades, 30);
    const previous30DaysTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.trade_date);
      const thirtyDaysAgo = new Date();
      const sixtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      return tradeDate >= sixtyDaysAgo && tradeDate < thirtyDaysAgo;
    });

    // Calculate percentage changes
    const totalTradesChange = calculatePercentageChange(
      last30DaysTrades.length,
      previous30DaysTrades.length
    );

    const last30DaysPL = last30DaysTrades.reduce((sum, trade) => sum + (trade.pnl_amount || 0), 0);
    const previous30DaysPL = previous30DaysTrades.reduce((sum, trade) => sum + (trade.pnl_amount || 0), 0);
    const currentPLChange = calculatePercentageChange(last30DaysPL, previous30DaysPL);

    // Calculate cumulative P&L change (comparing current total vs 3 months ago)
    const threeMonthsAgoTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.trade_date);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return tradeDate < threeMonthsAgo;
    });
    const threeMonthsAgoPL = threeMonthsAgoTrades.reduce((sum, trade) => sum + (trade.pnl_amount || 0), 0);
    const cumulativePLChange = calculatePercentageChange(currentPL, threeMonthsAgoPL);

    setStats({
      totalTrades,
      currentPL,
      cumulativePL: currentPL,
      winRate,
      totalTradesChange,
      currentPLChange,
      cumulativePLChange,
    });
  }, [calculatePercentageChange, getTradesFromPeriod]);

  const generateChartData = useCallback((trades: Trade[]) => {
    // Group trades by month and calculate cumulative P&L
    const monthlyData: { [key: string]: number } = {};
    
    trades.forEach(trade => {
      if (trade.pnl_amount && trade.trade_date) {
        const date = new Date(trade.trade_date);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = 0;
        }
        monthlyData[monthKey] += trade.pnl_amount;
      }
    });

    // Convert to chart format
    const chartData = Object.entries(monthlyData).map(([month, pnl]) => ({
      month,
      pnl,
    }));

    // If no data, use mock data
    if (chartData.length === 0) {
      setChartData([
        { month: 'Jan', pnl: 5000 },
        { month: 'Feb', pnl: 8000 },
        { month: 'Mar', pnl: 15000 },
      ]);
    } else {
      setChartData(chartData);
    }
  }, []);

  const generateTradeOutcomes = useCallback((trades: Trade[]) => {
    const winningTrades = trades.filter(trade => trade.is_profitable).length;
    const losingTrades = trades.length - winningTrades;

    setTradeOutcomes([
      { name: 'Win', value: winningTrades, color: '#0ad95c' },
      { name: 'Loss', value: losingTrades, color: '#fa6138' },
    ]);
  }, []);

  // Process trades data when it changes
  useEffect(() => {
    if (trades && trades.length > 0) {
      calculateStats(trades);
      generateChartData(trades);
      generateTradeOutcomes(trades);
    } else if (trades && trades.length === 0) {
      // Reset stats for empty trades
      setStats({
        totalTrades: 0,
        currentPL: 0,
        cumulativePL: 0,
        winRate: 0,
        totalTradesChange: 0,
        currentPLChange: 0,
        cumulativePLChange: 0,
      });
      setChartData([]);
      setTradeOutcomes([]);
    }
  }, [trades, generateTradeOutcomes]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }, []);

  const formatPercentage = useCallback((value: number, isPositive?: boolean) => {
    const sign = value >= 0 ? '+' : '';
    const color = isPositive !== undefined 
      ? (isPositive ? 'text-green-400' : 'text-red-400')
      : (value >= 0 ? 'text-green-400' : 'text-red-400');
    
    return (
      <span className={color}>
        {sign}{value.toFixed(1)}%
      </span>
    );
  }, []);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-white text-lg">Loading dashboard...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col p-3 sm:p-4 md:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-white text-2xl sm:text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Track your trading performance and insights
          </p>
        </div>

        {/* MFA and Profile Completion Cards */}
        <div className="space-y-4 mb-6 sm:mb-8">
          <MFASetupCard />
          <ProfileCompletionCard />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
            <h3 className="text-white text-sm sm:text-base font-medium mb-2">Total Trades</h3>
            <p className="text-white text-xl sm:text-2xl font-bold mb-1">{stats.totalTrades}</p>
            <div className="text-sm sm:text-base">
              {formatPercentage(stats.totalTradesChange)}
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
            <h3 className="text-white text-sm sm:text-base font-medium mb-2">Current P/L</h3>
            <p className="text-white text-xl sm:text-2xl font-bold mb-1 break-all">
              {formatCurrency(stats.currentPL)}
            </p>
            <div className="text-sm sm:text-base">
              {formatPercentage(stats.currentPLChange, stats.currentPL >= 0)}
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
            <h3 className="text-white text-sm sm:text-base font-medium mb-2">Cumulative P/L</h3>
            <p className="text-white text-xl sm:text-2xl font-bold mb-1 break-all">
              {formatCurrency(stats.cumulativePL)}
            </p>
            <div className="text-sm sm:text-base">
              {formatPercentage(stats.cumulativePLChange)}
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Profit/Loss Over Time */}
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 sm:p-6">
            <div className="mb-4">
              <h3 className="text-white text-sm sm:text-base font-medium mb-1">Profit/Loss Over Time</h3>
              <p className="text-white text-xl sm:text-2xl font-bold mb-2 break-all">
                {formatCurrency(stats.cumulativePL)}
              </p>
              <div className="flex items-center gap-1 text-xs sm:text-sm">
                <span className="text-gray-400">Last 3 Months</span>
                <div className="text-xs sm:text-sm">
                  {formatPercentage(stats.cumulativePLChange)}
                </div>
              </div>
            </div>
            
            <div className="h-40 sm:h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 10 }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'P&L']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pnl" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trade Outcomes */}
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 sm:p-6">
            <div className="mb-4">
              <h3 className="text-white text-sm sm:text-base font-medium mb-1">Trade Outcomes</h3>
              <p className="text-white text-xl sm:text-2xl font-bold mb-2">
                {stats.totalTrades} Trades
              </p>
              <div className="flex items-center gap-1 text-xs sm:text-sm">
                <span className="text-gray-400">Last Month</span>
                <div className="text-xs sm:text-sm">
                  {formatPercentage(stats.totalTradesChange)}
                </div>
              </div>
            </div>
            
            <div className="h-40 sm:h-48 flex items-center justify-center">
              {tradeOutcomes.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tradeOutcomes}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {tradeOutcomes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-gray-400 text-center">
                  <p className="text-sm sm:text-base">No trade data available</p>
                  <p className="text-xs sm:text-sm mt-1">Start logging trades to see outcomes</p>
                </div>
              )}
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mt-4">
              {tradeOutcomes.map((outcome) => (
                <div key={outcome.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: outcome.color }}
                  ></div>
                  <span className="text-gray-400 text-xs sm:text-sm">{outcome.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
});