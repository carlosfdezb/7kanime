import { useEffect, useRef, useCallback, useState } from 'react';
import { useTVFocus } from '../context/TVFocusContext';
import { isTVBrowser } from '../utils/tvDetection';

interface TVNavigationOptions {
  containerRef: React.RefObject<HTMLElement | null>;
}

interface TVNavigationResult {
  focusedIndex: number;
  containerProps: Record<string, unknown>;
  getItemProps: (index: number) => Record<string, unknown>;
}

interface GamepadState {
  polling: boolean;
  lastButtons: boolean[];
}

export function useTVNavigation({
  containerRef,
}: TVNavigationOptions): TVNavigationResult {
  const { isTVMode, enableTVMode, disableTVMode } = useTVFocus();
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const gamepadRef = useRef<GamepadState>({
    polling: false,
    lastButtons: [],
  });

  // Get all focusable elements within the container
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>('[data-tv-focus]')
    );
  }, [containerRef]);

  // Find the closest element below the current one (ArrowDown)
  // Prioritizes elements in same "column" (horizontal overlap), then by vertical distance
  const findClosestBelow = useCallback(
    (currentEl: HTMLElement, elements: HTMLElement[]): HTMLElement | null => {
      const currentRect = currentEl.getBoundingClientRect();
      const currentBottom = currentRect.bottom;
      const currentLeft = currentRect.left;
      const currentRight = currentRect.right;
      const currentWidth = currentRect.width;

      // Filter elements that are below (top > current bottom - small buffer)
      // and overlap horizontally with current element
      const candidates = elements.filter((el) => {
        if (el === currentEl) return false;
        const rect = el.getBoundingClientRect();
        // Element is below if its top is past current bottom
        const isBelow = rect.top >= currentBottom - 5;
        // Horizontal overlap: any part of the element is under current
        const overlapsHorizontally =
          rect.left < currentRight - 10 && rect.right > currentLeft + 10;
        return isBelow && overlapsHorizontally;
      });

      if (candidates.length === 0) {
        // Fallback: find any element below, ignoring horizontal overlap
        const anyBelow = elements.filter((el) => {
          if (el === currentEl) return false;
          const rect = el.getBoundingClientRect();
          return rect.top >= currentBottom - 5;
        });
        if (anyBelow.length === 0) return null;
        // Sort by vertical distance
        anyBelow.sort((a, b) => {
          return a.getBoundingClientRect().top - b.getBoundingClientRect().top;
        });
        return anyBelow[0];
      }

      // Sort by horizontal closeness, then vertical distance
      candidates.sort((a, b) => {
        const rectA = a.getBoundingClientRect();
        const rectB = b.getBoundingClientRect();
        // Horizontal distance from center
        const aCenterX = rectA.left + rectA.width / 2;
        const bCenterX = rectB.left + rectB.width / 2;
        const currentCenterX = currentLeft + currentWidth / 2;
        const distA = Math.abs(aCenterX - currentCenterX);
        const distB = Math.abs(bCenterX - currentCenterX);
        // If horizontal distance is similar, prefer the one closer vertically
        if (Math.abs(distA - distB) > 50) {
          return distA - distB;
        }
        return rectA.top - rectB.top;
      });

      return candidates[0];
    },
    []
  );

  // Find the closest element above the current one (ArrowUp)
  const findClosestAbove = useCallback(
    (currentEl: HTMLElement, elements: HTMLElement[]): HTMLElement | null => {
      const currentRect = currentEl.getBoundingClientRect();
      const currentTop = currentRect.top;
      const currentLeft = currentRect.left;
      const currentRight = currentRect.right;
      const currentWidth = currentRect.width;

      // Filter elements that are above (bottom < current top)
      // and overlap horizontally
      const candidates = elements.filter((el) => {
        if (el === currentEl) return false;
        const rect = el.getBoundingClientRect();
        const isAbove = rect.bottom <= currentTop + 5;
        const overlapsHorizontally =
          rect.left < currentRight - 10 && rect.right > currentLeft + 10;
        return isAbove && overlapsHorizontally;
      });

      if (candidates.length === 0) {
        // Fallback: find any element above
        const anyAbove = elements.filter((el) => {
          if (el === currentEl) return false;
          const rect = el.getBoundingClientRect();
          return rect.bottom <= currentTop + 5;
        });
        if (anyAbove.length === 0) return null;
        // Sort by vertical distance (closest from top)
        anyAbove.sort((a, b) => {
          const rectA = a.getBoundingClientRect();
          const rectB = b.getBoundingClientRect();
          return rectB.bottom - rectA.bottom;
        });
        return anyAbove[0];
      }

      // Sort by horizontal closeness, then vertical distance
      candidates.sort((a, b) => {
        const rectA = a.getBoundingClientRect();
        const rectB = b.getBoundingClientRect();
        const aCenterX = rectA.left + rectA.width / 2;
        const bCenterX = rectB.left + rectB.width / 2;
        const currentCenterX = currentLeft + currentWidth / 2;
        const distA = Math.abs(aCenterX - currentCenterX);
        const distB = Math.abs(bCenterX - currentCenterX);
        if (Math.abs(distA - distB) > 50) {
          return distA - distB;
        }
        // For up, sort by which is higher (smaller bottom value)
        return rectB.bottom - rectA.bottom;
      });

      return candidates[0];
    },
    []
  );

  // Scroll element into view if needed
  const scrollIntoViewIfNeeded = useCallback((el: HTMLElement) => {
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Check if element is outside viewport
    const isAbove = rect.top < 0;
    const isBelow = rect.bottom > viewportHeight;
    const isLeft = rect.left < 0;
    const isRight = rect.right > viewportWidth;

    if (isAbove || isBelow || isLeft || isRight) {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    }
  }, []);

  // Get element index in the focusable elements list
  const getElementIndex = useCallback(
    (el: HTMLElement): number => {
      const elements = getFocusableElements();
      return elements.indexOf(el);
    },
    [getFocusableElements]
  );

  // Auto-enable TV mode on TV browsers
  useEffect(() => {
    if (isTVBrowser()) {
      enableTVMode();
    }
  }, [enableTVMode]);

  // Auto-focus first element when TV mode activates
  useEffect(() => {
    if (isTVMode && focusedIndex === -1) {
      const elements = getFocusableElements();
      if (elements.length > 0) {
        setFocusedIndex(0);
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          const el = elements[0];
          if (el) {
            el.focus();
            scrollIntoViewIfNeeded(el);
          }
        }, 50);
      }
    }
  }, [isTVMode, focusedIndex, getFocusableElements, scrollIntoViewIfNeeded]);

  // Reset focused index when TV mode is disabled
  useEffect(() => {
    if (!isTVMode) {
      setFocusedIndex(-1);
      (window as any).__tvFocusedId = undefined;
      window.dispatchEvent(new CustomEvent('tv-focus-change'));
    }
  }, [isTVMode]);

  // Dispatch focus change event when focusedIndex changes
  useEffect(() => {
    if (isTVMode && focusedIndex >= 0) {
      const elements = getFocusableElements();
      if (elements[focusedIndex]) {
        const el = elements[focusedIndex];
        const id = el.getAttribute('data-tv-focus-id');
        if (id) {
          (window as any).__tvFocusedId = id;
          window.dispatchEvent(new CustomEvent('tv-focus-change'));
        }
      }
    }
  }, [focusedIndex, isTVMode, getFocusableElements]);

  // Keyboard handler
  useEffect(() => {
    if (!isTVMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const elements = getFocusableElements();
      if (elements.length === 0) return;

      // Get current focused element
      let currentEl: HTMLElement | null = null;
      if (focusedIndex >= 0 && focusedIndex < elements.length) {
        currentEl = elements[focusedIndex];
      }

      switch (e.key) {
        case 'ArrowRight': {
          e.preventDefault();
          const nextIndex = focusedIndex + 1;
          if (nextIndex < elements.length) {
            setFocusedIndex(nextIndex);
            const nextEl = elements[nextIndex];
            nextEl.focus();
            scrollIntoViewIfNeeded(nextEl);
          } else if (focusedIndex === elements.length - 1) {
            // Wrap to first
            setFocusedIndex(0);
            const firstEl = elements[0];
            firstEl.focus();
            scrollIntoViewIfNeeded(firstEl);
          }
          break;
        }

        case 'ArrowLeft': {
          e.preventDefault();
          if (focusedIndex > 0) {
            const prevIndex = focusedIndex - 1;
            setFocusedIndex(prevIndex);
            const prevEl = elements[prevIndex];
            prevEl.focus();
            scrollIntoViewIfNeeded(prevEl);
          } else if (focusedIndex === 0) {
            // Wrap to last
            const lastIndex = elements.length - 1;
            setFocusedIndex(lastIndex);
            const lastEl = elements[lastIndex];
            lastEl.focus();
            scrollIntoViewIfNeeded(lastEl);
          }
          break;
        }

        case 'ArrowDown': {
          e.preventDefault();
          if (!currentEl) {
            if (elements.length > 0) {
              setFocusedIndex(0);
              elements[0].focus();
              scrollIntoViewIfNeeded(elements[0]);
            }
            return;
          }
          const closestBelow = findClosestBelow(currentEl, elements);
          if (closestBelow) {
            const idx = getElementIndex(closestBelow);
            setFocusedIndex(idx);
            closestBelow.focus();
            scrollIntoViewIfNeeded(closestBelow);
          }
          break;
        }

        case 'ArrowUp': {
          e.preventDefault();
          if (!currentEl) {
            if (elements.length > 0) {
              const lastIndex = elements.length - 1;
              setFocusedIndex(lastIndex);
              elements[lastIndex].focus();
              scrollIntoViewIfNeeded(elements[lastIndex]);
            }
            return;
          }
          const closestAbove = findClosestAbove(currentEl, elements);
          if (closestAbove) {
            const idx = getElementIndex(closestAbove);
            setFocusedIndex(idx);
            closestAbove.focus();
            scrollIntoViewIfNeeded(closestAbove);
          }
          break;
        }

        case 'Enter': {
          e.preventDefault();
          if (currentEl) {
            currentEl.click();
          }
          break;
        }

        case 'Escape':
        case 'Backspace': {
          // If in fullscreen, exit first
          if (document.fullscreenElement) {
            document.exitFullscreen();
            return;
          }
          e.preventDefault();
          disableTVMode();
          break;
        }

        case 'f':
        case 'F':
        case '0': {
          // Fullscreen toggle - works when player is focused or any time in TV mode
          e.preventDefault();
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            const playerWrapper = document.querySelector('[data-player-fullscreen="true"]');
            if (playerWrapper) {
              playerWrapper.requestFullscreen();
            }
          }
          break;
        }

        case 'MediaPlayPause': {
          e.preventDefault();
          // Try to send play/pause to iframe if possible
          const iframe = document.querySelector('.playerWrapper iframe') as HTMLIFrameElement | null;
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage('{"action":"playpause"}', '*');
          }
          break;
        }

        case 'MediaStop': {
          e.preventDefault();
          // Try to stop the video
          const iframe = document.querySelector('.playerWrapper iframe') as HTMLIFrameElement | null;
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage('{"action":"stop"}', '*');
          }
          break;
        }

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isTVMode,
    focusedIndex,
    getFocusableElements,
    findClosestBelow,
    findClosestAbove,
    getElementIndex,
    scrollIntoViewIfNeeded,
    disableTVMode,
  ]);

  // Gamepad handler
  useEffect(() => {
    if (!isTVMode) return;

    let animationFrameId: number | null = null;

    const pollGamepad = () => {
      const gamepads = navigator.getGamepads();
      const gp = gamepads[0];

      if (gp) {
        const buttons = gp.buttons;
        const pressedButtons: boolean[] = buttons.map((b) => b.pressed);

        // D-pad or left stick
        const axes = gp.axes;
        const isUp = buttons[12]?.pressed || axes[1] < -0.5;
        const isDown = buttons[13]?.pressed || axes[1] > 0.5;
        const isLeft = buttons[14]?.pressed || axes[0] < -0.5;
        const isRight = buttons[15]?.pressed || axes[0] > 0.5;
        const isSelect = buttons[0]?.pressed; // A/Cross

        const wasUp = gamepadRef.current.lastButtons[12] || false;
        const wasDown = gamepadRef.current.lastButtons[13] || false;
        const wasLeft = gamepadRef.current.lastButtons[14] || false;
        const wasRight = gamepadRef.current.lastButtons[15] || false;
        const wasSelect = gamepadRef.current.lastButtons[0] || false;

        const elements = getFocusableElements();
        if (elements.length === 0) {
          gamepadRef.current.lastButtons = pressedButtons;
          animationFrameId = requestAnimationFrame(pollGamepad);
          return;
        }

        if (focusedIndex >= 0 && focusedIndex < elements.length) {
          const currentEl = elements[focusedIndex];

          if (isRight && !wasRight) {
            const nextIndex = focusedIndex + 1;
            if (nextIndex < elements.length) {
              setFocusedIndex(nextIndex);
              elements[nextIndex].focus();
              scrollIntoViewIfNeeded(elements[nextIndex]);
            }
          } else if (isLeft && !wasLeft) {
            const prevIndex = focusedIndex - 1;
            if (prevIndex >= 0) {
              setFocusedIndex(prevIndex);
              elements[prevIndex].focus();
              scrollIntoViewIfNeeded(elements[prevIndex]);
            }
          } else if (isDown && !wasDown) {
            const closestBelow = findClosestBelow(currentEl, elements);
            if (closestBelow) {
              const idx = getElementIndex(closestBelow);
              setFocusedIndex(idx);
              closestBelow.focus();
              scrollIntoViewIfNeeded(closestBelow);
            }
          } else if (isUp && !wasUp) {
            const closestAbove = findClosestAbove(currentEl, elements);
            if (closestAbove) {
              const idx = getElementIndex(closestAbove);
              setFocusedIndex(idx);
              closestAbove.focus();
              scrollIntoViewIfNeeded(closestAbove);
            }
          } else if (isSelect && !wasSelect) {
            currentEl.click();
          }
        }

        gamepadRef.current.lastButtons = pressedButtons;
      }

      animationFrameId = requestAnimationFrame(pollGamepad);
    };

    gamepadRef.current.polling = true;
    animationFrameId = requestAnimationFrame(pollGamepad);

    return () => {
      gamepadRef.current.polling = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [
    isTVMode,
    focusedIndex,
    getFocusableElements,
    findClosestBelow,
    findClosestAbove,
    getElementIndex,
    scrollIntoViewIfNeeded,
  ]);

  const containerProps = {
    'data-tv-mode': isTVMode,
  };

  // For backward compatibility, we keep getItemProps but it's no longer used
  // Focusable elements are now auto-discovered via data-tv-focus attribute
  const getItemProps = (_index: number) => ({});

  return {
    focusedIndex,
    containerProps,
    getItemProps,
  };
}
