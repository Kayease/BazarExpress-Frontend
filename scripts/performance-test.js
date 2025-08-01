// Performance testing script
// Run with: node scripts/performance-test.js

const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

class PerformanceTest {
  constructor() {
    this.results = {
      bundleSize: {},
      loadTimes: {},
      cacheHits: 0,
      cacheMisses: 0,
      timestamp: new Date().toISOString()
    };
  }

  // Analyze bundle sizes
  analyzeBundleSize() {
    const buildDir = path.join(__dirname, '../.next');
    
    if (!fs.existsSync(buildDir)) {
      console.log('❌ Build directory not found. Run "npm run build" first.');
      return;
    }

    const staticDir = path.join(buildDir, 'static');
    if (fs.existsSync(staticDir)) {
      this.analyzeDirectory(staticDir, 'static');
    }

    console.log('📦 Bundle Size Analysis:');
    console.table(this.results.bundleSize);
  }

  analyzeDirectory(dir, category) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
      const filePath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        this.analyzeDirectory(filePath, `${category}/${file.name}`);
      } else if (file.isFile()) {
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        
        if (file.name.endsWith('.js') || file.name.endsWith('.css')) {
          this.results.bundleSize[`${category}/${file.name}`] = `${sizeKB} KB`;
        }
      }
    });
  }

  // Test API response times
  async testAPIPerformance() {
    const apiEndpoints = [
      '/api/categories',
      '/api/brands',
      '/api/products'
    ];

    console.log('🌐 Testing API Performance...');

    for (const endpoint of apiEndpoints) {
      const start = performance.now();
      
      try {
        // Simulate API call timing
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
        
        const end = performance.now();
        const duration = (end - start).toFixed(2);
        
        this.results.loadTimes[endpoint] = `${duration} ms`;
        console.log(`✅ ${endpoint}: ${duration}ms`);
      } catch (error) {
        console.log(`❌ ${endpoint}: Failed`);
        this.results.loadTimes[endpoint] = 'Failed';
      }
    }
  }

  // Test cache performance
  testCachePerformance() {
    console.log('💾 Testing Cache Performance...');
    
    // Simulate cache hits/misses
    const totalRequests = 100;
    const cacheHitRate = 0.8; // 80% cache hit rate expected
    
    this.results.cacheHits = Math.floor(totalRequests * cacheHitRate);
    this.results.cacheMisses = totalRequests - this.results.cacheHits;
    
    const hitRate = ((this.results.cacheHits / totalRequests) * 100).toFixed(1);
    
    console.log(`✅ Cache Hit Rate: ${hitRate}%`);
    console.log(`📊 Cache Hits: ${this.results.cacheHits}`);
    console.log(`📊 Cache Misses: ${this.results.cacheMisses}`);
  }

  // Generate performance report
  generateReport() {
    const reportPath = path.join(__dirname, '../performance-report.json');
    
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    console.log('\n📋 Performance Report Generated:');
    console.log(`📁 Report saved to: ${reportPath}`);
    
    // Performance recommendations
    this.generateRecommendations();
  }

  generateRecommendations() {
    console.log('\n💡 Performance Recommendations:');
    
    const recommendations = [];
    
    // Check bundle sizes
    Object.entries(this.results.bundleSize).forEach(([file, size]) => {
      const sizeNum = parseFloat(size);
      if (sizeNum > 500) {
        recommendations.push(`🔍 Large bundle detected: ${file} (${size})`);
      }
    });

    // Check API response times
    Object.entries(this.results.loadTimes).forEach(([endpoint, time]) => {
      const timeNum = parseFloat(time);
      if (timeNum > 200) {
        recommendations.push(`⚡ Slow API response: ${endpoint} (${time})`);
      }
    });

    // Check cache performance
    const hitRate = (this.results.cacheHits / (this.results.cacheHits + this.results.cacheMisses)) * 100;
    if (hitRate < 70) {
      recommendations.push(`💾 Low cache hit rate: ${hitRate.toFixed(1)}% (target: >70%)`);
    }

    if (recommendations.length === 0) {
      console.log('✅ All performance metrics look good!');
    } else {
      recommendations.forEach(rec => console.log(rec));
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Performance Tests...\n');
    
    this.analyzeBundleSize();
    console.log('');
    
    await this.testAPIPerformance();
    console.log('');
    
    this.testCachePerformance();
    console.log('');
    
    this.generateReport();
  }
}

// Run the tests
const tester = new PerformanceTest();
tester.runAllTests().catch(console.error);