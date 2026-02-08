/**
 * SessionBridgeScreen
 * 
 * This screen bridges the simplified Sanctuary flow to the existing
 * SessionContext-based UnifiedSessionScreen.
 * 
 * It receives simple params (type, id, mood) and sets up the session queue
 * before redirecting to the actual session screen.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../contexts/ThemeContext';
import { useSession } from '../../contexts/SessionContext';
import { Text } from '../../components/core/Text';

import { spacing } from '../../theme';

// =============================================================================
// TYPES
// =============================================================================

type SessionBridgeParams = {
  type: string;
  id: string;
  mood?: string;
};

type RouteType = RouteProp<{ Session: SessionBridgeParams }, 'Session'>;

// =============================================================================
// BREATHING PATTERNS DATA
// =============================================================================

const BREATHING_PATTERNS = {
  'calm-breath': {
    name: 'Calming Breaths',
    inhale: 4,
    hold1: 7,
    exhale: 8,
    hold2: 0,
    cycles: 4,
  },
  'box-breathing': {
    name: 'Box Breathing',
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4,
    cycles: 4,
  },
  'energizing-breath': {
    name: 'Energizing Breath',
    inhale: 4,
    hold1: 0,
    exhale: 2,
    hold2: 0,
    cycles: 10,
  },
  'sleep-breath': {
    name: 'Sleep Preparation',
    inhale: 4,
    hold1: 7,
    exhale: 8,
    hold2: 0,
    cycles: 6,
  },
  'one-minute-calm': {
    name: 'One Minute Calm',
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 0,
    cycles: 3,
  },
};

// =============================================================================
// SESSION BRIDGE SCREEN
// =============================================================================

export function SessionBridgeScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  const { colors } = useTheme();
  const { startBreathingSession, startStandaloneSession } = useSession();

  const { type, id, mood } = route.params;

  useEffect(() => {
    const setupSession = async () => {
      try {
        if (type === 'breathing') {
          const pattern = BREATHING_PATTERNS[id as keyof typeof BREATHING_PATTERNS];
          if (pattern) {
            await startBreathingSession({
              patternId: id,
              name: pattern.name,
              inhale: pattern.inhale,
              hold1: pattern.hold1,
              exhale: pattern.exhale,
              hold2: pattern.hold2,
              cycles: pattern.cycles,
            });
          } else {
            // Fallback to standalone session
            await startStandaloneSession('breathing', {
              patternId: id,
              name: 'Breathing Session',
            });
          }
        } else if (type === 'grounding') {
          await startStandaloneSession('grounding', {
            techniqueId: id,
          });
        } else if (type === 'meditation') {
          await startStandaloneSession('focus', {
            sessionId: id,
          });
        } else if (type === 'focus') {
          await startStandaloneSession('focus', {
            sessionId: id,
          });
        } else {
          // Generic session
          await startStandaloneSession(type as any, {
            sessionId: id,
          });
        }
        
        // Navigate to unified session (replace this screen)
        navigation.reset({
          index: 0,
          routes: [
            { name: 'Main' as never },
            { name: 'UnifiedSession' as never },
          ],
        });
      } catch (error) {
        console.error('Failed to setup session:', error);
        navigation.goBack();
      }
    };

    setupSession();
  }, [type, id, navigation, startBreathingSession, startStandaloneSession]);

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <ActivityIndicator size="large" color={colors.accentPrimary} />
      <Text
        variant="bodyMedium"
        style={{ color: colors.inkMuted, marginTop: spacing.md }}
      >
        Preparing your session...
      </Text>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SessionBridgeScreen;
