export { Text } from './Text';
export { Button } from './Button';
// PremiumButton is deprecated - use Button with variant="glow" instead
export { Button as PremiumButton } from './Button';
export { ScreenHeader } from './ScreenHeader';
export { GlassCard } from './GlassCard';
export { AmbientBackground } from './AmbientBackground';
export { MoodOrb } from './MoodOrb';
export { BreathingOrb } from './BreathingOrb';
export { EmptyState } from './EmptyState';
export { 
  Skeleton, 
  SkeletonCard, 
  SkeletonText, 
  SkeletonMoodOrb, 
  SkeletonJournalEntry, 
  SkeletonMoodRow, 
  SkeletonStatCard, 
  SkeletonRitualCard,
  // New comprehensive skeletons
  SkeletonMoodEntry,
  SkeletonToolCard,
  SkeletonActivityRings,
  SkeletonWeeklyActivity,
  SkeletonAchievement,
  SkeletonStoryCard,
  SkeletonPremiumCard,
} from './Skeleton';
export { TabSafeScrollView, TabSafeView } from './TabSafeScrollView';
export { ErrorBoundary, ErrorState, AsyncErrorWrapper } from './ErrorBoundary';
export { ExitConfirmationModal } from './ExitConfirmationModal';
export { AlertModal } from './AlertModal';
export { SwipeableModal } from './SwipeableModal';
export { SOSFloatingButton } from './SOSFloatingButton';
export { CharacterCounter } from './CharacterCounter';
export { OptionalBadge } from './OptionalBadge';
export type { MoodType } from './MoodOrb';
export * from './VideoBackground';

// Premium engagement components
export { ForYouSection } from './ForYouSection';
export { StreakBanner } from './StreakBanner';
export { 
  Confetti, 
  ParticleBurst, 
  StreakCelebration, 
  AchievementUnlock, 
  LevelUp, 
  SessionComplete 
} from './Celebrations';

// Premium microinteractions
export {
  Ripple,
  Shimmer,
  BreathingRefreshIndicator,
  PressScale,
  FloatingLabel,
  StaggerChild,
  GlowPulse,
} from './Microinteractions';

// Audio components
export { AmbientSoundPicker } from './AmbientSoundPicker';

// Network status
export { OfflineBanner, ConnectionStatus } from './OfflineBanner';

// Coach marks & tooltips
export { CoachMarkTooltip, CoachMarkOverlay, InlineCoachMark } from './CoachMark';

// Context menu
export { ContextMenu, useContextMenu } from './ContextMenu';
export type { ContextMenuItem, ContextMenuProps } from './ContextMenu';

// Gesture hints
export { GestureHint } from './GestureHint';
export type { GestureType } from './GestureHint';

// Floating orb for onboarding and premium experiences
export { FloatingOrb } from './FloatingOrb';

// Pull to refresh with breathing orb
export { 
  PullToRefreshScrollView, 
  BreathingRefreshIndicator as PullToRefreshIndicator,
  usePullToRefresh,
} from './PullToRefresh';

// Shared element transitions
export {
  SharedElement,
  SharedImage,
  SharedText,
  SharedTransitionProvider,
  useSharedTransition,
  createSharedTransition,
  sharedTransitions,
  SharedTags,
  createSharedTag,
} from './SharedTransition';

// Toast notifications
export { Toast } from './Toast';
export type { ToastVariant, ToastAction, ToastProps } from './Toast';

// Connection status indicator
export { ConnectionStatusIndicator } from './ConnectionStatusIndicator';

// Smooth content transitions (skeleton to content)
export { SmoothContentTransition } from './Skeleton';

// Premium UX Components
export { QuickAccessBar } from './QuickAccessBar';
export { MilestoneToast } from './MilestoneToast';
export { SuccessToast } from './SuccessToast';
export { PremiumEmptyState } from './PremiumEmptyState';
export { FavoriteButton } from './FavoriteButton';
