import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { useCachedTrades, useCachedAccounts } from '../hooks/useSimpleCache';




interface SessionData {
  session: string;
  profit: number;
  trades: number;
  winRate: number;
}

interface ProfitData {
  date: string;
  profit: number;
  cumulative: number;
}

export const Analytics: React.FC = React.memo(() => {
  const { user } = useAuth();
  const [profitData, setProfitData] = useState<ProfitData[]>([]);
  const [sessionData, setSessionData] = useState<SessionData[]>([]);
  const [totalProfit, setTotalProfit] = useState(0);
  const [winLossRatio, setWinLossRatio] = useState({ wins: 0, losses: 0, ratio: '0:0' });
  const [profitGrowth, setProfitGrowth] = useState(0);

  // Use cached data hooks
  const accountsQuery = useCachedAccounts(user?.id);
  const { data: accounts, loading: accountsLoading } = accountsQuery;
  const accountIds = useMemo(() => accounts?.map(acc => acc.id) || [], [accounts]);
  const tradesQuery = useCachedTrades(user?.id, accountIds);
  const { data: trades, loading: tradesLoading } = tradesQuery;
  
  const loading = accountsLoading || tradesLoading;

  useEffect(() => {
    document.title = 'Analytics - TradeTrackr';
  }, []);

  const calculateAnalytics = useCallback(() => {
    if (!trades || trades.length === 0) {
      setProfitData([]);
      setSessionData([]);
      setWinLossRatio({ wins: 0, losses: 0, ratio: '0:0' });
      setTotalProfit(0);
      setProfitGrowth(0);
      return;
    }
    
    // Calculate profit over time
    const profitOverTime: ProfitData[] = [];
    let cumulativeProfit = 0;
    
    const groupedByDate = trades.reduce((acc, trade) => {
      const date = trade.trade_date?.split('T')[0];
      if (date && !acc[date]) {
        acc[date] = 0;
      }
      if (date) {
        acc[date] = (acc[date] || 0) + trade.pnl_amount;
      }
      return acc;
    }, {} as Record<string, number>);

    Object.entries(groupedByDate)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .forEach(([date, profit]) => {
        const profitAmount = typeof profit === 'number' ? profit : 0;
        cumulativeProfit += profitAmount;
        profitOverTime.push({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          profit: profitAmount,
          cumulative: cumulativeProfit
        });
      });

    setProfitData(profitOverTime);
    setTotalProfit(cumulativeProfit);

    // Calculate profit growth (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const last30DaysProfit = trades
      .filter(trade => new Date(trade.trade_date) >= thirtyDaysAgo)
      .reduce((sum, trade) => sum + trade.pnl_amount, 0);
    
    const previous30DaysProfit = trades
      .filter(trade => {
        const tradeDate = new Date(trade.trade_date);
        return tradeDate >= sixtyDaysAgo && tradeDate < thirtyDaysAgo;
      })
      .reduce((sum, trade) => sum + trade.pnl_amount, 0);

    const growth = previous30DaysProfit !== 0 
      ? ((last30DaysProfit - previous30DaysProfit) / Math.abs(previous30DaysProfit)) * 100
      : last30DaysProfit > 0 ? 100 : 0;
    
    setProfitGrowth(growth);

    // Calculate session analytics
    const sessionStats: Record<string, { profit: number; trades: number; wins: number }> = (trades || []).reduce((acc, trade) => {
      const session = trade.trading_session;
      if (!acc[session]) {
        acc[session] = { profit: 0, trades: 0, wins: 0 };
      }
      acc[session].profit += trade.pnl_amount;
      acc[session].trades += 1;
      if (trade.is_profitable) {
        acc[session].wins += 1;
      }
      return acc;
    }, {} as Record<string, { profit: number; trades: number; wins: number }>);

    const sessionAnalytics: SessionData[] = Object.entries(sessionStats)
      .map(([session, stats]) => ({
        session,
        profit: stats.profit,
        trades: stats.trades,
        winRate: stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0
      }))
      .sort((a, b) => b.profit - a.profit);

    setSessionData(sessionAnalytics);

    // Calculate win/loss ratio
    const wins = (trades || []).filter(trade => trade.is_profitable).length;
    const losses = (trades || []).filter(trade => !trade.is_profitable).length;
    const ratio = losses > 0 ? `${Math.round((wins / losses) * 10) / 10}:1` : `${wins}:0`;
    
    setWinLossRatio({ wins, losses, ratio });
  }, [trades]);

  useEffect(() => {
    calculateAnalytics();
  }, [calculateAnalytics]);

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }, []);

  // Removed unused COLORS constant

  if (loading) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-white text-lg">Loading analytics...</div>
        </div>
      </Layout>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <Layout>
        <div className="p-6">
          <h1 className="text-3xl font-bold text-white mb-8">Analytics</h1>
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Data Available</h3>
            <p className="text-gray-400">Start logging trades to see your analytics</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-8">
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        
        {/* Performance Overview */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Performance Overview</h2>
          
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Profit Over Time</h3>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{formatCurrency(totalProfit)}</div>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-gray-400">Last 30 Days</span>
                  <span className={`font-medium flex items-center gap-1 ${
                    profitGrowth >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {profitGrowth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {profitGrowth >= 0 ? '+' : ''}{profitGrowth.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={profitData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Cumulative P&L']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cumulative" 
                    stroke="#0ad95c" 
                    strokeWidth={2}
                    dot={{ fill: '#0ad95c', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Trading Insights */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Trading Insights</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Most Profitable Sessions */}
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Most Profitable Sessions</h3>
              <div className="text-3xl font-bold text-white mb-2">
                {sessionData.length > 0 ? formatCurrency(sessionData[0]?.profit || 0) : '$0'}
              </div>
              <div className="flex items-center gap-1 text-sm mb-4">
                <span className="text-gray-400">Best Session</span>
                <span className="text-green-400 font-medium">+20%</span>
              </div>
              
              <div className="space-y-3">
                {sessionData.slice(0, 3).map((session) => (
                  <div key={session.session} className="flex items-center justify-between">
                    <span className="text-gray-300">{session.session}</span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-2 rounded-full bg-gradient-to-r from-green-500 to-green-400"
                        style={{ 
                          width: `${Math.max(20, (session.profit / (sessionData[0]?.profit || 1)) * 60)}px` 
                        }}
                      />
                      <span className="text-sm text-white font-medium">
                        {formatCurrency(session.profit)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Favorite Trading Sessions */}
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Favorite Trading Sessions</h3>
              <div className="text-3xl font-bold text-white mb-2">
                {sessionData.reduce((sum, session) => sum + session.trades, 0)}
              </div>
              <div className="flex items-center gap-1 text-sm mb-4">
                <span className="text-gray-400">Total Trades</span>
                <span className="text-blue-400 font-medium">+10%</span>
              </div>
              
              <div className="space-y-3">
                {sessionData.slice(0, 3).map((session) => (
                  <div key={session.session} className="flex items-center justify-between">
                    <span className="text-gray-300">{session.session}</span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                        style={{ 
                          width: `${Math.max(20, (session.trades / Math.max(...sessionData.map(s => s.trades))) * 60)}px` 
                        }}
                      />
                      <span className="text-sm text-white font-medium">
                        {session.trades}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Win/Loss Ratio */}
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Win/Loss Ratio</h3>
              <div className="text-3xl font-bold text-white mb-2">{winLossRatio.ratio}</div>
              <div className="flex items-center gap-1 text-sm mb-4">
                <span className="text-gray-400">Overall</span>
                <span className="text-green-400 font-medium">+5%</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-gray-300">Wins</span>
                  </div>
                  <span className="text-white font-medium">{winLossRatio.wins}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-gray-300">Losses</span>
                  </div>
                  <span className="text-white font-medium">{winLossRatio.losses}</span>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Wins', value: winLossRatio.wins, color: '#0ad95c' },
                          { name: 'Losses', value: winLossRatio.losses, color: '#fa6138' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={20}
                        outerRadius={50}
                        dataKey="value"
                      >
                        <Cell fill="#0ad95c" />
                        <Cell fill="#fa6138" />
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
});