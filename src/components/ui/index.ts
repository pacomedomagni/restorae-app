/**
 * UI Components - Cleaned up exports
 * 
 * Only exports components that exist in the new system.
 */

// Core UI
export { Text } from './Text';
export { Button } from './Button';
export { ScreenHeader } from './ScreenHeader';
export { GlassCard } from './GlassCard';
export { AmbientBackground } from './AmbientBackground';
export { EmptyState } from './EmptyState';
export { CharacterCounter } from './CharacterCounter';

// Skeleton loading states
export { 
  Skeleton, 
  SkeletonCard, 
  SkeletonText,
  SmoothContentTransition,
} from './Skeleton';

// Error handling
export { ErrorBoundary, ErrorState, AsyncErrorWrapper } from './ErrorBoundary';

// Modals
export { ExitConfirmationModal } from './ExitConfirmationModal';
export { AlertModal } from './AlertModal';

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
export { SuccessToast } from './SuccessToast';
