/**
 * DataSettingsScreen
 * 
 * Screen for managing user data - export, delete, and storage info
 */
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert, Share, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useTheme } from '../contexts/ThemeContext';
import { useJournal } from '../contexts/JournalContext';
import { useMood } from '../contexts/MoodContext';
import { useHaptics } from '../hooks/useHaptics';
import { 
  Text, 
  GlassCard, 
  AmbientBackground, 
  ScreenHeader,
} from '../components/ui';
import { spacing, layout, borderRadius } from '../theme';

// =============================================================================
// DATA OPTION ITEM
// =============================================================================
interface DataOptionProps {
  title: string;
  description: string;
  buttonLabel: string;
  destructive?: boolean;
  onPress: () => void;
  loading?: boolean;
}

function DataOption({ 
  title, 
  description, 
  buttonLabel, 
  destructive,
  onPress,
  loading 
}: DataOptionProps) {
  const { colors } = useTheme();
  
  return (
    <GlassCard variant="default" padding="lg" style={styles.optionCard}>
      <Text 
        variant="headlineSmall" 
        color={destructive ? 'accent' : 'ink'}
      >
        {title}
      </Text>
      <Text variant="bodyMedium" color="inkMuted" style={styles.optionDescription}>
        {description}
      </Text>
      <View style={styles.buttonContainer}>
        <Pressable
          onPress={onPress}
          disabled={loading}
          style={[
            styles.actionButton,
            { 
              backgroundColor: destructive ? 'transparent' : colors.accentPrimary,
              borderColor: destructive ? colors.accentWarm : 'transparent',
              borderWidth: destructive ? 1 : 0,
              opacity: loading ? 0.6 : 1,
            }
          ]}
        >
          <Text 
            variant="labelMedium" 
            color={destructive ? 'accent' : 'inkInverse'}
          >
            {loading ? 'Processing...' : buttonLabel}
          </Text>
        </Pressable>
      </View>
    </GlassCard>
  );
}

