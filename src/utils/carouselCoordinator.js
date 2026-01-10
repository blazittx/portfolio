/**
 * Carousel Coordinator
 * 
 * Manages timing for multiple carousels to prevent simultaneous switches.
 * Each carousel gets a unique, consistent offset based on its ID, ensuring
 * staggered transitions that feel natural and less confusing.
 */

// Track active carousels and their scheduled switch times
const carouselSchedule = new Map();
const MIN_STAGGER_DELAY = 1500; // Minimum milliseconds between carousel switches
const BASE_STAGGER_RANGE = 3000; // Base range for deterministic offset (ms)
const RANDOM_JITTER = 200; // Small random jitter to prevent perfect sync (ms)

/**
 * Generate a consistent numeric hash from a string ID
 * This ensures the same carousel always gets the same offset
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get a staggered delay for a carousel based on its ID
 * This ensures different carousels switch at different times with a consistent offset
 */
export function getStaggeredDelay(carouselId, baseDelay) {
  // Generate a consistent offset based on carousel ID (0 to BASE_STAGGER_RANGE)
  const hash = hashString(carouselId);
  const deterministicOffset = hash % BASE_STAGGER_RANGE;
  
  // Add a small random jitter to prevent perfect synchronization
  const jitter = (Math.random() - 0.5) * RANDOM_JITTER;
  
  // Combine base delay, deterministic offset, and small jitter
  return baseDelay + deterministicOffset + jitter;
}

/**
 * Schedule a carousel switch and check for conflicts
 * Returns the actual delay to use (may be adjusted to avoid conflicts)
 */
export function scheduleSwitch(carouselId, requestedDelay) {
  const now = Date.now();
  const requestedTime = now + requestedDelay;
  
  // Check if this time conflicts with other scheduled switches
  let adjustedTime = requestedTime;
  let attempts = 0;
  const maxAttempts = 20; // Increased to handle more carousels
  
  while (attempts < maxAttempts) {
    // Check for conflicts within MIN_STAGGER_DELAY
    let hasConflict = false;
    let nearestConflict = Infinity;
    
    for (const [id, scheduledTime] of carouselSchedule.entries()) {
      if (id !== carouselId) {
        const timeDiff = Math.abs(adjustedTime - scheduledTime);
        if (timeDiff < MIN_STAGGER_DELAY) {
          hasConflict = true;
          // Track the nearest conflict to shift past it
          if (scheduledTime > adjustedTime && scheduledTime < nearestConflict) {
            nearestConflict = scheduledTime;
          }
        }
      }
    }
    
    if (!hasConflict) {
      break;
    }
    
    // Shift the time forward to avoid the conflict
    if (nearestConflict !== Infinity) {
      adjustedTime = nearestConflict + MIN_STAGGER_DELAY;
    } else {
      adjustedTime += MIN_STAGGER_DELAY;
    }
    attempts++;
  }
  
  // Store the scheduled time
  carouselSchedule.set(carouselId, adjustedTime);
  
  // Return the adjusted delay
  return Math.max(0, adjustedTime - now);
}

/**
 * Clear a scheduled switch (when carousel is paused or unmounted)
 */
export function clearScheduledSwitch(carouselId) {
  carouselSchedule.delete(carouselId);
}
