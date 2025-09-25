// Simple script to check current authentication state and page content
// Run this in browser console

(function checkAuthAndPageState() {
  console.log('🔍 Checking authentication state and page content...');
  
  console.log('📍 Current URL:', window.location.href);
  console.log('📍 Current pathname:', window.location.pathname);
  
  // Check if we're on a protected route
  const protectedRoutes = ['/dashboard', '/accounts', '/trades', '/analytics', '/profile'];
  const isProtectedRoute = protectedRoutes.some(route => window.location.pathname.startsWith(route));
  
  console.log('🔒 Is protected route:', isProtectedRoute);
  
  // Check localStorage for any auth tokens
  const authKeys = Object.keys(localStorage).filter(key => 
    key.includes('auth') || key.includes('supabase') || key.includes('session')
  );
  
  console.log('🔑 Auth-related localStorage keys:', authKeys);
  
  authKeys.forEach(key => {
    const value = localStorage.getItem(key);
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') {
        console.log(`📦 ${key}:`, {
          hasUser: !!parsed.user,
          hasSession: !!parsed.session,
          userEmail: parsed.user?.email || 'N/A',
          expiresAt: parsed.session?.expires_at || 'N/A'
        });
      } else {
        console.log(`📦 ${key}:`, parsed);
      }
    } catch {
      console.log(`📦 ${key}:`, value?.substring(0, 100) + '...');
    }
  });
  
  // Check page content
  const pageTitle = document.title;
  const h1Elements = document.querySelectorAll('h1');
  const h2Elements = document.querySelectorAll('h2');
  const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"], .animate-spin');
  
  console.log('📄 Page title:', pageTitle);
  console.log('📄 H1 elements:', Array.from(h1Elements).map(el => el.textContent));
  console.log('📄 H2 elements:', Array.from(h2Elements).map(el => el.textContent));
  console.log('⏳ Loading elements found:', loadingElements.length);
  
  if (loadingElements.length > 0) {
    console.log('⏳ Loading elements:', Array.from(loadingElements).map(el => ({
      tagName: el.tagName,
      className: el.className,
      textContent: el.textContent?.substring(0, 50)
    })));
  }
  
  // Check for any error messages
  const errorElements = document.querySelectorAll('[class*="error"], [class*="red"], [role="alert"]');
  if (errorElements.length > 0) {
    console.log('❌ Error elements found:', Array.from(errorElements).map(el => el.textContent));
  }
  
  // Check if React is loaded and working
  console.log('⚛️ React DevTools available:', !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
  
  console.log('✅ Auth and page state check complete.');
})();