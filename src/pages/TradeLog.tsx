import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layout } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Search, Plus, AlertCircle, ExternalLink } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { 
  validateTradingSymbol, 
  validatePrice, 
  validatePositionSize, 
  validateTradeForm, 
  validateDateTime,
  sanitizeString,
  preventSQLInjection,
  validateName
} from '../utils/validation';
import { cacheUtils } from '../utils/cacheUtils';
import { calculatePnL, isForexPair } from '../utils/forexCalculations';

interface TradingAccount {
  id: string;
  name: string;
  starting_balance: number;
  currency: string;
}

interface CurrencyPair {
  id: string;
  symbol: string;
  name: string;
  category: string;
}

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
}

const tradeSchema = z.object({
  name: z.string().min(1, 'Trade name is required'),
  account_id: z.string().min(1, 'Please select an account'),
  entry_datetime: z.string().min(1, 'Entry date and time is required'),
  symbol: z.string().min(1, 'Symbol is required'),
  news_impact: z.string().optional(),
  market_bias: z.string().min(1, 'Market bias is required'),
  trading_session: z.string().min(1, 'Trading session is required'),
  confluences: z.array(z.string()).min(1, 'At least one confluence is required'),
  entry_price: z.number().positive('Entry price must be positive'),
  stop_loss_price: z.number().positive('Stop loss price must be positive'),
  take_profit_price: z.number().positive('Take profit price must be positive'),
  position_size: z.number().positive('Position size must be positive').default(1.0),
  lot_type: z.enum(['standard', 'mini', 'micro']).default('standard'),
  exit_reason: z.enum(['take_profit', 'stop_loss', 'manual_exit'], {
    required_error: 'Please select an exit reason'
  }),
  mistakes: z.array(z.string()).optional(),
}).refine((data) => {
  if (data.market_bias === 'bullish') {
    return data.stop_loss_price < data.entry_price && data.take_profit_price > data.entry_price;
  } else if (data.market_bias === 'bearish') {
    return data.stop_loss_price > data.entry_price && data.take_profit_price < data.entry_price;
  }
  return true;
}, {
  message: 'Stop loss and take profit prices must align with market bias',
  path: ['entry_price']
});

type TradeFormData = z.infer<typeof tradeSchema>;

// const MARKET_BIAS_OPTIONS = ['Bullish', 'Bearish', 'Neutral'];
// Trading session options for form dropdown
// const TRADING_SESSION_OPTIONS = ['London', 'New York', 'Tokyo', 'Sydney', 'Overlap'];
// const NEWS_IMPACT_OPTIONS = ['High', 'Medium', 'Low', 'None'];

const CONFLUENCE_OPTIONS = [
  'Support/Resistance',
  'Trend Line',
  'Moving Average',
  'Fibonacci Retracement',
  'Chart Pattern',
  'Volume Analysis',
  'RSI Divergence',
  'MACD Signal',
  'Bollinger Bands',
  'Price Action'
];

const MISTAKE_OPTIONS = [
  'Overtrading',
  'Poor Risk Management',
  'Emotional Trading',
  'Ignoring Stop Loss',
  'FOMO Entry',
  'Revenge Trading',
  'Poor Timing',
  'Inadequate Analysis',
  'Position Size Too Large',
  'Not Following Plan'
];

