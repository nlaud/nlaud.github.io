// Block Ctrl/Cmd + plus/minus/equals
document.addEventListener('keydown', function (e) {
  if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '_'].includes(e.key)) {
    e.preventDefault();
  }
}, false);

// Block Ctrl/Cmd + mousewheel zoom
document.addEventListener('wheel', function (e) {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
  }
}, { passive: false });

// Prevent pinch-zoom
document.addEventListener('touchmove', function (e) {
  if (e.scale && e.scale !== 1) {
    e.preventDefault();
  }
}, { passive: false });

// Prevent double-tap zoom (iOS)
let lastTouchEnd = 0;
document.addEventListener('touchend', function (e) {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) {
    e.preventDefault();
  }
  lastTouchEnd = now;
}, false);
