/**
 * useSessionMilestones Hook
 * 
 * Provides micro-celebration moments during sessions:
 * - "Getting started!" at beginning
 * - "Halfway there!" at 50%
 * - "Almost done!" at 80%
 * - "Complete!" at 100%
 * 
 * Creates encouraging, non-intrusive feedback during longer sessions.
 */
import { useCallback, useRef, useState } from 'react';
import { useHaptics } from './useHaptics';

// =============================================================================
// TYPES
// =============================================================================

export type MilestoneType = 
  | 'start'      // 0-10%
  | 'progress'   // 25%
  | 'halfway'    // 50%
  | 'almost'     // 80%
  | 'complete';  // 100%

export interface Milestone {
  type: MilestoneType;
  progress: number;
  message: string;
  emoji: string;
  subMessage?: string;
}

interface MilestoneConfig {
  enableStartMessage?: boolean;
  enableProgressMessage?: boolean;
  enableHalfwayMessage?: boolean;
  enableAlmostMessage?: boolean;
  enableCompleteMessage?: boolean;
  sessionType?: 'breathing' | 'grounding' | 'focus' | 'reset' | 'journal' | 'story';
}

// =============================================================================
// MILESTONE DEFINITIONS
// =============================================================================

const DEFAULT_MILESTONES: Record<MilestoneType, Omit<Milestone, 'progress'>> = {
  start: {
    type: 'start',
    message: 'Here we go',
    emoji: '🌱',
    subMessage: 'Take your time',
  },
  progress: {
    type: 'progress',
    message: 'Nicely done',
    emoji: '✨',
    subMessage: 'Keep going',
  },
  halfway: {
    type: 'halfway',
    message: 'Halfway there',
    emoji: '🌿',
    subMessage: "You're doing great",
  },
  almost: {
    type: 'almost',
    message: 'Almost there',
    emoji: '🌟',
    subMessage: 'Just a little more',
  },
  complete: {
    type: 'complete',
    message: 'Beautiful',
    emoji: '🎋',
    subMessage: 'Well done',
  },
};

// Session-specific variations
const SESSION_MILESTONES: Record<string, Partial<Record<MilestoneType, Partial<Milestone>>>> = {
  breathing: {
    start: { message: 'Find your breath', emoji: '🌬️' },
    halfway: { message: 'Finding rhythm', emoji: '🌊' },
    complete: { message: 'Beautifully calm', emoji: '☁️' },
  },
  grounding: {
    start: { message: 'Connecting', emoji: '🌍' },
    halfway: { message: 'Present & grounded', emoji: '🌳' },
    complete: { message: 'Fully anchored', emoji: '⚓' },
  },
  focus: {
    start: { message: 'Entering focus', emoji: '🎯' },
    halfway: { message: 'Deep in flow', emoji: '💫' },
    almost: { message: 'Strong finish ahead', emoji: '🚀' },
    complete: { message: 'Focus achieved', emoji: '🏆' },
  },
  reset: {
    start: { message: 'Releasing', emoji: '💨' },
    halfway: { message: 'Letting go', emoji: '🍃' },
    complete: { message: 'Reset complete', emoji: '🔄' },
  },
  journal: {
    start: { message: 'Pen to paper', emoji: '✍️' },
    halfway: { message: 'Words flowing', emoji: '📝' },
    complete: { message: 'Thoughts captured', emoji: '📖' },
  },
  story: {
    start: { message: 'Settling in', emoji: '🌙' },
    halfway: { message: 'Drifting peacefully', emoji: '☁️' },
    complete: { message: 'Sweet dreams', emoji: '💤' },
  },
};

// =============================================================================
// HOOK
// =============================================================================

export function useSessionMilestones(config: MilestoneConfig = {}) {
  const {
    enableStartMessage = true,
    enableProgressMessage = false, // Usually skip 25%
    enableHalfwayMessage = true,
    enableAlmostMessage = true,
    enableCompleteMessage = true,
    sessionType,
  } = config;

  const { impactLight, notificationSuccess } = useHaptics();
  const triggeredMilestones = useRef<Set<MilestoneType>>(new Set());
  const [currentMilestone, setCurrentMilestone] = useState<Milestone | null>(null);
  const [showMilestone, setShowMilestone] = useState(false);

  // Get milestone content with session-specific overrides
  const getMilestoneContent = useCallback((type: MilestoneType): Milestone => {
    const base = DEFAULT_MILESTONES[type];
    const sessionOverride = sessionType ? SESSION_MILESTONES[sessionType]?.[type] : undefined;

    return {
      ...base,
      ...sessionOverride,
      progress: type === 'start' ? 0 : type === 'progress' ? 25 : type === 'halfway' ? 50 : type === 'almost' ? 80 : 100,
    };
  }, [sessionType]);

  // Check and trigger milestone based on progress
  const checkMilestone = useCallback(async (progress: number): Promise<Milestone | null> => {
    let milestoneType: MilestoneType | null = null;

    // Determine which milestone to show
    if (progress >= 100 && enableCompleteMessage && !triggeredMilestones.current.has('complete')) {
      milestoneType = 'complete';
    } else if (progress >= 80 && progress < 100 && enableAlmostMessage && !triggeredMilestones.current.has('almost')) {
      milestoneType = 'almost';
    } else if (progress >= 50 && progress < 80 && enableHalfwayMessage && !triggeredMilestones.current.has('halfway')) {
      milestoneType = 'halfway';
    } else if (progress >= 25 && progress < 50 && enableProgressMessage && !triggeredMilestones.current.has('progress')) {
      milestoneType = 'progress';
    } else if (progress >= 5 && progress < 25 && enableStartMessage && !triggeredMilestones.current.has('start')) {
      milestoneType = 'start';
    }

    if (milestoneType) {
      triggeredMilestones.current.add(milestoneType);
      const milestone = getMilestoneContent(milestoneType);
      
      // Haptic feedback
      if (milestoneType === 'complete') {
        await notificationSuccess();
      } else {
        await impactLight();
      }

      // Show milestone
      setCurrentMilestone(milestone);
      setShowMilestone(true);

      // Auto-hide after delay
      setTimeout(() => {
        setShowMilestone(false);
      }, milestoneType === 'complete' ? 3000 : 2000);

      return milestone;
    }

    return null;
  }, [enableStartMessage, enableProgressMessage, enableHalfwayMessage, enableAlmostMessage, enableCompleteMessage, getMilestoneContent, impactLight, notificationSuccess]);

  // Reset for new session
  const reset = useCallback(() => {
    triggeredMilestones.current.clear();
    setCurrentMilestone(null);
    setShowMilestone(false);
  }, []);

  // Manual trigger for specific milestone
  const triggerMilestone = useCallback(async (type: MilestoneType) => {
    const milestone = getMilestoneContent(type);
    
    if (type === 'complete') {
      await notificationSuccess();
    } else {
      await impactLight();
    }

    setCurrentMilestone(milestone);
    setShowMilestone(true);

    setTimeout(() => {
      setShowMilestone(false);
    }, type === 'complete' ? 3000 : 2000);

    return milestone;
  }, [getMilestoneContent, impactLight, notificationSuccess]);

  // Dismiss current milestone
  const dismissMilestone = useCallback(() => {
    setShowMilestone(false);
  }, []);

  return {
    currentMilestone,
    showMilestone,
    checkMilestone,
    triggerMilestone,
    dismissMilestone,
    reset,
  };
}