// =============================================================================
// MAIN SCREEN
// =============================================================================
export function DataSettingsScreen() {
  const { colors, reduceMotion } = useTheme();
  const { entries, exportEntries, clearAllEntries } = useJournal();
  const { entries: moodEntries, clearAllEntries: clearMoodEntries } = useMood();
  const haptics = useHaptics();
  
  const [exportingJournal, setExportingJournal] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);
  const [deletingJournal, setDeletingJournal] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  
  // Calculate storage usage (approximate)
  const journalCount = entries.length;
  const moodCount = moodEntries.length;
  const totalEntries = journalCount + moodCount;
  
  // Export journal data
  const handleExportJournal = useCallback(async () => {
    haptics.impactLight();
    setExportingJournal(true);
    
    try {
      const data = await exportEntries();
      await Share.share({
        title: 'Restorae Journal Export',
        message: data,
      });
      haptics.notificationSuccess();
    } catch (error) {
      Alert.alert('Export Failed', 'Could not export journal entries. Please try again.');
      haptics.notificationError();
    } finally {
      setExportingJournal(false);
    }
  }, [exportEntries, haptics]);
  
  // Export all data
  const handleExportAll = useCallback(async () => {
    haptics.impactLight();
    setExportingAll(true);
    
    try {
      const journalData = await exportEntries();
      const moodData = moodEntries;
      
      const allData = {
        exportDate: new Date().toISOString(),
        app: 'Restorae',
        version: '1.0.0',
        journal: JSON.parse(journalData),
        moods: moodData,
      };
      
      await Share.share({
        title: 'Restorae Data Export',
        message: JSON.stringify(allData, null, 2),
      });
      haptics.notificationSuccess();
    } catch (error) {
      Alert.alert('Export Failed', 'Could not export data. Please try again.');
      haptics.notificationError();
    } finally {
      setExportingAll(false);
    }
  }, [exportEntries, moodEntries, haptics]);
  
  // Delete journal entries
  const handleDeleteJournal = useCallback(() => {
    haptics.impactMedium();
    Alert.alert(
      'Delete Journal Entries',
      `Are you sure you want to delete all ${journalCount} journal entries? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingJournal(true);
            try {
              await clearAllEntries();
              haptics.notificationSuccess();
              Alert.alert('Deleted', 'All journal entries have been deleted.');
            } catch (error) {
              haptics.notificationError();
              Alert.alert('Error', 'Could not delete entries. Please try again.');
            } finally {
              setDeletingJournal(false);
            }
          },
        },
      ]
    );
  }, [journalCount, clearAllEntries, haptics]);
  
  // Delete all data
  const handleDeleteAll = useCallback(() => {
    haptics.impactMedium();
    Alert.alert(
      'Delete All Data',
      'Are you sure you want to delete ALL your data? This includes journal entries, mood history, and preferences. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            setDeletingAll(true);
            try {
              await clearAllEntries();
              await clearMoodEntries();
              haptics.notificationSuccess();
              Alert.alert('Deleted', 'All your data has been deleted.');
            } catch (error) {
              haptics.notificationError();
              Alert.alert('Error', 'Could not delete data. Please try again.');
            } finally {
              setDeletingAll(false);
            }
          },
        },
      ]
    );
  }, [clearAllEntries, clearMoodEntries, haptics]);

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
            <ScreenHeader
              title="Data & Storage"
              subtitle="Manage your personal data"
              compact
            />
          </Animated.View>
          
          {/* Storage Info */}
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(100).duration(400)}>
            <GlassCard variant="default" padding="lg" style={styles.storageCard}>
              <Text variant="labelLarge" color="ink">Storage Overview</Text>
              <View style={styles.storageRow}>
                <Text variant="bodyMedium" color="inkMuted">Journal Entries</Text>
                <Text variant="bodyMedium" color="ink">{journalCount}</Text>
              </View>
              <View style={styles.storageRow}>
                <Text variant="bodyMedium" color="inkMuted">Mood Check-ins</Text>
                <Text variant="bodyMedium" color="ink">{moodCount}</Text>
              </View>
              <View style={[styles.storageRow, styles.totalRow, { borderTopColor: colors.border }]}>
                <Text variant="labelMedium" color="ink">Total Entries</Text>
                <Text variant="labelMedium" color="accent">{totalEntries}</Text>
              </View>
            </GlassCard>
          </Animated.View>
          
          {/* Export Options */}
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(200).duration(400)}>
            <Text variant="labelLarge" color="inkMuted" style={styles.sectionTitle}>
              Export Data
            </Text>
            <DataOption
              title="Export Journal"
              description="Download your journal entries as a JSON file that you can save or share."
              buttonLabel="Export Journal"
              onPress={handleExportJournal}
              loading={exportingJournal}
            />
            <DataOption
              title="Export All Data"
              description="Download all your data including journal entries, mood history, and preferences."
              buttonLabel="Export All Data"
              onPress={handleExportAll}
              loading={exportingAll}
            />
          </Animated.View>
          
          {/* Delete Options */}
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(300).duration(400)}>
            <Text variant="labelLarge" color="inkMuted" style={styles.sectionTitle}>
              Delete Data
            </Text>
            <DataOption
              title="Delete Journal Entries"
              description={`Permanently delete all ${journalCount} journal entries from this device.`}
              buttonLabel="Delete Journal"
              destructive
              onPress={handleDeleteJournal}
              loading={deletingJournal}
            />
            <DataOption
              title="Delete All Data"
              description="Permanently delete all your personal data from this device, including journal entries and mood history."
              buttonLabel="Delete Everything"
              destructive
              onPress={handleDeleteAll}
              loading={deletingAll}
            />
          </Animated.View>
          
          {/* Privacy Note */}
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(400).duration(400)}>
            <Text variant="bodySmall" color="inkMuted" align="center" style={styles.note}>
              Your data is stored locally on your device and is never uploaded to external servers.
            </Text>
          </Animated.View>
          
          <View style={{ height: layout.tabBarHeight }} />
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  storageCard: {
    marginBottom: spacing[4],
  },
  storageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[3],
  },
  totalRow: {
    paddingTop: spacing[3],
    marginTop: spacing[3],
    borderTopWidth: 1,
  },
  sectionTitle: {
    marginTop: spacing[4],
    marginBottom: spacing[3],
    paddingHorizontal: spacing[1],
  },
  optionCard: {
    marginBottom: spacing[3],
  },
  optionDescription: {
    marginTop: spacing[2],
    lineHeight: 22,
  },
  buttonContainer: {
    marginTop: spacing[4],
    alignItems: 'flex-start',
  },
  actionButton: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    borderRadius: borderRadius.lg,
  },
  note: {
    marginTop: spacing[6],
    marginHorizontal: spacing[4],
    lineHeight: 20,
  },
});
