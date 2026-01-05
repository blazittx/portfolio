import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
  isYouTubeUrl,
} from "../../utils/youtube";
import {
  buildOptimizedSrcSet,
  getOptimizedImageUrl,
  getOptimizedThumbnailUrl,
} from "../../utils/images";

/* eslint-disable react/prop-types */
export default function MediaCarousel({
  media = [],
  title = "Media",
  layout = "auto",
  currentIndex,
  onIndexChange,
  autoAdvance = false,
  pauseAutoAdvance = false,
  isVideoPlaying = false,
  imageIntervalMs = 5000,
  videoIntervalMs = 10000,
  fadeDurationMs = 360,
  carouselId = "carousel",
  videoEmbedOptions,
  onVideoIframeRef,
}) {
  const isControlled = typeof currentIndex === "number";
  const initialIndex = useMemo(() => {
    if (!media.length) return 0;
    const youtubeIndex = media.findIndex(
      (item) => item.type === "video" && isYouTubeUrl(item.url)
    );
    return youtubeIndex >= 0 ? youtubeIndex : 0;
  }, [media]);

  const mediaSignature = useMemo(
    () => media.map((item) => `${item.type}:${item.url}`).join("|"),
    [media]
  );

  const [internalIndex, setInternalIndex] = useState(initialIndex);
  const activeIndex = isControlled ? currentIndex : internalIndex;
  const setIndex = useCallback(
    (nextIndex) => {
      if (!media.length) return;
      const clamped =
        ((nextIndex % media.length) + media.length) % media.length;
      if (!isControlled) {
        setInternalIndex(clamped);
      }
      if (onIndexChange) {
        onIndexChange(clamped);
      }
    },
    [media, isControlled, onIndexChange]
  );

  const [isHovered, setIsHovered] = useState(false);
  const [isVideoInteracted, setIsVideoInteracted] = useState(false);
  const [previousMedia, setPreviousMedia] = useState(null);
  const lastIndexRef = useRef(0);
  const hasSetInitialRef = useRef(false);
  const fadeTimeoutRef = useRef(null);
  const thumbnailContainerRef = useRef(null);
  const thumbnailRefs = useRef({});
  const containerRef = useRef(null);
  const [isTall, setIsTall] = useState(false);

  const defaultIndex = initialIndex;

  useEffect(() => {
    hasSetInitialRef.current = false;
  }, [mediaSignature]);

  useEffect(() => {
    if (!isControlled) return;
    if (hasSetInitialRef.current) return;
    if (typeof currentIndex !== "number" || currentIndex === initialIndex) {
      hasSetInitialRef.current = true;
      return;
    }
    if (onIndexChange) {
      onIndexChange(initialIndex);
    }
    hasSetInitialRef.current = true;
  }, [isControlled, currentIndex, initialIndex, onIndexChange]);

  useEffect(() => {
    if (isControlled) return;
    if (!media.length) {
      setInternalIndex(0);
      return;
    }
    setInternalIndex(initialIndex);
  }, [mediaSignature, initialIndex, isControlled, media.length]);

  useEffect(() => {
    if (!document.getElementById("media-carousel-keyframes")) {
      const style = document.createElement("style");
      style.id = "media-carousel-keyframes";
      style.textContent = `
        @keyframes mediaFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes mediaFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    if (!document.getElementById("media-carousel-scrollbar-hide")) {
      const style = document.createElement("style");
      style.id = "media-carousel-scrollbar-hide";
      style.textContent = `
        [data-thumbnail-container] {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        [data-thumbnail-container]::-webkit-scrollbar {
          display: none;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    if (!media.length) {
      setPreviousMedia(null);
      lastIndexRef.current = 0;
      return;
    }

    const lastIndex = lastIndexRef.current;
    if (lastIndex !== activeIndex && media[lastIndex]) {
      const lastMedia = media[lastIndex];
      setPreviousMedia({
        media: lastMedia,
        key: `${carouselId}-${lastIndex}-${lastMedia.type}-${Date.now()}`,
      });

      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }

      fadeTimeoutRef.current = setTimeout(() => {
        setPreviousMedia(null);
      }, fadeDurationMs);
    }

    lastIndexRef.current = activeIndex;
  }, [activeIndex, media, carouselId, fadeDurationMs]);

  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const element = containerRef.current;

    const updateLayout = () => {
      const { width, height } = element.getBoundingClientRect();
      if (width && height) {
        setIsTall(height > width);
      }
    };

    updateLayout();
    const observer = new ResizeObserver(updateLayout);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const effectiveLayout =
    layout === "auto" ? (isTall ? "horizontal" : "vertical") : layout;

  useEffect(() => {
    if (effectiveLayout !== "vertical") return;
    if (!media.length) return;
    const element = thumbnailRefs.current[activeIndex];
    const container = thumbnailContainerRef.current;
    if (!element || !container || isHovered) return;

    setTimeout(() => {
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const scrollTop =
        element.offsetTop -
        container.offsetTop -
        containerRect.height / 2 +
        elementRect.height / 2;

      container.scrollTo({
        top: scrollTop,
        behavior: "smooth",
      });
    }, 50);
  }, [activeIndex, effectiveLayout, media.length, isHovered]);

  useEffect(() => {
    setIsVideoInteracted(false);
  }, [activeIndex, mediaSignature]);

  useEffect(() => {
    if (!autoAdvance || media.length <= 1) return;
    if (pauseAutoAdvance || isHovered || isVideoPlaying || isVideoInteracted)
      return;

    const current = media[activeIndex];
    const baseDelay =
      current && current.type === "video" ? videoIntervalMs : imageIntervalMs;
    const jitter = baseDelay * 0.2;
    const delay = Math.max(
      0,
      Math.round(baseDelay + (Math.random() * 2 - 1) * jitter)
    );
    const timer = setTimeout(() => {
      setIndex(activeIndex + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [
    autoAdvance,
    pauseAutoAdvance,
    isHovered,
    media,
    activeIndex,
    imageIntervalMs,
    videoIntervalMs,
    isVideoPlaying,
    isVideoInteracted,
    setIndex,
  ]);

  if (!media.length) {
    return null;
  }

  const currentMedia = media[activeIndex];
  const mediaKey = `${carouselId}-${activeIndex}-${currentMedia.type}`;
  const mediaWrapperStyle = {
    width: "100%",
    height: "100%",
    position: "absolute",
    inset: 0,
    willChange: "opacity",
  };

  const shouldPrioritize =
    activeIndex === defaultIndex && currentMedia.type === "image";

  const renderImage = (url, altText, priority) => {
    const optimizedSrc = getOptimizedImageUrl(url, {
      width: 1400,
      format: "webp",
      quality: 70,
    });
    const optimizedSrcSet = buildOptimizedSrcSet(url, [600, 900, 1200, 1400], {
      format: "webp",
      quality: 70,
    });

    return (
      <img
        src={optimizedSrc}
        srcSet={optimizedSrcSet}
        sizes="(max-width: 900px) 100vw, (max-width: 1400px) 70vw, 60vw"
        alt={altText}
        draggable="false"
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "low"}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          userSelect: "none",
        }}
        onDragStart={(e) => e.preventDefault()}
        onMouseDown={(e) => e.stopPropagation()}
        onError={(e) => {
          e.target.src = "https://via.placeholder.com/800x600?text=Game+Image";
        }}
      />
    );
  };

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: effectiveLayout === "vertical" ? "row" : "column",
        gap: "0.5rem",
        height: "100%",
        width: "100%",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          position: "relative",
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          overflow: "hidden",
          borderRadius: "4px",
          background: "color-mix(in hsl, canvasText, transparent 98%)",
        }}
      >
        {previousMedia && previousMedia.media.type === "image" ? (
          <div
            key={`prev-${previousMedia.key}`}
            style={{
              ...mediaWrapperStyle,
              zIndex: 1,
              animation: `mediaFadeOut ${fadeDurationMs}ms ease`,
              pointerEvents: "none",
            }}
          >
            {renderImage(previousMedia.media.url, "", false)}
          </div>
        ) : null}
        <div
          key={mediaKey}
          style={{
            ...mediaWrapperStyle,
            zIndex: 2,
            animation: `mediaFadeIn ${fadeDurationMs}ms ease`,
          }}
        >
          {currentMedia.type === "video" && isYouTubeUrl(currentMedia.url) ? (
            <iframe
              ref={(el) => {
                if (onVideoIframeRef) {
                  const key = `${carouselId}-${activeIndex}`;
                  onVideoIframeRef(key, el);
                }
              }}
              src={getYouTubeEmbedUrl(currentMedia.url, {
                autoplay: 0,
                controls: 1,
                rel: 0,
                ...(videoEmbedOptions || {}),
              })}
              title={`${title} - Video`}
              loading="lazy"
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                display: "block",
              }}
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onMouseDown={(e) => {
                e.stopPropagation();
                setIsVideoInteracted(true);
              }}
            />
          ) : (
            renderImage(
              currentMedia.url,
              `${title} - Image ${activeIndex + 1}`,
              shouldPrioritize
            )
          )}
        </div>
      </div>

      <div
        ref={thumbnailContainerRef}
        data-thumbnail-container
        style={{
          display: "flex",
          flexDirection: effectiveLayout === "vertical" ? "column" : "row",
          gap: "0.5rem",
          overflowX: effectiveLayout === "horizontal" ? "hidden" : "hidden",
          overflowY: effectiveLayout === "vertical" ? "auto" : "hidden",
          paddingRight: effectiveLayout === "vertical" ? "0.25rem" : undefined,
          paddingBottom:
            effectiveLayout === "horizontal" ? "0.25rem" : undefined,
          flexShrink: 0,
          flexWrap: effectiveLayout === "horizontal" ? "wrap" : "nowrap",
          justifyContent:
            effectiveLayout === "horizontal" ? "flex-start" : "flex-start",
          width: effectiveLayout === "vertical" ? "60px" : "auto",
          touchAction: "pan-y",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {media.map((item, index) => {
          const isActive = index === activeIndex;
          const thumbnailUrl =
            item.type === "video"
              ? getYouTubeThumbnailUrl(item.url)
              : getOptimizedThumbnailUrl(item.url, 120) || item.url;
          const srcSet =
            item.type === "video"
              ? undefined
              : buildOptimizedSrcSet(item.url, [60, 120], {
                  format: "webp",
                  quality: 70,
                });

          return (
            <div
              key={`${carouselId}-thumb-${index}`}
              ref={(el) => {
                if (el) thumbnailRefs.current[index] = el;
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIndex(index);
              }}
              onMouseUp={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              style={{
                position: "relative",
                width: "60px",
                height: "60px",
                flexShrink: 0,
                borderRadius: "4px",
                overflow: "hidden",
                cursor: "pointer",
                border: isActive
                  ? "2px solid canvasText"
                  : "2px solid transparent",
                opacity: isActive ? 1 : 0.7,
                transition: "opacity 0.2s ease, border-color 0.2s ease",
                background: "color-mix(in hsl, canvasText, transparent 98%)",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.opacity = "0.9";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.opacity = "0.7";
                }
              }}
            >
              <img
                src={
                  thumbnailUrl ||
                  (item.type === "video"
                    ? "https://via.placeholder.com/60x60?text=Video"
                    : "https://via.placeholder.com/60x60?text=Image")
                }
                srcSet={srcSet}
                sizes="60px"
                alt={`${title} - Thumbnail ${index + 1}`}
                draggable="false"
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  userSelect: "none",
                }}
                onDragStart={(e) => e.preventDefault()}
                onMouseDown={(e) => e.stopPropagation()}
                onError={(e) => {
                  e.target.src =
                    item.type === "video"
                      ? "https://via.placeholder.com/60x60?text=Video"
                      : "https://via.placeholder.com/60x60?text=Image";
                }}
              />
              {item.type === "video" ? (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: "rgba(0, 0, 0, 0.7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="white"
                    style={{ marginLeft: "2px" }}
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
