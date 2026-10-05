module.exports = {
  globDirectory: 'dist',
  globPatterns: [
    '**/*.{html,js,json,png,ico,svg,webp,woff,woff2,ttf}',
  ],
  globIgnores: ['sw.js', 'workbox-*.js'],
  swDest: 'dist/sw.js',
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  skipWaiting: true,
  navigateFallback: '/index.html',
  navigateFallbackDenylist: [/^\/(?:manifest\.json|sw\.js|workbox-.*\.js)$/],
};
