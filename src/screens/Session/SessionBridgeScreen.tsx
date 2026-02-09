/**
 * SessionBridgeScreen
 *
 * Bridges simplified navigation params to SessionContext.
 * Receives (type, id, mood), builds the appropriate Activity,
 * and starts a single-activity session via startSingle().
 * SessionContext auto-navigates to UnifiedSession.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { useTheme } from '../../contexts/ThemeContext';
import { useSession } from '../../contexts/SessionContext';
import { Text } from '../../components/ui';
import { getPatternById } from '../../data/breathingPatterns';
import { getTechniqueById } from '../../data/groundingTechniques';
import { spacing } from '../../theme';
import type { Activity, ActivityType, BreathingConfig, GroundingConfig, FocusConfig } from '../../types/session';

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
// HELPERS
// =============================================================================

function buildActivity(type: string, id: string): Activity | null {
  if (type === 'breathing') {
    const pattern = getPatternById(id);
    if (!pattern) return null;

    const config: BreathingConfig = {
      type: 'breathing',
      patternId: id,
      inhale: pattern.inhale,
      hold1: pattern.hold1,
      exhale: pattern.exhale,
      hold2: pattern.hold2,
      cycles: pattern.cycles,
    };

    const cycleDuration = pattern.inhale + (pattern.hold1 || 0) + pattern.exhale + (pattern.hold2 || 0);

    return {
      id: `breathing-${id}`,
      type: 'breathing',
      name: pattern.name,
      description: pattern.description,
      duration: cycleDuration * pattern.cycles,
      tone: 'calm',
      config,
    };
  }

  if (type === 'grounding') {
    const technique = getTechniqueById(id);
    if (!technique) return null;

    const config: GroundingConfig = {
      type: 'grounding',
      techniqueId: id,
      steps: technique.steps ?? [],
    };

    // Parse duration string like "3 min" to seconds
    const durationMatch = technique.duration?.match(/(\d+)/);
    const durationSeconds = durationMatch ? parseInt(durationMatch[1], 10) * 60 : 180;

    return {
      id: `grounding-${id}`,
      type: 'grounding',
      name: technique.name,
      description: technique.description,
      duration: durationSeconds,
      tone: 'calm',
      config,
    };
  }

  if (type === 'focus' || type === 'meditation') {
    const config: FocusConfig = {
      type: 'focus',
      targetMinutes: 10,
    };

    return {
      id: `focus-${id}`,
      type: 'focus',
      name: 'Focus Session',
      duration: 600,
      tone: 'calm',
      config,
    };
  }

  // Generic fallback
  return {
    id: `${type}-${id}`,
    // Type assertion needed: fallback for activity types not matched above
    type: type as ActivityType,
    name: `${type.charAt(0).toUpperCase() + type.slice(1)} Session`,
    duration: 300,
    tone: 'neutral',
  };
}

// =============================================================================
// SESSION BRIDGE SCREEN
// =============================================================================

export function SessionBridgeScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  const { colors } = useTheme();
  const { startSingle } = useSession();

  const { type, id } = route.params;

  useEffect(() => {
    const activity = buildActivity(type, id);
    if (activity) {
      // startSingle auto-navigates to UnifiedSession
      startSingle(activity);
    } else {
      console.warn('[SessionBridge] Could not build activity for:', type, id);
      navigation.goBack();
    }
  }, [type, id, startSingle, navigation]);

  return (
    <View
      style={[styles.container, { backgroundColor: colors.canvas }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <ActivityIndicator
        size="large"
        color={colors.accentPrimary}
        accessibilityLabel="Loading session"
      />
      <Text
        variant="bodyMedium"
        color="inkMuted"
        style={styles.label}
        accessibilityRole="text"
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
  label: {
    marginTop: spacing[3],
  },
});

export default SessionBridgeScreen;
