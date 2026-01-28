/**
 * Shared Element Transitions
 * 
 * Utilities for creating smooth shared element transitions between screens
 * using Reanimated's layout animations.
 * 
 * Usage:
 * 1. Wrap the source element with SharedElement and give it a unique tag
 * 2. Wrap the target element with the same tag
 * 3. The transition happens automatically when navigating
 */
import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import Animated, {
  SharedTransition,
  withSpring,
  withTiming,
  Easing,
  SharedTransitionType,
} from 'react-native-reanimated';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';

// =============================================================================
// TYPES
// =============================================================================

interface SharedElementProps {
  /** Unique tag to identify this shared element */
  tag: string;
  /** Children to render */
  children: React.ReactNode;
  /** Style for the container */
  style?: any;
}

interface TransitionConfig {
  duration?: number;
  damping?: number;
  stiffness?: number;
  type?: 'spring' | 'timing';
}

interface SharedTransitionContextType {
  /** Register a shared element */
  register: (tag: string, layout: { x: number; y: number; width: number; height: number }) => void;
  /** Unregister a shared element */
  unregister: (tag: string) => void;
  /** Get layout for a shared element */
  getLayout: (tag: string) => { x: number; y: number; width: number; height: number } | undefined;
  /** Active transition tag */
  activeTag: string | null;
  /** Set active transition */
  setActiveTag: (tag: string | null) => void;
}

// =============================================================================
// SHARED TRANSITION PRESETS
// =============================================================================

/**
 * Create a smooth spring-based shared transition
 */
export function createSharedTransition(config?: TransitionConfig): SharedTransition {
  const {
    duration = 400,
    damping = 15,
    stiffness = 100,
    type = 'spring',
  } = config || {};

  if (type === 'spring') {
    return SharedTransition.custom((values) => {
      'worklet';
      return {
        originX: withSpring(values.targetOriginX, { damping, stiffness }),
        originY: withSpring(values.targetOriginY, { damping, stiffness }),
        width: withSpring(values.targetWidth, { damping, stiffness }),
        height: withSpring(values.targetHeight, { damping, stiffness }),
      };
    });
  }

  return SharedTransition.custom((values) => {
    'worklet';
    return {
      originX: withTiming(values.targetOriginX, { duration, easing: Easing.out(Easing.ease) }),
      originY: withTiming(values.targetOriginY, { duration, easing: Easing.out(Easing.ease) }),
      width: withTiming(values.targetWidth, { duration, easing: Easing.out(Easing.ease) }),
      height: withTiming(values.targetHeight, { duration, easing: Easing.out(Easing.ease) }),
    };
  });
}

// Preset transitions
export const sharedTransitions = {
  /** Default spring transition */
  default: createSharedTransition(),
  
  /** Faster spring for cards */
  card: createSharedTransition({ damping: 18, stiffness: 150 }),
  
  /** Slower, smoother transition for images */
  image: createSharedTransition({ damping: 12, stiffness: 80 }),
  
  /** Quick timing-based transition */
  quick: createSharedTransition({ type: 'timing', duration: 250 }),
  
  /** Slow, cinematic transition */
  cinematic: createSharedTransition({ type: 'timing', duration: 500 }),
};

// =============================================================================
// CONTEXT
// =============================================================================

const SharedTransitionContext = createContext<SharedTransitionContextType | undefined>(undefined);

export function SharedTransitionProvider({ children }: { children: ReactNode }) {
  const [layouts, setLayouts] = useState<Map<string, { x: number; y: number; width: number; height: number }>>(new Map());
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const register = useCallback((tag: string, layout: { x: number; y: number; width: number; height: number }) => {
    setLayouts(prev => new Map(prev).set(tag, layout));
  }, []);

  const unregister = useCallback((tag: string) => {
    setLayouts(prev => {
      const next = new Map(prev);
      next.delete(tag);
      return next;
    });
  }, []);

  const getLayout = useCallback((tag: string) => {
    return layouts.get(tag);
  }, [layouts]);

  const value = useMemo<SharedTransitionContextType>(() => ({
    register,
    unregister,
    getLayout,
    activeTag,
    setActiveTag,
  }), [register, unregister, getLayout, activeTag]);

  return (
    <SharedTransitionContext.Provider value={value}>
      {children}
    </SharedTransitionContext.Provider>
  );
}

export function useSharedTransition() {
  const context = useContext(SharedTransitionContext);
  if (!context) {
    throw new Error('useSharedTransition must be used within SharedTransitionProvider');
  }
  return context;
}

// =============================================================================
// SHARED ELEMENT COMPONENT
// =============================================================================

/**
 * SharedElement wrapper for creating shared element transitions
 * 
 * @example
 * // In list screen
 * <SharedElement tag={`card-${item.id}`}>
 *   <ToolCard item={item} />
 * </SharedElement>
 * 
 * // In detail screen
 * <SharedElement tag={`card-${id}`}>
 *   <DetailHeader />
 * </SharedElement>
 */
export function SharedElement({ tag, children, style }: SharedElementProps) {
  return (
    <Animated.View
      sharedTransitionTag={tag}
      sharedTransitionStyle={sharedTransitions.card}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

/**
 * SharedImage - Optimized for image transitions
 */
export function SharedImage({ tag, children, style }: SharedElementProps) {
  return (
    <Animated.View
      sharedTransitionTag={tag}
      sharedTransitionStyle={sharedTransitions.image}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

/**
 * SharedText - For text element transitions
 */
export function SharedText({ tag, children, style }: SharedElementProps) {
  return (
    <Animated.View
      sharedTransitionTag={tag}
      sharedTransitionStyle={sharedTransitions.quick}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

// =============================================================================
// TRANSITION HELPERS
// =============================================================================

/**
 * Generate a unique shared element tag
 */
export function createSharedTag(type: string, id: string | number): string {
  return `shared-${type}-${id}`;
}

/**
 * Shared element tags for common screen transitions
 */
export const SharedTags = {
  // Tool cards
  toolCard: (id: string) => createSharedTag('tool-card', id),
  toolIcon: (id: string) => createSharedTag('tool-icon', id),
  toolTitle: (id: string) => createSharedTag('tool-title', id),
  
  // Breathing patterns
  breathingCard: (id: string) => createSharedTag('breathing-card', id),
  breathingOrb: (id: string) => createSharedTag('breathing-orb', id),
  
  // Stories
  storyCard: (id: string) => createSharedTag('story-card', id),
  storyImage: (id: string) => createSharedTag('story-image', id),
  
  // Journal entries
  journalCard: (id: string) => createSharedTag('journal-card', id),
  
  // Focus sessions
  focusCard: (id: string) => createSharedTag('focus-card', id),
  
  // Profile
  profileAvatar: () => createSharedTag('profile', 'avatar'),
  profileName: () => createSharedTag('profile', 'name'),
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    // Container styles if needed
  },
});

export default SharedElement;
