/**
 * Navigation Exports
 */

// Main navigator (4-tab: Sanctuary, Journey, Practice, You)
export { NewRootNavigator, NewRootNavigator as RootNavigator } from './NewRootNavigator';

// Types come from the single source of truth
export type { RootStackParamList, MainTabParamList } from '../types';

// Default export
export { NewRootNavigator as default } from './NewRootNavigator';
