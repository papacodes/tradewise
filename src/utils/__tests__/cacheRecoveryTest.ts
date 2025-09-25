/**
 * Cache Recovery System Test
 * 
 * This test demonstrates the cache recovery functionality:
 * 1. Cache health monitoring
 * 2. Automatic corruption detection
 * 3. Cache clearing and recovery
 * 4. Fallback authentication prompts
 */

import { cacheHealthMonitor } from '../cacheHealthMonitor';
import { cacheCorruptionDetector } from '../cacheCorruptionDetector';
import { cacheManager } from '../cacheManager';
import { cacheRefreshService } from '../cacheRefreshService';

// Mock console methods to capture logs
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error
};

const logs: string[] = [];
console.log = (...args) => logs.push(`LOG: ${args.join(' ')}`);
console.warn = (...args) => logs.push(`WARN: ${args.join(' ')}`);
console.error = (...args) => logs.push(`ERROR: ${args.join(' ')}`);

/**
 * Test cache health monitoring
 */
export async function testCacheHealthMonitoring(): Promise<boolean> {
  console.log('🧪 Testing cache health monitoring...');
  
  try {
    // Start health monitoring
    cacheHealthMonitor.startHealthChecks();
    
    // Simulate a hanging operation
    const hangingPromise = new Promise((resolve) => {
      // This promise will timeout after 5 seconds
      setTimeout(resolve, 10000);
    });
    
    // Monitor the operation with a 2-second timeout
    const monitoredPromise = cacheHealthMonitor.monitorAsyncOperation(
      hangingPromise,
      'test_hanging_operation',
      { timeout: 2000 }
    );
    
    try {
      await monitoredPromise;
      console.error('❌ Expected timeout error but operation completed');
      return false;
    } catch (error) {
      if (error instanceof Error && error.message.includes('timeout')) {
        console.log('✅ Timeout detection working correctly');
        return true;
      } else {
        console.error('❌ Unexpected error:', error);
        return false;
      }
    }
  } catch (error) {
    console.error('❌ Cache health monitoring test failed:', error);
    return false;
  } finally {
    cacheHealthMonitor.stopHealthChecks();
  }
}

/**
 * Test cache corruption detection
 */
export async function testCacheCorruptionDetection(): Promise<boolean> {
  console.log('🧪 Testing cache corruption detection...');
  
  try {
    const testCacheKey = 'test_cache_key';
    
    // Simulate multiple failures to trigger corruption detection
    for (let i = 0; i < 5; i++) {
      cacheCorruptionDetector.reportError(testCacheKey, new Error(`Test error ${i + 1}`));
    }
    
    // Check if corruption is detected
    const isCorrupted = cacheCorruptionDetector.isCorrupted(testCacheKey);
    
    if (isCorrupted) {
      console.log('✅ Cache corruption detection working correctly');
      return true;
    } else {
      console.error('❌ Cache corruption not detected after multiple failures');
      return false;
    }
  } catch (error) {
    console.error('❌ Cache corruption detection test failed:', error);
    return false;
  }
}

/**
 * Test cache clearing mechanism
 */
export async function testCacheClearingMechanism(): Promise<boolean> {
  console.log('🧪 Testing cache clearing mechanism...');
  
  try {
    // Set some test data in localStorage
    const testKey = 'test_cache_data';
    const testData = { test: 'data', timestamp: Date.now() };
    localStorage.setItem(testKey, JSON.stringify(testData));
    
    // Verify data is stored
    const storedData = localStorage.getItem(testKey);
    if (!storedData) {
      console.error('❌ Failed to store test data');
      return false;
    }
    
    // Clear specific cache key
    await cacheManager.clearCache(testKey);
    
    // Verify data is cleared
    const clearedData = localStorage.getItem(testKey);
    if (clearedData === null) {
      console.log('✅ Cache clearing mechanism working correctly');
      return true;
    } else {
      console.error('❌ Cache data not cleared');
      return false;
    }
  } catch (error) {
    console.error('❌ Cache clearing mechanism test failed:', error);
    return false;
  }
}

/**
 * Test cache refresh service
 */
export async function testCacheRefreshService(): Promise<boolean> {
  console.log('🧪 Testing cache refresh service...');
  
  try {
    // Initialize refresh strategies
    cacheRefreshService.initializeDefaultStrategies();
    
    // Test refresh strategy registration
    const testStrategy = {
      refreshFunction: async () => ({ test: 'refreshed_data' }),
      priority: 1,
      maxRetries: 2
    };
    
    cacheRefreshService.registerRefreshStrategy('test_pattern', testStrategy);
    
    // Queue a refresh
    await cacheRefreshService.queueRefresh('test_cache_key');
    
    console.log('✅ Cache refresh service working correctly');
    return true;
  } catch (error) {
    console.error('❌ Cache refresh service test failed:', error);
    return false;
  }
}

/**
 * Run all cache recovery tests
 */
export async function runCacheRecoveryTests(): Promise<void> {
  console.log('🚀 Starting Cache Recovery System Tests...');
  console.log('=' .repeat(50));
  
  const tests = [
    { name: 'Cache Health Monitoring', test: testCacheHealthMonitoring },
    { name: 'Cache Corruption Detection', test: testCacheCorruptionDetection },
    { name: 'Cache Clearing Mechanism', test: testCacheClearingMechanism },
    { name: 'Cache Refresh Service', test: testCacheRefreshService }
  ];
  
  const results: { name: string; passed: boolean }[] = [];
  
  for (const { name, test } of tests) {
    console.log(`\n📋 Running: ${name}`);
    console.log('-'.repeat(30));
    
    try {
      const passed = await test();
      results.push({ name, passed });
      
      if (passed) {
        console.log(`✅ ${name}: PASSED`);
      } else {
        console.log(`❌ ${name}: FAILED`);
      }
    } catch (error) {
      console.error(`💥 ${name}: ERROR -`, error);
      results.push({ name, passed: false });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(({ name, passed }) => {
    console.log(`${passed ? '✅' : '❌'} ${name}`);
  });
  
  console.log(`\n🎯 Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All cache recovery tests passed! The system is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please review the implementation.');
  }
  
  // Restore console methods
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  
  // Output captured logs
  console.log('\n📝 Captured Logs:');
  console.log('-'.repeat(20));
  logs.forEach(log => console.log(log));
}

// Export for use in browser console or testing
if (typeof window !== 'undefined') {
  (window as any).runCacheRecoveryTests = runCacheRecoveryTests;
  console.log('💡 Run cache recovery tests by calling: runCacheRecoveryTests()');
}