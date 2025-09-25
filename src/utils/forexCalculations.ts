export interface ForexPair {
  base: string;
  quote: string;
  pipValue: number;
  decimalPlaces: number;
}

export interface LotSize {
  standard: number;
  mini: number;
  micro: number;
}

export interface PnLCalculation {
  pnlAmount: number;
  pipsGained: number;
  pipValue: number;
  effectiveLotSize: number;
}

// Standard lot sizes in units
export const LOT_SIZES: LotSize = {
  standard: 100000,
  mini: 10000,
  micro: 1000
};

// Major forex pairs and their characteristics
export const FOREX_PAIRS: Record<string, ForexPair> = {
  // Major pairs (4 decimal places, pip = 0.0001)
  'EURUSD': { base: 'EUR', quote: 'USD', pipValue: 0.0001, decimalPlaces: 4 },
  'GBPUSD': { base: 'GBP', quote: 'USD', pipValue: 0.0001, decimalPlaces: 4 },
  'AUDUSD': { base: 'AUD', quote: 'USD', pipValue: 0.0001, decimalPlaces: 4 },
  'NZDUSD': { base: 'NZD', quote: 'USD', pipValue: 0.0001, decimalPlaces: 4 },
  'USDCAD': { base: 'USD', quote: 'CAD', pipValue: 0.0001, decimalPlaces: 4 },
  'USDCHF': { base: 'USD', quote: 'CHF', pipValue: 0.0001, decimalPlaces: 4 },
  
  // JPY pairs (2 decimal places, pip = 0.01)
  'USDJPY': { base: 'USD', quote: 'JPY', pipValue: 0.01, decimalPlaces: 2 },
  'EURJPY': { base: 'EUR', quote: 'JPY', pipValue: 0.01, decimalPlaces: 2 },
  'GBPJPY': { base: 'GBP', quote: 'JPY', pipValue: 0.01, decimalPlaces: 2 },
  'AUDJPY': { base: 'AUD', quote: 'JPY', pipValue: 0.01, decimalPlaces: 2 },
  'NZDJPY': { base: 'NZD', quote: 'JPY', pipValue: 0.01, decimalPlaces: 2 },
  'CADJPY': { base: 'CAD', quote: 'JPY', pipValue: 0.01, decimalPlaces: 2 },
  'CHFJPY': { base: 'CHF', quote: 'JPY', pipValue: 0.01, decimalPlaces: 2 },
  
  // Cross pairs
  'EURGBP': { base: 'EUR', quote: 'GBP', pipValue: 0.0001, decimalPlaces: 4 },
  'EURAUD': { base: 'EUR', quote: 'AUD', pipValue: 0.0001, decimalPlaces: 4 },
  'EURNZD': { base: 'EUR', quote: 'NZD', pipValue: 0.0001, decimalPlaces: 4 },
  'EURCAD': { base: 'EUR', quote: 'CAD', pipValue: 0.0001, decimalPlaces: 4 },
  'EURCHF': { base: 'EUR', quote: 'CHF', pipValue: 0.0001, decimalPlaces: 4 },
  'GBPAUD': { base: 'GBP', quote: 'AUD', pipValue: 0.0001, decimalPlaces: 4 },
  'GBPNZD': { base: 'GBP', quote: 'NZD', pipValue: 0.0001, decimalPlaces: 4 },
  'GBPCAD': { base: 'GBP', quote: 'CAD', pipValue: 0.0001, decimalPlaces: 4 },
  'GBPCHF': { base: 'GBP', quote: 'CHF', pipValue: 0.0001, decimalPlaces: 4 },
  'AUDCAD': { base: 'AUD', quote: 'CAD', pipValue: 0.0001, decimalPlaces: 4 },
  'AUDCHF': { base: 'AUD', quote: 'CHF', pipValue: 0.0001, decimalPlaces: 4 },
  'AUDNZD': { base: 'AUD', quote: 'NZD', pipValue: 0.0001, decimalPlaces: 4 },
  'NZDCAD': { base: 'NZD', quote: 'CAD', pipValue: 0.0001, decimalPlaces: 4 },
  'NZDCHF': { base: 'NZD', quote: 'CHF', pipValue: 0.0001, decimalPlaces: 4 },
  'CADCHF': { base: 'CAD', quote: 'CHF', pipValue: 0.0001, decimalPlaces: 4 }
};

/**
 * Checks if a symbol is a forex pair
 */
export function isForexPair(symbol: string): boolean {
  const normalizedSymbol = symbol.toUpperCase().replace(/[^A-Z]/g, '');
  return normalizedSymbol in FOREX_PAIRS;
}

