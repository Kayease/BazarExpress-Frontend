// Debug script for dropdown issues
// Run this in the browser console on the products page

console.log('🔍 Debugging Filter Dropdowns...');

// Test 1: Check if dropdown elements exist
const checkDropdownElements = () => {
  console.log('📋 Test 1: Checking dropdown elements...');
  
  const brandDropdown = document.querySelector('.brand-dropdown');
  const sortDropdown = document.querySelector('.sort-dropdown');
  const priceDropdown = document.querySelector('.price-dropdown');
  
  console.log('Brand dropdown container:', brandDropdown);
  console.log('Sort dropdown container:', sortDropdown);
  console.log('Price dropdown container:', priceDropdown);
  
  if (brandDropdown) {
    const brandButton = brandDropdown.querySelector('button');
    const brandDropdownContent = brandDropdown.querySelector('.absolute');
    console.log('Brand button:', brandButton);
    console.log('Brand dropdown content:', brandDropdownContent);
  }
  
  if (sortDropdown) {
    const sortButton = sortDropdown.querySelector('button');
    const sortDropdownContent = sortDropdown.querySelector('.absolute');
    console.log('Sort button:', sortButton);
    console.log('Sort dropdown content:', sortDropdownContent);
  }
  
  if (priceDropdown) {
    const priceButton = priceDropdown.querySelector('button');
    const priceDropdownContent = priceDropdown.querySelector('.absolute');
    console.log('Price button:', priceButton);
    console.log('Price dropdown content:', priceDropdownContent);
  }
};

// Test 2: Check button click events
const testButtonClicks = () => {
  console.log('📋 Test 2: Testing button clicks...');
  
  const brandButton = document.querySelector('.brand-dropdown button');
  const sortButton = document.querySelector('.sort-dropdown button');
  const priceButton = document.querySelector('.price-dropdown button');
  
  if (brandButton) {
    console.log('Brand button found, adding test click listener...');
    brandButton.addEventListener('click', (e) => {
      console.log('🎯 Brand button clicked!', e);
    });
  }
  
  if (sortButton) {
    console.log('Sort button found, adding test click listener...');
    sortButton.addEventListener('click', (e) => {
      console.log('🎯 Sort button clicked!', e);
    });
  }
  
  if (priceButton) {
    console.log('Price button found, adding test click listener...');
    priceButton.addEventListener('click', (e) => {
      console.log('🎯 Price button clicked!', e);
    });
  }
};

// Test 3: Check for CSS issues
const checkCSSIssues = () => {
  console.log('📋 Test 3: Checking CSS issues...');
  
  const dropdownContents = document.querySelectorAll('.absolute');
  dropdownContents.forEach((content, index) => {
    const styles = window.getComputedStyle(content);
    console.log(`Dropdown content ${index}:`, {
      display: styles.display,
      visibility: styles.visibility,
      opacity: styles.opacity,
      zIndex: styles.zIndex,
      position: styles.position,
      top: styles.top,
      right: styles.right
    });
  });
};

// Test 4: Force show dropdowns for testing
const forceShowDropdowns = () => {
  console.log('📋 Test 4: Force showing dropdowns...');
  
  const dropdownContents = document.querySelectorAll('.absolute');
  dropdownContents.forEach((content, index) => {
    content.style.display = 'block';
    content.style.visibility = 'visible';
    content.style.opacity = '1';
    content.style.zIndex = '9999';
    console.log(`Forced dropdown ${index} to be visible`);
  });
  
  setTimeout(() => {
    console.log('Hiding forced dropdowns...');
    dropdownContents.forEach((content) => {
      content.style.display = '';
      content.style.visibility = '';
      content.style.opacity = '';
      content.style.zIndex = '';
    });
  }, 3000);
};

// Test 5: Check React component state
const checkReactState = () => {
  console.log('📋 Test 5: Checking React component state...');
  
  // Try to find React fiber node
  const brandDropdown = document.querySelector('.brand-dropdown');
  if (brandDropdown) {
    const reactFiber = Object.keys(brandDropdown).find(key => key.startsWith('__reactFiber'));
    if (reactFiber) {
      console.log('React fiber found, checking component state...');
      // This is a simplified check - actual implementation may vary
    } else {
      console.log('React fiber not found on dropdown element');
    }
  }
};

// Run all tests
const runAllTests = () => {
  console.log('🚀 Starting Dropdown Debug Tests...\n');
  
  checkDropdownElements();
  console.log('');
  
  testButtonClicks();
  console.log('');
  
  checkCSSIssues();
  console.log('');
  
  console.log('🎉 Debug tests completed!');
  console.log('💡 Now try clicking the filter buttons and check the console.');
  console.log('💡 Run window.debugDropdowns.forceShow() to test visibility.');
};

// Export functions for manual testing
window.debugDropdowns = {
  runAll: runAllTests,
  checkElements: checkDropdownElements,
  testClicks: testButtonClicks,
  checkCSS: checkCSSIssues,
  forceShow: forceShowDropdowns,
  checkState: checkReactState
};

// Auto-run tests
runAllTests();

console.log('💡 Available debug functions:');
console.log('- window.debugDropdowns.runAll()');
console.log('- window.debugDropdowns.checkElements()');
console.log('- window.debugDropdowns.testClicks()');
console.log('- window.debugDropdowns.checkCSS()');
console.log('- window.debugDropdowns.forceShow()');
console.log('- window.debugDropdowns.checkState()');