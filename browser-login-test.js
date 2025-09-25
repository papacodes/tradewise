// Comprehensive login and dashboard test script
// Run this in browser console on the login page

(async function testLoginAndDashboard() {
  console.log('🚀 Starting comprehensive login and dashboard test...');
  
  // Check if we're on the login page
  if (!window.location.pathname.includes('/login')) {
    console.log('❌ Please run this script on the login page (/login)');
    return;
  }
  
  // Step 1: Fill in login form
  console.log('📝 Step 1: Filling login form...');
  
  const emailInput = document.querySelector('input[type="email"], input[name="email"]');
  const passwordInput = document.querySelector('input[type="password"], input[name="password"]');
  const submitButton = document.querySelector('button[type="submit"], button:contains("Sign In")');
  
  if (!emailInput || !passwordInput) {
    console.log('❌ Could not find email or password input fields');
    console.log('Available inputs:', document.querySelectorAll('input'));
    return;
  }
  
  // Use test credentials (replace with actual test account)
  const testEmail = 'test@example.com';
  // Load environment variables if available
const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';
  
  console.log('⚠️ Using test credentials:', testEmail);
  console.log('⚠️ Make sure this test account exists in your Supabase project');
  
  // Fill the form
  emailInput.value = testEmail;
  emailInput.dispatchEvent(new Event('input', { bubbles: true }));
  emailInput.dispatchEvent(new Event('change', { bubbles: true }));
  
  passwordInput.value = testPassword;
  passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
  passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
  
  console.log('✅ Form filled with test credentials');
  
  // Step 2: Set up monitoring before submitting
  console.log('👂 Step 2: Setting up monitoring...');
  
  let authStateChanges = [];
  let navigationEvents = [];
  let loadingStates = [];
  
  // Monitor auth state changes
  const originalConsoleLog = console.log;
  console.log = function(...args) {
    const message = args.join(' ');
    if (message.includes('AuthContext:') || message.includes('ProtectedRoute:')) {
      authStateChanges.push({ timestamp: Date.now(), message });
    }
    originalConsoleLog.apply(console, args);
  };
  
  // Monitor navigation
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    navigationEvents.push({ timestamp: Date.now(), type: 'pushState', url: args[2] });
    return originalPushState.apply(history, args);
  };
  
  history.replaceState = function(...args) {
    navigationEvents.push({ timestamp: Date.now(), type: 'replaceState', url: args[2] });
    return originalReplaceState.apply(history, args);
  };
  
  // Monitor for loading elements
  const checkForLoadingElements = () => {
    const loadingElements = document.querySelectorAll('.animate-spin, [class*="loading"], [class*="spinner"]');
    if (loadingElements.length > 0) {
      loadingStates.push({
        timestamp: Date.now(),
        count: loadingElements.length,
        elements: Array.from(loadingElements).map(el => ({
          tagName: el.tagName,
          className: el.className,
          textContent: el.textContent?.substring(0, 30)
        }))
      });
    }
  };
  
  // Check for loading elements every 500ms
  const loadingInterval = setInterval(checkForLoadingElements, 500);
  
  // Step 3: Submit the form
  console.log('🔐 Step 3: Submitting login form...');
  
  if (submitButton) {
    submitButton.click();
  } else {
    // Try to find and submit the form
    const form = document.querySelector('form');
    if (form) {
      form.dispatchEvent(new Event('submit', { bubbles: true }));
    } else {
      console.log('❌ Could not find submit button or form');
      return;
    }
  }
  
  console.log('⏳ Login submitted, monitoring for 15 seconds...');
  
  // Step 4: Monitor for 15 seconds
  setTimeout(() => {
    clearInterval(loadingInterval);
    
    console.log('📊 === LOGIN AND DASHBOARD TEST RESULTS ===');
    console.log('🔄 Auth State Changes:', authStateChanges);
    console.log('🧭 Navigation Events:', navigationEvents);
    console.log('⏳ Loading States Detected:', loadingStates);
    console.log('📍 Final URL:', window.location.href);
    console.log('📄 Final Page Title:', document.title);
    
    // Check current page content
    const h1Elements = document.querySelectorAll('h1');
    const h2Elements = document.querySelectorAll('h2');
    const currentLoadingElements = document.querySelectorAll('.animate-spin, [class*="loading"], [class*="spinner"]');
    
    console.log('📄 Current H1 elements:', Array.from(h1Elements).map(el => el.textContent));
    console.log('📄 Current H2 elements:', Array.from(h2Elements).map(el => el.textContent));
    console.log('⏳ Current loading elements:', currentLoadingElements.length);
    
    if (currentLoadingElements.length > 0) {
      console.log('🔍 Loading elements details:', Array.from(currentLoadingElements).map(el => ({
        tagName: el.tagName,
        className: el.className,
        textContent: el.textContent?.substring(0, 50),
        parentElement: el.parentElement?.tagName
      })));
    }
    
    // Check localStorage for auth data
    const authKeys = Object.keys(localStorage).filter(key => 
      key.includes('auth') || key.includes('supabase') || key.includes('session')
    );
    
    console.log('🔑 Auth localStorage keys:', authKeys);
    authKeys.forEach(key => {
      const value = localStorage.getItem(key);
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object') {
          console.log(`📦 ${key}:`, {
            hasUser: !!parsed.user,
            hasSession: !!parsed.session,
            userEmail: parsed.user?.email || 'N/A'
          });
        }
      } catch {
        console.log(`📦 ${key}:`, 'Could not parse');
      }
    });
    
    console.log('✅ Test completed!');
    
    // Restore original functions
    console.log = originalConsoleLog;
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
    
  }, 15000);
  
})();

console.log('✅ Login and dashboard test script loaded. The test will run automatically.');