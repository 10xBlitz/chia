import { useEffect, useRef } from 'react';

interface UseKeyboardAwareOptions {
  /**
   * Whether to automatically scroll to focused input
   */
  autoScroll?: boolean;
  /**
   * Additional offset when scrolling to input
   */
  scrollOffset?: number;
  /**
   * Callback when keyboard opens
   */
  onKeyboardOpen?: (keyboardHeight: number) => void;
  /**
   * Callback when keyboard closes
   */
  onKeyboardClose?: () => void;
}

export function useKeyboardAware(options: UseKeyboardAwareOptions = {}) {
  const {
    autoScroll = true,
    scrollOffset = 20,
    onKeyboardOpen,
    onKeyboardClose,
  } = options;

  const keyboardHeightRef = useRef(0);
  const activeElementRef = useRef<Element | null>(null);

  useEffect(() => {
    const initialViewportHeight = window.innerHeight;
    let keyboardVisible = false;

    const handleFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if the focused element is an input
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        activeElementRef.current = target;
        
        if (autoScroll) {
          // Delay scroll to allow keyboard to appear
          setTimeout(() => {
            if (activeElementRef.current) {
              activeElementRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
              });
            }
          }, 300);
        }
      }
    };

    const handleBlur = () => {
      activeElementRef.current = null;
    };

    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialViewportHeight - currentHeight;
      
      // Keyboard is likely open if height decreased significantly
      if (heightDifference > 150 && !keyboardVisible) {
        keyboardVisible = true;
        keyboardHeightRef.current = heightDifference;
        onKeyboardOpen?.(heightDifference);
      } 
      // Keyboard is likely closed if height increased back
      else if (heightDifference < 100 && keyboardVisible) {
        keyboardVisible = false;
        keyboardHeightRef.current = 0;
        onKeyboardClose?.();
      }
    };

    // Visual Viewport API for better keyboard detection
    const handleVisualViewportChange = () => {
      if (window.visualViewport) {
        const keyboardHeight = window.innerHeight - window.visualViewport.height;
        
        if (keyboardHeight > 150 && !keyboardVisible) {
          keyboardVisible = true;
          keyboardHeightRef.current = keyboardHeight;
          onKeyboardOpen?.(keyboardHeight);
        } else if (keyboardHeight < 100 && keyboardVisible) {
          keyboardVisible = false;
          keyboardHeightRef.current = 0;
          onKeyboardClose?.();
        }
      }
    };

    // Add event listeners
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);
    window.addEventListener('resize', handleResize);
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
    }

    // Cleanup
    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
      window.removeEventListener('resize', handleResize);
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
      }
    };
  }, [autoScroll, scrollOffset, onKeyboardOpen, onKeyboardClose]);

  return {
    keyboardHeight: keyboardHeightRef.current,
    activeElement: activeElementRef.current,
  };
} 