/**
 * Gets forex pair information
 */
export function getForexPairInfo(symbol: string): ForexPair | null {
  const normalizedSymbol = symbol.toUpperCase().replace(/[^A-Z]/g, '');
  return FOREX_PAIRS[normalizedSymbol] || null;
}

/**
 * Converts position size to actual units based on lot type
 */
export function convertPositionSizeToUnits(positionSize: number, lotType: 'standard' | 'mini' | 'micro' = 'standard'): number {
  return positionSize * LOT_SIZES[lotType];
}

/**
 * Calculates the number of pips between two prices
 */
export function calculatePips(entryPrice: number, exitPrice: number, pairInfo: ForexPair): number {
  const priceDifference = Math.abs(exitPrice - entryPrice);
  return priceDifference / pairInfo.pipValue;
}

/**
 * Calculates pip value in account currency (assuming USD account)
 */
export function calculatePipValueInUSD(pairInfo: ForexPair, lotSizeInUnits: number): number {
  // For USD quote currency pairs (e.g., EURUSD, GBPUSD)
  if (pairInfo.quote === 'USD') {
    return (pairInfo.pipValue * lotSizeInUnits);
  }
  
  // For USD base currency pairs (e.g., USDCAD, USDCHF)
  if (pairInfo.base === 'USD') {
    // This would require current exchange rate for accurate calculation
    // For now, we'll use a simplified approach
    return (pairInfo.pipValue * lotSizeInUnits);
  }
  
  // For cross pairs (e.g., EURGBP, EURJPY)
  // This would require current exchange rates for accurate calculation
  // For now, we'll use a simplified approach assuming 1:1 conversion
  return (pairInfo.pipValue * lotSizeInUnits);
}

/**
 * Calculates advanced forex P&L
 */
export function calculateForexPnL(
  entryPrice: number,
  exitPrice: number,
  positionSize: number,
  symbol: string,
  isBullish: boolean,
  lotType: 'standard' | 'mini' | 'micro' = 'standard'
): PnLCalculation {
  const pairInfo = getForexPairInfo(symbol);
  
  if (!pairInfo) {
    throw new Error(`Unknown forex pair: ${symbol}`);
  }
  
  // Convert position size to actual units
  const lotSizeInUnits = convertPositionSizeToUnits(positionSize, lotType);
  
  // Calculate pips gained/lost
  const pipsGained = calculatePips(entryPrice, exitPrice, pairInfo);
  
  // Determine if trade was profitable based on direction
  const isProfit = isBullish ? (exitPrice > entryPrice) : (exitPrice < entryPrice);
  const adjustedPips = isProfit ? pipsGained : -pipsGained;
  
  // Calculate pip value in USD
  const pipValueInUSD = calculatePipValueInUSD(pairInfo, lotSizeInUnits);
  
  // Calculate final P&L
  const pnlAmount = adjustedPips * pipValueInUSD;
  
  return {
    pnlAmount: Math.round(pnlAmount * 100) / 100, // Round to 2 decimal places
    pipsGained: Math.round(adjustedPips * 10) / 10, // Round to 1 decimal place
    pipValue: pipValueInUSD,
    effectiveLotSize: lotSizeInUnits
  };
}

/**
 * Simple P&L calculation for non-forex instruments
 */
export function calculateSimplePnL(
  entryPrice: number,
  exitPrice: number,
  positionSize: number,
  isBullish: boolean
): number {
  if (isBullish) {
    return (exitPrice - entryPrice) * positionSize;
  } else {
    return (entryPrice - exitPrice) * positionSize;
  }
}

/**
 * Main P&L calculation function that determines whether to use forex or simple calculation
 */
export function calculatePnL(
  entryPrice: number,
  exitPrice: number,
  positionSize: number,
  symbol: string,
  isBullish: boolean,
  lotType: 'standard' | 'mini' | 'micro' = 'standard'
): { pnlAmount: number; isForex: boolean; pipsGained?: number } {
  if (isForexPair(symbol)) {
    const forexResult = calculateForexPnL(entryPrice, exitPrice, positionSize, symbol, isBullish, lotType);
    return {
      pnlAmount: forexResult.pnlAmount,
      isForex: true,
      pipsGained: forexResult.pipsGained
    };
  } else {
    const simplePnL = calculateSimplePnL(entryPrice, exitPrice, positionSize, isBullish);
    return {
      pnlAmount: Math.round(simplePnL * 100) / 100,
      isForex: false
    };
  }
}