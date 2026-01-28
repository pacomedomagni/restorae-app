/**
 * RitualScreen - Consistent UI
 */
import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useTheme } from '../contexts/ThemeContext';
import { Text, Button, GlassCard, AmbientBackground, ScreenHeader } from '../components/ui';
import { spacing, layout } from '../theme';
import { useHaptics } from '../hooks/useHaptics';
import { RootStackParamList } from '../types';

const RITUALS = [
  { 
    id: 'morning', 
    title: 'Morning Ritual', 
    time: '7:00 AM',
    steps: ['Gratitude', 'Breathing', 'Intention'],
    completed: false
  },
  { 
    id: 'midday', 
    title: 'Midday Check-in', 
    time: '12:00 PM',
    steps: ['Pause', 'Reflect', 'Adjust'],
    completed: false
  },
  { 
    id: 'evening', 
    title: 'Evening Wind Down', 
    time: '9:00 PM',
    steps: ['Review', 'Release', 'Rest'],
    completed: false
  },
];

export function RitualScreen() {
  const { reduceMotion } = useTheme();
  const { selectionLight, notificationSuccess } = useHaptics();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [rituals, setRituals] = useState(RITUALS);

  const toggleRitual = async (id: string) => {
    await selectionLight();
    setRituals(prev => prev.map(r => 
      r.id === id ? { ...r, completed: !r.completed } : r
    ));
  };

  const completedCount = rituals.filter(r => r.completed).length;

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.scrollContent}>
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
            <ScreenHeader
              title="Daily Rituals"
              subtitle={`${completedCount} of ${rituals.length} completed today`}
              compact
            />
          </Animated.View>

          {rituals.map((ritual, index) => (
            <Animated.View 
              key={ritual.id} 
              entering={reduceMotion ? undefined : FadeInDown.delay(100 + index * 100).duration(400)}
            >
              <Pressable 
                onPress={() => toggleRitual(ritual.id)}
                accessibilityRole="checkbox"
                accessibilityLabel={`${ritual.title} at ${ritual.time}`}
                accessibilityHint={ritual.completed ? 'Tap to mark as incomplete' : 'Tap to mark as complete'}
                accessibilityState={{ checked: ritual.completed }}
              >
                <GlassCard 
                  variant={ritual.completed ? 'elevated' : 'default'} 
                  padding="lg"
                  glow={ritual.completed ? 'cool' : undefined}
                >
                  <View style={styles.ritualHeader}>
                    <View>
                      <Text 
                        variant="headlineSmall" 
                        color={ritual.completed ? 'inkMuted' : 'ink'}
                        style={ritual.completed ? styles.completed : undefined}
                      >
                        {ritual.title}
                      </Text>
                      <Text variant="labelMedium" color="inkMuted">{ritual.time}</Text>
                    </View>
                    <View style={[styles.checkbox, ritual.completed && styles.checkboxChecked]}>
                      {ritual.completed && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </View>
                  <View style={styles.stepsRow}>
                    {ritual.steps.map((step, i) => (
                      <Text key={i} variant="labelSmall" color="inkMuted">
                        {step}{i < ritual.steps.length - 1 ? ' → ' : ''}
                      </Text>
                    ))}
                  </View>
                </GlassCard>
              </Pressable>
            </Animated.View>
          ))}

          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(400).duration(400)}>
            <Button
              variant="secondary"
              size="md"
              fullWidth
              onPress={() => navigation.navigate('CreateRitual')}
              style={styles.addButton}
            >
              + Create Custom Ritual
            </Button>
          </Animated.View>

          <View style={{ height: layout.tabBarHeight }} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  ritualHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completed: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(125, 211, 192, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: 'rgba(125, 211, 192, 0.3)',
    borderColor: '#7DD3C0',
  },
  checkmark: {
    color: '#7DD3C0',
    fontSize: 16,
    fontWeight: '600',
  },
  stepsRow: {
    flexDirection: 'row',
    marginTop: spacing[3],
  },
  addButton: {
    marginTop: spacing[6],
    marginBottom: spacing[6],
  },
});
