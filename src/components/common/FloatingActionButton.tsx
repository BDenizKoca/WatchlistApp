import React, { useState, useEffect, useRef, CSSProperties } from 'react';

interface Position {
  right?: number;
  bottom?: number;
  left?: number;
  top?: number;
}

// Define the coordinate tracking interface
interface DragCoordinates {
  x: number;
  y: number;
  buttonX: number;
  buttonY: number;
}

interface FloatingActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  ariaLabel: string;
  position: Position;
  onPositionChange?: (position: Position) => void;
  isDraggable?: boolean;
  onDoubleClick?: () => void;
  onLongPress?: () => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  style?: CSSProperties;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  icon,
  ariaLabel,
  position,
  onPositionChange,
  isDraggable = false,
  onDoubleClick,
  onLongPress,
  onDragEnd,
  isDragging = false,
  style = {}
}) => {
  const [isDraggingInternal, setIsDraggingInternal] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dragStartRef = useRef<DragCoordinates | null>(null);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickTimeRef = useRef<number>(0);
  const isDoubleClickRef = useRef<boolean>(false);
  
  useEffect(() => {
    setIsDraggingInternal(isDragging);
  }, [isDragging]);

  // Fixed: Use correct DOM event type for touch move
  const handleTouchMove = (e: globalThis.TouchEvent) => {
    if (!isDraggingInternal || !dragStartRef.current || !e.touches[0]) return;
    
    e.preventDefault();
    
    const { x: startX, y: startY, buttonX, buttonY } = dragStartRef.current;
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    // Calculate new position logic same as mouseMove
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const buttonWidth = buttonRef.current?.offsetWidth || 56;
    const buttonHeight = buttonRef.current?.offsetHeight || 56;

    let newPosition: Position = {};

    // Calculate right or left position
    if (buttonX + buttonWidth / 2 > viewportWidth / 2) {
      // Button is on the right side
      newPosition.right = Math.max(16, viewportWidth - (buttonX + deltaX + buttonWidth));
    } else {
      // Button is on the left side
      newPosition.left = Math.max(16, buttonX + deltaX);
    }

    // Calculate bottom or top position
    if (buttonY + buttonHeight / 2 > viewportHeight / 2) {
      // Button is on the bottom half
      newPosition.bottom = Math.max(16, viewportHeight - (buttonY + deltaY + buttonHeight));
    } else {
      // Button is on the top half
      newPosition.top = Math.max(16, buttonY + deltaY);
    }

    // Apply boundary constraints
    if (newPosition.right && newPosition.right > viewportWidth - buttonWidth - 16) {
      newPosition.right = viewportWidth - buttonWidth - 16;
    }
    if (newPosition.left && newPosition.left > viewportWidth - buttonWidth - 16) {
      newPosition.left = viewportWidth - buttonWidth - 16;
    }
    if (newPosition.top && newPosition.top > viewportHeight - buttonHeight - 16) {
      newPosition.top = viewportHeight - buttonHeight - 16;
    }
    if (newPosition.bottom && newPosition.bottom > viewportHeight - buttonHeight - 16) {
      newPosition.bottom = viewportHeight - buttonHeight - 16;
    }

    onPositionChange?.(newPosition);
  };

  useEffect(() => {
    if (!isDraggable) return;

    // Fixed: Use correct DOM event type for mouse move
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (!isDraggingInternal || !dragStartRef.current) return;
      
      e.preventDefault();
      
      const { x: startX, y: startY, buttonX, buttonY } = dragStartRef.current;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      // Calculate new position
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const buttonWidth = buttonRef.current?.offsetWidth || 56;
      const buttonHeight = buttonRef.current?.offsetHeight || 56;

      let newPosition: Position = {};

      // Calculate right or left position
      if (buttonX + buttonWidth / 2 > viewportWidth / 2) {
        // Button is on the right side
        newPosition.right = Math.max(16, viewportWidth - (buttonX + deltaX + buttonWidth));
      } else {
        // Button is on the left side
        newPosition.left = Math.max(16, buttonX + deltaX);
      }

      // Calculate bottom or top position
      if (buttonY + buttonHeight / 2 > viewportHeight / 2) {
        // Button is on the bottom half
        newPosition.bottom = Math.max(16, viewportHeight - (buttonY + deltaY + buttonHeight));
      } else {
        // Button is on the top half
        newPosition.top = Math.max(16, buttonY + deltaY);
      }

      // Ensure the button stays within viewport bounds
      if (newPosition.right && newPosition.right > viewportWidth - buttonWidth - 16) {
        newPosition.right = viewportWidth - buttonWidth - 16;
      }
      if (newPosition.left && newPosition.left > viewportWidth - buttonWidth - 16) {
        newPosition.left = viewportWidth - buttonWidth - 16;
      }
      if (newPosition.top && newPosition.top > viewportHeight - buttonHeight - 16) {
        newPosition.top = viewportHeight - buttonHeight - 16;
      }
      if (newPosition.bottom && newPosition.bottom > viewportHeight - buttonHeight - 16) {
        newPosition.bottom = viewportHeight - buttonHeight - 16;
      }

      onPositionChange?.(newPosition);
    };

    const handleMouseUp = () => {
      if (isDraggingInternal) {
        setIsDraggingInternal(false);
        onDragEnd?.();
        dragStartRef.current = null;
      }
    };

    if (isDraggingInternal) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Fixed: Use correctly typed handlers with DOM events
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDraggingInternal, onPositionChange, isDraggable, onDragEnd]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDraggable) return;

    e.preventDefault();
    
    // Handle double click
    const now = Date.now();
    if (now - lastClickTimeRef.current < 300) {
      if (onDoubleClick) {
        isDoubleClickRef.current = true;
        onDoubleClick();
        
        // Set a timeout to reset the double-click flag
        setTimeout(() => {
          isDoubleClickRef.current = false;
        }, 300);
        
        if (longPressTimeoutRef.current) {
          clearTimeout(longPressTimeoutRef.current);
        }
        return;
      }
    }
    lastClickTimeRef.current = now;

    // Start long press detection
    longPressTimeoutRef.current = setTimeout(() => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        
        // Store initial position
        dragStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          buttonX: rect.left,
          buttonY: rect.top
        };
        
        onLongPress?.();
      }
    }, 500); // 500ms for long press
  };

  const handleMouseUp = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
    
    // Only trigger onClick if not dragging AND not double-clicking
    if (!isDraggingInternal && !isDoubleClickRef.current) {
      onClick();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isDraggable) return;
    
    // Handle double tap
    const now = Date.now();
    if (now - lastClickTimeRef.current < 300) {
      if (onDoubleClick) {
        isDoubleClickRef.current = true;
        onDoubleClick();
        
        // Set a timeout to reset the double-click flag
        setTimeout(() => {
          isDoubleClickRef.current = false;
        }, 300);
        
        if (longPressTimeoutRef.current) {
          clearTimeout(longPressTimeoutRef.current);
        }
        return;
      }
    }
    lastClickTimeRef.current = now;

    // Start long press detection
    longPressTimeoutRef.current = setTimeout(() => {
      if (buttonRef.current && e.touches[0]) {
        const rect = buttonRef.current.getBoundingClientRect();
        const touch = e.touches[0];
        
        dragStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          buttonX: rect.left,
          buttonY: rect.top
        };
        
        onLongPress?.();
      }
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
    
    // Only trigger onClick if not dragging AND not double-tapping
    if (!isDraggingInternal && !isDoubleClickRef.current) {
      onClick();
    }
  };

  // Clean up long press timeout on unmount
  useEffect(() => {
    return () => {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }
    };
  }, []);

  return (
    <button
      ref={buttonRef}
      className="fixed rounded-full bg-primary text-white p-4 shadow-lg z-50"
      style={{
        ...position,
        ...style,
      }}
      onClick={(e) => e.preventDefault()} // Prevent immediate click
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => {
        // Prevent right-click context menu on the button
        e.preventDefault();
        return false;
      }}
      aria-label={ariaLabel}
      role="button"
      tabIndex={0}
    >
      {icon}
      {/* Add a screen reader only instruction */}
      <span className="sr-only">
        {isDraggable ? "Long press to move this button. Double click to reset position." : ""}
      </span>
    </button>
  );
}

export default FloatingActionButton;