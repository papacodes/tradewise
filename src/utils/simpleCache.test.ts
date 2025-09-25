import { SimpleCache, CacheTTL } from './simpleCache';

// Mock localStorage for testing
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: function(key: string) {
    return this.store[key] || null;
  },
  setItem: function(key: string, value: string) {
    this.store[key] = value;
  },
  removeItem: function(key: string) {
    delete this.store[key];
  },
  clear: function() {
    this.store = {};
  }
};

// Override global localStorage and Object.keys to work with our mock
(global as any).localStorage = localStorageMock;

// Override Object.keys to work with localStorage mock
const originalObjectKeys = Object.keys;
Object.keys = function(obj: any) {
  if (obj === localStorage) {
    return originalObjectKeys(localStorageMock.store);
  }
  return originalObjectKeys(obj);
};

// Helper to get all cache keys (unused but kept for potential future use)
// function getAllCacheKeys(): string[] {
//   return Object.keys(localStorageMock.store).filter(key => key.startsWith('app_cache_'));
// }

/**
 * Test SimpleCache functionality
 */
function testSimpleCache() {
  console.log('🧪 Testing SimpleCache implementation...');
  
  // Clear any existing cache
  SimpleCache.clear();
  
  // Test 1: Basic set and get
  console.log('\n📝 Test 1: Basic set and get');
  const testData = { name: 'John', age: 30 };
  SimpleCache.set('user:1', testData, CacheTTL.MEDIUM);
  
  const retrieved = SimpleCache.get('user:1');
  console.log('Set data:', testData);
  console.log('Retrieved data:', retrieved);
  console.log('✅ Basic set/get:', JSON.stringify(retrieved) === JSON.stringify(testData));
  
  // Test 2: TTL expiration
  console.log('\n⏰ Test 2: TTL expiration');
  SimpleCache.set('temp:data', 'temporary', 100); // 100ms TTL
  
  setTimeout(() => {
    const expired = SimpleCache.get('temp:data');
    console.log('Data after TTL expiration:', expired);
    console.log('✅ TTL expiration:', expired === null);
  }, 150);
  
  // Test 3: has() method
  console.log('\n🔍 Test 3: has() method');
  console.log('Has user:1:', SimpleCache.has('user:1'));
  console.log('Has nonexistent:', SimpleCache.has('nonexistent'));
  console.log('✅ has() method works correctly');
  
  // Test 4: Pattern invalidation
  console.log('\n🗑️ Test 4: Pattern invalidation');
  SimpleCache.clear(); // Start fresh
  SimpleCache.set('user:1', { name: 'John' });
  SimpleCache.set('user:2', { name: 'Jane' });
  SimpleCache.set('post:1', { title: 'Hello' });
  
  console.log('Before invalidation:');
  console.log('- user:1 exists:', SimpleCache.has('user:1'));
  console.log('- user:2 exists:', SimpleCache.has('user:2'));
  console.log('- post:1 exists:', SimpleCache.has('post:1'));
  
  SimpleCache.invalidatePattern('user:');
  
  console.log('After invalidating "user:" pattern:');
  console.log('- user:1 exists:', SimpleCache.has('user:1'));
  console.log('- user:2 exists:', SimpleCache.has('user:2'));
  console.log('- post:1 exists:', SimpleCache.has('post:1'));
  
  const patternWorked = !SimpleCache.has('user:1') && !SimpleCache.has('user:2') && SimpleCache.has('post:1');
  console.log('✅ Pattern invalidation:', patternWorked ? 'works correctly' : 'failed');
  
  // Test 5: Cache statistics
  console.log('\n📊 Test 5: Cache statistics');
  SimpleCache.clear();
  SimpleCache.set('item1', 'data1');
  SimpleCache.set('item2', 'data2');
  
  const stats = SimpleCache.getStats();
  console.log('Cache stats:', stats);
  console.log('✅ Statistics:', stats.size === 2);
  
  // Test 6: Clear all
  console.log('\n🧹 Test 6: Clear all');
  SimpleCache.clear();
  const statsAfterClear = SimpleCache.getStats();
  console.log('Stats after clear:', statsAfterClear);
  console.log('✅ Clear all:', statsAfterClear.size === 0);
  
  console.log('\n🎉 SimpleCache tests completed!');
}

// Run tests
testSimpleCache();

// Test with actual data types
function testDataTypes() {
  console.log('\n🔢 Testing different data types...');
  
  // Test with different data types
  const testCases = [
    { key: 'string', value: 'Hello World' },
    { key: 'number', value: 42 },
    { key: 'boolean', value: true },
    { key: 'array', value: [1, 2, 3, 'test'] },
    { key: 'object', value: { nested: { data: 'value' } } },
    { key: 'null', value: null },
    { key: 'undefined', value: undefined }
  ];
  
  testCases.forEach(({ key, value }) => {
    SimpleCache.set(key, value);
    const retrieved = SimpleCache.get(key);
    const matches = JSON.stringify(retrieved) === JSON.stringify(value);
    console.log(`${key}: ${matches ? '✅' : '❌'} (${typeof value})`);
  });
}

testDataTypes();

export { testSimpleCache };