export const TradeLog: React.FC = React.memo(() => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tradeId } = useParams<{ tradeId?: string }>();
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [currencyPairs, setCurrencyPairs] = useState<CurrencyPair[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedConfluences, setSelectedConfluences] = useState<string[]>([]);
  const [selectedMistakes, setSelectedMistakes] = useState<string[]>([]);
  const [symbolSearch, setSymbolSearch] = useState('');
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false);
  const [isCreatingNewPair, setIsCreatingNewPair] = useState(false);
  const [existingTrade, setExistingTrade] = useState<Trade | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingTrade, setLoadingTrade] = useState(false);
  const [nameValidationError, setNameValidationError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<TradeFormData>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      confluences: [],
      mistakes: [],
      entry_datetime: new Date().toISOString().slice(0, 16) // Current date/time
    }
  });

  // Watch the name field for real-time validation
  const watchedName = watch('name');

  // Real-time validation for trade name
  useEffect(() => {
    if (watchedName !== undefined && watchedName !== '') {
      const validation = validateName(watchedName);
      if (!validation.isValid) {
        setNameValidationError(validation.error || 'Invalid trade name');
      } else {
        setNameValidationError('');
      }
    } else {
      setNameValidationError('');
    }
  }, [watchedName]);

  const fetchAccounts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('trading_accounts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error('Failed to load accounts');
    }
  }, [user?.id]);

  const fetchCurrencyPairs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('currency_pairs')
        .select('*')
        .eq('is_active', true)
        .order('symbol');

      if (error) throw error;
      setCurrencyPairs(data || []);
    } catch (error) {
      console.error('Error fetching currency pairs:', error);
      // Fallback to common pairs if database fetch fails
      setCurrencyPairs([
        { id: '1', symbol: 'EURUSD', name: 'Euro / US Dollar', category: 'forex' },
        { id: '2', symbol: 'GBPUSD', name: 'British Pound / US Dollar', category: 'forex' },
        { id: '3', symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', category: 'forex' },
        { id: '4', symbol: 'AAPL', name: 'Apple Inc.', category: 'stocks' },
        { id: '5', symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', category: 'crypto' }
      ]);
    }
  }, []);

  const fetchExistingTrade = useCallback(async (id: string) => {
    setLoadingTrade(true);
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      
      // Handle case when trade doesn't exist
      if (!data) {
        toast.error('Trade not found or you do not have permission to view it');
        navigate('/trades');
        return;
      }
      
      setExistingTrade(data);
      setIsEditMode(true);
      
      // Populate form with existing trade data
      const entryDateTime = new Date(data.entry_time).toISOString().slice(0, 16);
      
      reset({
        name: data.trade_name,
        account_id: data.account_id,
        entry_datetime: entryDateTime,
        symbol: data.symbol,
        news_impact: data.news_impact || '',
        market_bias: data.market_bias,
        trading_session: data.trading_session,
        confluences: data.confluences || [],
        entry_price: data.entry_price,
        stop_loss_price: data.stop_loss_price,
        take_profit_price: data.take_profit_price,
        position_size: data.position_size,
        lot_type: 'standard', // Default since we don't store this
        exit_reason: data.exit_reason as 'take_profit' | 'stop_loss' | 'manual_exit',
        mistakes: data.mistakes || []
      });
      
      setSelectedConfluences(data.confluences || []);
      setSelectedMistakes(data.mistakes || []);
      setSymbolSearch(data.symbol);
      
    } catch (error) {
      console.error('Error fetching trade:', error);
      toast.error('Failed to load trade data');
      navigate('/trades');
    } finally {
      setLoadingTrade(false);
    }
  }, [user?.id, reset, navigate]);

  const loadFormState = useCallback(() => {
    try {
      const savedState = localStorage.getItem('tradeFormState');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        Object.keys(parsedState).forEach(key => {
          if (parsedState[key] && key !== 'account_id') {
            setValue(key as keyof TradeFormData, parsedState[key]);
          }
        });
      }
    } catch (error) {
      console.error('Error loading form state:', error);
    }
  }, [setValue]);

  useEffect(() => {
    if (user) {
      fetchAccounts();
      fetchCurrencyPairs();
      
      if (tradeId) {
        // Edit mode - load existing trade
        fetchExistingTrade(tradeId);
      } else {
        // Create mode - load form state from localStorage
        loadFormState();
      }
    }
  }, [user, tradeId, fetchAccounts, fetchCurrencyPairs, fetchExistingTrade, loadFormState]);

  useEffect(() => {
    // Auto-select account if only one exists
    if (accounts.length === 1 && !watch('account_id')) {
      setValue('account_id', accounts[0]?.id || '');
    }
  }, [accounts, setValue, watch]);

  useEffect(() => {
    // Save form state to localStorage
    const subscription = watch((data) => {
      if (data.name || data.symbol) {
        localStorage.setItem('tradeFormState', JSON.stringify(data));
      }
    });
    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [watch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.symbol-dropdown-container')) {
        setShowSymbolDropdown(false);
      }
    };

    // Only add listener if needed
    if (showSymbolDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return undefined;
  }, [showSymbolDropdown]);

  useEffect(() => {
    setValue('confluences', selectedConfluences);
  }, [selectedConfluences, setValue]);

  useEffect(() => {
    setValue('mistakes', selectedMistakes);
  }, [selectedMistakes, setValue]);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clear any pending timeouts or intervals
      // Reset state to prevent stale closures
      setLoading(false);
      setLoadingTrade(false);
      setIsCreatingNewPair(false);
      setShowSymbolDropdown(false);
    };
  }, []);

  const filteredCurrencyPairs = useMemo(() => {
    return currencyPairs.filter(pair =>
      pair.symbol.toLowerCase().includes(symbolSearch.toLowerCase()) ||
      pair.name.toLowerCase().includes(symbolSearch.toLowerCase())
    );
  }, [currencyPairs, symbolSearch]);

  const handleSymbolSelect = useCallback((symbol: string) => {
    setValue('symbol', symbol.toUpperCase());
    setSymbolSearch(symbol.toUpperCase());
    setShowSymbolDropdown(false);
  }, [setValue]);

  const detectSymbolCategory = useCallback((symbol: string): string => {
    const upperSymbol = symbol.toUpperCase();
    
    // Crypto patterns
    if (upperSymbol.includes('BTC') || upperSymbol.includes('ETH') || upperSymbol.includes('ADA') || 
        upperSymbol.includes('DOT') || upperSymbol.includes('SOL') || upperSymbol.includes('DOGE') ||
        upperSymbol.includes('MATIC') || upperSymbol.includes('AVAX') || upperSymbol.includes('LINK')) {
      return 'crypto';
    }
    
    // Forex patterns (currency pairs - 6 characters, ends with major currencies)
    if (upperSymbol.length === 6 && 
        (upperSymbol.endsWith('USD') || upperSymbol.endsWith('EUR') || upperSymbol.endsWith('GBP') ||
         upperSymbol.endsWith('JPY') || upperSymbol.endsWith('CHF') || upperSymbol.endsWith('CAD') ||
         upperSymbol.endsWith('AUD') || upperSymbol.endsWith('NZD'))) {
      return 'forex';
    }
    
    // Commodities patterns
    if (upperSymbol.includes('GOLD') || upperSymbol.includes('SILVER') || upperSymbol.includes('OIL') ||
        upperSymbol.includes('GAS') || upperSymbol === 'XAUUSD' || upperSymbol === 'XAGUSD' ||
        upperSymbol.includes('WTI') || upperSymbol.includes('BRENT')) {
      return 'commodities';
    }
    
    // Default to stocks for single symbols or unknown patterns
    return 'stocks';
  }, []);

  const handleCreateNewPair = useCallback(async () => {
    if (!symbolSearch.trim()) return;
    
    setIsCreatingNewPair(true);
    try {
      const newSymbol = symbolSearch.toUpperCase();
      const detectedCategory = detectSymbolCategory(newSymbol);
      
      const { data, error } = await supabase
        .from('currency_pairs')
        .insert({
          symbol: newSymbol,
          name: newSymbol,
          category: detectedCategory,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      setCurrencyPairs(prev => [...prev, data]);
      handleSymbolSelect(newSymbol);
      toast.success(`Created new currency pair: ${newSymbol} (${detectedCategory})`);
    } catch (error) {
      console.error('Error creating currency pair:', error);
      toast.error('Failed to create new currency pair');
    } finally {
      setIsCreatingNewPair(false);
    }
  }, [symbolSearch, detectSymbolCategory, handleSymbolSelect]);

  const onSubmit = useCallback(async (data: TradeFormData) => {
    setLoading(true);
    try {
      // Comprehensive client-side validation
      const validationResult = validateTradeForm(data);
      if (!validationResult.isValid) {
        Object.entries(validationResult.errors).forEach(([field, error]) => {
          toast.error(`${field}: ${error}`);
        });
        setLoading(false);
        return;
      }

      // Additional validation for trading-specific logic
      const symbolValidation = validateTradingSymbol(data.symbol);
      if (!symbolValidation.isValid) {
        toast.error(symbolValidation.error || 'Invalid symbol');
        setLoading(false);
        return;
      }

      const entryPriceValidation = validatePrice(data.entry_price);
      if (!entryPriceValidation.isValid) {
        toast.error(entryPriceValidation.error || 'Invalid entry price');
        setLoading(false);
        return;
      }

      const stopLossValidation = validatePrice(data.stop_loss_price);
      if (!stopLossValidation.isValid) {
        toast.error(stopLossValidation.error || 'Invalid stop loss price');
        setLoading(false);
        return;
      }

      const takeProfitValidation = validatePrice(data.take_profit_price);
      if (!takeProfitValidation.isValid) {
        toast.error(takeProfitValidation.error || 'Invalid take profit price');
        setLoading(false);
        return;
      }

      const positionSizeValidation = validatePositionSize(data.position_size || 1.0);
      if (!positionSizeValidation.isValid) {
        toast.error(positionSizeValidation.error || 'Invalid position size');
        setLoading(false);
        return;
      }

      const datetimeValidation = validateDateTime(data.entry_datetime);
      if (!datetimeValidation.isValid) {
        toast.error(datetimeValidation.error || 'Invalid date/time');
        setLoading(false);
        return;
      }

      console.log('Form data being submitted:', data);
      console.log('Selected confluences:', selectedConfluences);
      console.log('Selected mistakes:', selectedMistakes);
      
      // Use validated and sanitized values
      const entryPrice = entryPriceValidation.sanitized;
      const positionSize = positionSizeValidation.sanitized;
      
      // Determine exit price and profitability based on actual exit reason
      let exitPrice: number;
      let isProfitable: boolean;
      let pnlAmount: number;
      
      // Use the actual exit reason to determine profitability and exit price
      if (data.exit_reason === 'take_profit') {
        exitPrice = data.take_profit_price;
        isProfitable = true;
      } else if (data.exit_reason === 'stop_loss') {
        exitPrice = data.stop_loss_price;
        isProfitable = false;
      } else {
        // Manual exit - determine profitability based on which price is closer to entry
        const tpDistance = Math.abs(data.take_profit_price - entryPrice);
        const slDistance = Math.abs(data.stop_loss_price - entryPrice);
        
        // Assume manual exit happened closer to the profitable target
        if (tpDistance < slDistance) {
          exitPrice = data.take_profit_price;
          isProfitable = true;
        } else {
          exitPrice = data.stop_loss_price;
          isProfitable = false;
        }
      }

      // Sanitize symbol first since it's needed for P&L calculation
      const sanitizedSymbol = symbolValidation.sanitized;
      
      // Calculate P&L using advanced forex calculations or simple calculation
      const isBullish = data.market_bias === 'bullish';
      const pnlResult = calculatePnL(
        entryPrice,
        exitPrice,
        positionSize,
        sanitizedSymbol,
        isBullish,
        data.lot_type || 'standard' // Use selected lot type or default to standard
      );
      
      pnlAmount = pnlResult.pnlAmount;
      
      // Log calculation details for debugging
      if (pnlResult.isForex && pnlResult.pipsGained !== undefined) {
        console.log(`Forex P&L calculation for ${sanitizedSymbol}:`, {
          entryPrice,
          exitPrice,
          positionSize,
          pipsGained: pnlResult.pipsGained,
          pnlAmount: pnlResult.pnlAmount,
          isBullish
        });
      } else {
        console.log(`Simple P&L calculation for ${sanitizedSymbol}:`, {
          entryPrice,
          exitPrice,
          positionSize,
          pnlAmount: pnlResult.pnlAmount,
          isBullish
        });
      }

      // Parse datetime into date and time components
      const entryDateTime = new Date(data.entry_datetime);
      const tradeDate = entryDateTime.toISOString().split('T')[0];
      const entryTime = entryDateTime.toISOString(); // Use full ISO timestamp for PostgreSQL TIMESTAMP WITH TIME ZONE

      // Sanitize all string inputs before database insertion
      const sanitizedTradeName = sanitizeString(data.name);
      const sanitizedNewsImpact = data.news_impact ? sanitizeString(data.news_impact) : null;
      const sanitizedMarketBias = sanitizeString(data.market_bias);
      const sanitizedTradingSession = sanitizeString(data.trading_session);
      
      // Sanitize array inputs
      const sanitizedConfluences = selectedConfluences.map(c => preventSQLInjection(sanitizeString(c)));
      const sanitizedMistakes = selectedMistakes.map(m => preventSQLInjection(sanitizeString(m)));

      let tradeData, tradeError;
      
      if (isEditMode && existingTrade) {
        // Update existing trade
        const updateResult = await supabase
          .from('trades')
          .update({
            account_id: sanitizeString(data.account_id),
            trade_name: sanitizedTradeName,
            trade_date: tradeDate,
            symbol: sanitizedSymbol,
            news_impact: sanitizedNewsImpact,
            market_bias: sanitizedMarketBias,
            trading_session: sanitizedTradingSession,
            entry_time: entryTime,
            entry_price: entryPrice,
            stop_loss_price: stopLossValidation.sanitized,
            take_profit_price: takeProfitValidation.sanitized,
            position_size: positionSize,
            is_profitable: isProfitable,
            exit_reason: data.exit_reason,
            confluences: sanitizedConfluences,
            mistakes: sanitizedMistakes,
            pnl_amount: pnlAmount
          })
          .eq('id', existingTrade.id)
          .eq('user_id', user?.id)
          .select()
          .single();
          
        tradeData = updateResult.data;
        tradeError = updateResult.error;
        
        if (tradeError) {
          console.error('Trade update error:', tradeError);
          throw tradeError;
        }
        
        console.log('Trade updated successfully:', tradeData);
        console.log('🔄 About to invalidate cache after trade update for userId:', user?.id);
        toast.success('Trade updated successfully!');
      } else {
        // Insert new trade
        const insertResult = await supabase
          .from('trades')
          .insert({
            user_id: user?.id,
            account_id: sanitizeString(data.account_id),
            trade_name: sanitizedTradeName,
            trade_date: tradeDate,
            symbol: sanitizedSymbol,
            news_impact: sanitizedNewsImpact,
            market_bias: sanitizedMarketBias,
            trading_session: sanitizedTradingSession,
            entry_time: entryTime,
            entry_price: entryPrice,
            stop_loss_price: stopLossValidation.sanitized,
            take_profit_price: takeProfitValidation.sanitized,
            position_size: positionSize,
            is_profitable: isProfitable,
            exit_reason: data.exit_reason,
            confluences: sanitizedConfluences,
            mistakes: sanitizedMistakes,
            pnl_amount: pnlAmount
          })
          .select()
          .single();
          
        tradeData = insertResult.data;
        tradeError = insertResult.error;
        
        if (tradeError) {
          console.error('Trade insertion error:', tradeError);
          throw tradeError;
        }
        
        console.log('Trade inserted successfully:', tradeData);
        toast.success('Trade logged successfully!');
      }
      
      // Invalidate cache for trades and accounts to refresh data immediately
      console.log('🔄 Calling cache invalidation for user:', user?.id);
      console.log('🔄 Operation type:', isEditMode ? 'UPDATE' : 'INSERT');
      console.log('🔄 Trade data:', tradeData);
      
      // Wait for cache invalidation to complete before navigating
      await cacheUtils.invalidateAfterTradeOperationAsync(user?.id || '');
      
      console.log('✅ Cache invalidation completed, now navigating to trades page');
      
      // Navigate to trades page to show the updated data
      navigate('/trades');
      
      localStorage.removeItem('tradeFormState');
      reset({
        confluences: [],
        mistakes: [],
        entry_datetime: new Date().toISOString().slice(0, 16)
      });
      setSelectedConfluences([]);
      setSelectedMistakes([]);
      setSymbolSearch('');
    } catch (error) {
      console.error('Error logging trade:', error);
      toast.error(`Failed to log trade: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedConfluences, selectedMistakes, reset, navigate]);

  const toggleConfluence = useCallback((confluence: string) => {
    setSelectedConfluences(prev => 
      prev.includes(confluence)
        ? prev.filter(c => c !== confluence)
        : [...prev, confluence]
    );
  }, []);

  const toggleMistake = useCallback((mistake: string) => {
    setSelectedMistakes(prev => 
      prev.includes(mistake)
        ? prev.filter(m => m !== mistake)
        : [...prev, mistake]
    );
  }, []);

  if (loadingTrade) {
    return (
      <Layout>
        <div className="p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-white">Loading trade data...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6 md:mb-8 text-center">
          {isEditMode ? 'Edit Trade' : 'Log Trade'}
        </h1>
        
        {accounts.length === 0 ? (
          <div className="max-w-2xl bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 md:p-6">
            <div className="flex items-start sm:items-center">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 mr-2 sm:mr-3 flex-shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-yellow-800">No Trading Accounts Found</h3>
                <p className="text-xs sm:text-sm text-yellow-700 mt-1">
                  You need to add a trading account before logging trades.
                </p>
                <Link
                  to="/accounts"
                  className="inline-flex items-center mt-2 sm:mt-3 text-xs sm:text-sm font-medium text-yellow-800 hover:text-yellow-900"
                >
                  <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Add Trading Account
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
          {/* Account Selection */}
          <div>
            <label className="block text-white font-medium mb-2 text-sm sm:text-base">Account</label>
            <select
              {...register('account_id')}
              className="w-full px-3 sm:px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent input-touch text-responsive-base"
            >
              <option value="">Select Account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.currency})
                </option>
              ))}
            </select>
            {errors.account_id && (
              <p className="text-red-400 text-xs sm:text-sm mt-1">{errors.account_id.message}</p>
            )}
          </div>

          {/* Trade Name */}
          <div>
            <label className="block text-white font-medium mb-2 text-sm sm:text-base">Trade Name</label>
            <input
              type="text"
              {...register('name')}
              className={`w-full px-3 sm:px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent input-touch text-responsive-base ${
                nameValidationError || errors.name 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-600 focus:ring-blue-500'
              }`}
              placeholder="Enter trade name (letters, spaces, hyphens, apostrophes only)"
            />
            {(nameValidationError || errors.name) && (
              <p className="text-red-400 text-xs sm:text-sm mt-1">
                {nameValidationError || errors.name?.message}
              </p>
            )}
            {watchedName && !nameValidationError && !errors.name && (
              <p className="text-green-400 text-xs sm:text-sm mt-1">✓ Valid trade name</p>
            )}
          </div>

          {/* Entry Date and Time */}
          <div>
            <label className="block text-white font-medium mb-2 text-sm sm:text-base">Entry Date & Time</label>
            <input
              type="datetime-local"
              {...register('entry_datetime')}
              className="w-full px-3 sm:px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent input-touch text-responsive-base"
            />
            {errors.entry_datetime && (
              <p className="text-red-400 text-xs sm:text-sm mt-1">{errors.entry_datetime.message}</p>
            )}
          </div>

          {/* Symbol - Searchable Currency Pairs */}
            <div className="relative symbol-dropdown-container">
              <label className="block text-white font-medium mb-2 text-sm sm:text-base">Currency Pair / Symbol *</label>
              <div className="relative">
                <input
                  type="text"
                  value={symbolSearch}
                  onChange={(e) => {
                    setSymbolSearch(e.target.value);
                    setShowSymbolDropdown(true);
                    setValue('symbol', e.target.value.toUpperCase());
                  }}
                  onFocus={() => setShowSymbolDropdown(true)}
                  placeholder="Search or type currency pair (e.g., EURUSD, AAPL, BTCUSD)"
                  className="w-full px-3 sm:px-4 py-3 pr-10 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent input-touch text-responsive-base"
                />
                <Search className="absolute right-3 top-3.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                
                {/* Dropdown */}
                {showSymbolDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-48 sm:max-h-60 overflow-auto">
                    {filteredCurrencyPairs.length > 0 ? (
                      filteredCurrencyPairs.map((pair) => (
                        <button
                          key={pair.id}
                          type="button"
                          onClick={() => handleSymbolSelect(pair.symbol)}
                          className="w-full px-3 py-3 sm:py-2 text-left hover:bg-gray-700 focus:bg-gray-700 focus:outline-none border-b border-gray-600 last:border-b-0 btn-touch"
                        >
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                            <div className="flex flex-col sm:flex-row sm:items-center">
                              <span className="font-medium text-white text-sm sm:text-base">{pair.symbol}</span>
                              <span className="text-xs sm:text-sm text-gray-400 sm:ml-2">{pair.name}</span>
                            </div>
                            <span className="text-xs text-gray-500 capitalize">{pair.category}</span>
                          </div>
                        </button>
                      ))
                    ) : symbolSearch.trim() ? (
                      <button
                        type="button"
                        onClick={handleCreateNewPair}
                        disabled={isCreatingNewPair}
                        className="w-full px-3 py-2 text-left hover:bg-gray-700 focus:bg-gray-700 focus:outline-none flex items-center text-blue-400"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {isCreatingNewPair ? 'Creating...' : `Create "${symbolSearch.toUpperCase()}"`}
                      </button>
                    ) : (
                      <div className="px-3 py-2 text-gray-400 text-sm">
                        Start typing to search currency pairs
                      </div>
                    )}
                  </div>
                )}
              </div>
              {errors.symbol && (
                <p className="text-red-400 text-xs sm:text-sm mt-1">{errors.symbol.message}</p>
              )}
            </div>

          {/* News Impact */}
          <div>
            <label className="block text-white font-medium mb-2 text-sm sm:text-base">News Impact</label>
            <select
              {...register('news_impact')}
              className="w-full px-3 sm:px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent input-touch text-responsive-base"
            >
              <option value="">Select news impact</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="none">None</option>
            </select>
            {errors.news_impact && (
              <p className="text-red-400 text-xs sm:text-sm mt-1">{errors.news_impact.message}</p>
            )}
          </div>

          {/* Market Bias and Trading Session Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-white font-medium mb-2 text-sm sm:text-base">Market Bias *</label>
              <select
                  {...register('market_bias')}
                  className="w-full px-3 sm:px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent input-touch text-responsive-base"
                >
                <option value="">Select market bias</option>
                <option value="bullish">Bullish</option>
                <option value="bearish">Bearish</option>
              </select>
              {errors.market_bias && (
                <p className="text-red-400 text-xs sm:text-sm mt-1">{errors.market_bias.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-white font-medium mb-2 text-sm sm:text-base">Trading Session *</label>
              <select
                  {...register('trading_session')}
                  className="w-full px-3 sm:px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent input-touch text-responsive-base"
                >
                <option value="">Select trading session</option>
                <option value="london">London</option>
                <option value="new_york">New York</option>
                <option value="tokyo">Tokyo</option>
                <option value="sydney">Sydney</option>
              </select>
              {errors.trading_session && (
                <p className="text-red-400 text-xs sm:text-sm mt-1">{errors.trading_session.message}</p>
              )}
            </div>
          </div>

          {/* Confluences */}
          <div>
            <label className="block text-white font-medium mb-2 text-sm sm:text-base">Confluences</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {CONFLUENCE_OPTIONS.map((confluence) => (
                <label key={confluence} className="flex items-center space-x-2 sm:space-x-3 cursor-pointer p-2 sm:p-1 hover:bg-gray-800 rounded touch-target">
                  <input
                    type="checkbox"
                    checked={selectedConfluences.includes(confluence)}
                    onChange={() => toggleConfluence(confluence)}
                    className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 w-4 h-4 sm:w-auto sm:h-auto"
                  />
                  <span className="text-white text-sm sm:text-sm">{confluence}</span>
                </label>
              ))}
            </div>
            {errors.confluences && (
              <p className="text-red-400 text-xs sm:text-sm mt-1">{errors.confluences.message}</p>
            )}
          </div>

          {/* Price Fields Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-white font-medium mb-2 text-sm sm:text-base">Entry Price *</label>
              <input
                  type="number"
                  step="0.00001"
                  {...register('entry_price', { valueAsNumber: true })}
                  className="w-full px-3 sm:px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent input-touch text-responsive-base"
                  placeholder="0.00000"
                />
              {errors.entry_price && (
                <p className="text-red-400 text-xs sm:text-sm mt-1">{errors.entry_price.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-white font-medium mb-2 text-sm sm:text-base">Stop Loss *</label>
              <input
                type="number"
                step="0.00001"
                {...register('stop_loss_price', { valueAsNumber: true })}
                className="w-full px-3 sm:px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent input-touch text-responsive-base"
                placeholder="0.00000"
              />
              {errors.stop_loss_price && (
                <p className="text-red-400 text-xs sm:text-sm mt-1">{errors.stop_loss_price.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-white font-medium mb-2 text-sm sm:text-base">Take Profit *</label>
              <input
                type="number"
                step="0.00001"
                {...register('take_profit_price', { valueAsNumber: true })}
                className="w-full px-3 sm:px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent input-touch text-responsive-base"
                placeholder="0.00000"
              />
              {errors.take_profit_price && (
                <p className="text-red-400 text-xs sm:text-sm mt-1">{errors.take_profit_price.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-white font-medium mb-2 text-sm sm:text-base">Position Size *</label>
              <input
                type="number"
                step="0.01"
                {...register('position_size', { valueAsNumber: true })}
                className="w-full px-3 sm:px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent input-touch text-responsive-base"
                placeholder="1.00"
                defaultValue="1.00"
              />
              {errors.position_size && (
                <p className="text-red-400 text-xs sm:text-sm mt-1">{errors.position_size.message}</p>
              )}
            </div>
          </div>

          {/* Lot Type for Forex Pairs */}
          {watch('symbol') && isForexPair(watch('symbol') || '') && (
            <div>
              <label className="block text-white font-medium mb-2 text-sm sm:text-base">Lot Type (Forex)</label>
              <select
                {...register('lot_type')}
                className="w-full px-3 sm:px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent input-touch text-responsive-base"
              >
                <option value="standard">Standard Lot (100,000 units)</option>
                <option value="mini">Mini Lot (10,000 units)</option>
                <option value="micro">Micro Lot (1,000 units)</option>
              </select>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">
                Lot size affects P&L calculation for forex pairs
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
          </div>

          {/* Exit Reason */}
          <div>
            <label className="block text-white font-medium mb-2 text-sm sm:text-base">Exit Reason *</label>
            <select
              {...register('exit_reason')}
              className="w-full px-3 sm:px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent input-touch text-responsive-base"
            >
              <option value="">Select exit reason</option>
              <option value="take_profit">Take Profit Hit</option>
              <option value="stop_loss">Stop Loss Hit</option>
              <option value="manual_exit">Manual Exit</option>
            </select>
            {errors.exit_reason && (
              <p className="text-red-400 text-xs sm:text-sm mt-1">{errors.exit_reason.message}</p>
            )}
          </div>

          {/* Mistakes */}
          <div>
            <label className="block text-white font-medium mb-2 text-sm sm:text-base">Mistakes (Optional)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {MISTAKE_OPTIONS.map((mistake) => (
                <label key={mistake} className="flex items-center space-x-2 sm:space-x-3 cursor-pointer p-2 sm:p-1 hover:bg-gray-800 rounded touch-target">
                  <input
                    type="checkbox"
                    checked={selectedMistakes.includes(mistake)}
                    onChange={() => toggleMistake(mistake)}
                    className="rounded border-gray-600 bg-gray-800 text-red-500 focus:ring-red-500 focus:ring-offset-0 w-4 h-4 sm:w-auto sm:h-auto"
                  />
                  <span className="text-white text-sm sm:text-sm">{mistake}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6">
            <button
              type="submit"
              disabled={loading}
              className="px-4 sm:px-6 py-3 sm:py-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors btn-touch text-responsive-base"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                  <span>{isEditMode ? 'Updating Trade...' : 'Logging Trade...'}</span>
                </>
              ) : (
                <span>{isEditMode ? 'Update Trade' : 'Log Trade'}</span>
              )}
            </button>
          </div>
        </form>
        )}
      </div>
    </Layout>
  );
});

export default TradeLog;