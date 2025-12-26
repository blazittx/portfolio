/**
 * Extract YouTube video ID from various YouTube URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID
 */
export function extractYouTubeVideoId(url) {
  if (!url || typeof url !== 'string') return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Check if a URL is a YouTube URL
 */
export function isYouTubeUrl(url) {
  return extractYouTubeVideoId(url) !== null;
}

/**
 * Convert YouTube URL to embed URL
 */
export function getYouTubeEmbedUrl(url, options = {}) {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  
  const params = new URLSearchParams();
  if (options.autoplay) params.append('autoplay', '1');
  if (options.mute) params.append('mute', '1');
  if (options.loop) params.append('loop', '1');
  if (options.controls !== undefined) params.append('controls', options.controls ? '1' : '0');
  if (options.rel !== undefined) params.append('rel', options.rel ? '1' : '0');
  // Enable JavaScript API for volume control and event listening
  params.append('enablejsapi', '1');
  params.append('origin', window.location.origin);
  
  const queryString = params.toString();
  return `https://www.youtube.com/embed/${videoId}${queryString ? `?${queryString}` : ''}`;
}

/**
 * Set volume for a YouTube iframe (volume is 0-100)
 */
export function setYouTubeVolume(iframe, volume) {
  if (!iframe || !iframe.contentWindow) return;
  
  try {
    // YouTube IFrame API postMessage command to set volume
    iframe.contentWindow.postMessage(
      JSON.stringify({
        event: 'command',
        func: 'setVolume',
        args: [volume]
      }),
      'https://www.youtube.com'
    );
  } catch (error) {
    console.warn('Failed to set YouTube volume:', error);
  }
}

/**
 * Get YouTube thumbnail URL
 */
export function getYouTubeThumbnailUrl(url, quality = 'hqdefault') {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  
  // Quality options: default, mqdefault, hqdefault, sddefault, maxresdefault
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

