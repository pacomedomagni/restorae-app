/**
 * JournalSearchScreen
 * 
 * Search through journal entries with filters
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useJournal } from '../contexts/JournalContext';
import { useHaptics } from '../hooks/useHaptics';
import type { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type DateFilter = 'all' | 'week' | 'month' | 'year';

export default function JournalSearchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const { entries } = useJournal();
  const { impactLight } = useHaptics();

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const filteredEntries = useMemo(() => {
    let filtered = [...entries];

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let cutoffDate = new Date();

      switch (dateFilter) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter(
        entry => new Date(entry.createdAt) >= cutoffDate
      );
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(entry => {
        const titleMatch = entry.title?.toLowerCase().includes(query);
        const contentMatch = entry.content.toLowerCase().includes(query);
        const tagsMatch = entry.tags?.some(tag => tag.toLowerCase().includes(query));
        const moodMatch = entry.mood?.toLowerCase().includes(query);
        return titleMatch || contentMatch || tagsMatch || moodMatch;
      });
    }

    // Sort by date, newest first
    return filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [entries, searchQuery, dateFilter]);

  const handleEntryPress = useCallback(async (entryId: string) => {
    await impactLight();
    navigation.navigate('JournalEntry', { mode: 'view', entryId });
  }, [navigation, impactLight]);

  const handleFilterPress = useCallback(async (filter: DateFilter) => {
    await impactLight();
    setDateFilter(filter);
  }, [impactLight]);

  const clearSearch = useCallback(async () => {
    await impactLight();
    setSearchQuery('');
  }, [impactLight]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const getPreviewText = (content: string, query: string): string => {
    const maxLength = 100;
    
    if (query.trim()) {
      const index = content.toLowerCase().indexOf(query.toLowerCase());
      if (index !== -1) {
        const start = Math.max(0, index - 30);
        const end = Math.min(content.length, index + query.length + 70);
        let preview = content.substring(start, end);
        if (start > 0) preview = '...' + preview;
        if (end < content.length) preview = preview + '...';
        return preview;
      }
    }

    return content.length > maxLength
      ? content.substring(0, maxLength) + '...'
      : content;
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <Text key={i} style={{ backgroundColor: colors.accentWarm }}>
          {part}
        </Text>
      ) : (
        part
      )
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    searchContainer: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceSubtle,
      borderRadius: 12,
      paddingHorizontal: 12,
      borderWidth: isSearchFocused ? 2 : 0,
      borderColor: colors.accentPrimary,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.ink,
    },
    clearButton: {
      padding: 4,
    },
    filtersContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    filterChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.surfaceSubtle,
      marginRight: 8,
    },
    filterChipActive: {
      backgroundColor: colors.accentPrimary,
    },
    filterText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.inkMuted,
    },
    filterTextActive: {
      color: colors.inkInverse,
    },
    resultsInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    resultsText: {
      fontSize: 14,
      color: colors.inkMuted,
    },
    listContainer: {
      flex: 1,
    },
    entryCard: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    entryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    entryTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: colors.ink,
      marginRight: 8,
    },
    entryDate: {
      fontSize: 12,
      color: colors.inkMuted,
    },
    entryContent: {
      fontSize: 14,
      color: colors.inkMuted,
      lineHeight: 20,
      marginBottom: 8,
    },
    entryMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },
    moodBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceSubtle,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    moodText: {
      fontSize: 12,
      color: colors.inkMuted,
      marginLeft: 4,
    },
    tagBadge: {
      backgroundColor: colors.surfaceSubtle,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    tagText: {
      fontSize: 12,
      color: colors.accentPrimary,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.surfaceSubtle,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.ink,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      color: colors.inkMuted,
      textAlign: 'center',
    },
    lockedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.accentWarm,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    lockedText: {
      fontSize: 12,
      color: colors.ink,
      marginLeft: 4,
    },
  });

  const FILTERS: { label: string; value: DateFilter }[] = [
    { label: 'All Time', value: 'all' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'This Year', value: 'year' },
  ];

  const MOOD_ICONS: Record<string, string> = {
    great: 'emoticon-excited-outline',
    good: 'emoticon-happy-outline',
    okay: 'emoticon-neutral-outline',
    meh: 'emoticon-sad-outline',
    bad: 'emoticon-cry-outline',
  };

  const renderEntry = ({ item }: { item: typeof entries[0] }) => (
    <TouchableOpacity
      style={styles.entryCard}
      onPress={() => handleEntryPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.entryHeader}>
        <Text style={styles.entryTitle} numberOfLines={1}>
          {item.title || 'Untitled Entry'}
        </Text>
        <Text style={styles.entryDate}>{formatDate(item.createdAt)}</Text>
      </View>

      <Text style={styles.entryContent} numberOfLines={3}>
        {item.isEncrypted ? (
          <Text style={{ fontStyle: 'italic' }}>This entry is encrypted</Text>
        ) : (
          highlightText(getPreviewText(item.content, searchQuery), searchQuery)
        )}
      </Text>

      <View style={styles.entryMeta}>
        {item.isEncrypted && (
          <View style={styles.lockedBadge}>
            <MaterialCommunityIcons name="lock" size={12} color={colors.ink} />
            <Text style={styles.lockedText}>Encrypted</Text>
          </View>
        )}
        
        {item.mood && (
          <View style={styles.moodBadge}>
            <MaterialCommunityIcons
              name={(MOOD_ICONS[item.mood] || 'emoticon-outline') as any}
              size={14}
              color={colors.inkMuted}
            />
            <Text style={styles.moodText}>
              {item.mood.charAt(0).toUpperCase() + item.mood.slice(1)}
            </Text>
          </View>
        )}

        {item.tags?.slice(0, 3).map(tag => (
          <View key={tag} style={styles.tagBadge}>
            <Text style={styles.tagText}>#{tag}</Text>
          </View>
        ))}
        {item.tags && item.tags.length > 3 && (
          <Text style={styles.tagText}>+{item.tags.length - 3}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons 
          name="file-search-outline" 
          size={40} 
          color={colors.inkMuted} 
        />
      </View>
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No Results Found' : 'No Journal Entries'}
      </Text>
      <Text style={styles.emptyText}>
        {searchQuery
          ? `No entries match "${searchQuery}". Try different keywords or filters.`
          : 'Start writing to build your journal collection.'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialCommunityIcons
            name="magnify"
            size={24}
            color={colors.inkMuted}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search entries..."
            placeholderTextColor={colors.inkFaint}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
              <MaterialCommunityIcons 
                name="close-circle" 
                size={20} 
                color={colors.inkMuted} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filtersContainer}>
        {FILTERS.map(filter => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterChip,
              dateFilter === filter.value && styles.filterChipActive,
            ]}
            onPress={() => handleFilterPress(filter.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterText,
                dateFilter === filter.value && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.resultsInfo}>
        <Text style={styles.resultsText}>
          {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
        </Text>
      </View>

      <FlatList
        style={styles.listContainer}
        data={filteredEntries}
        keyExtractor={item => item.id}
        renderItem={renderEntry}
        ListEmptyComponent={renderEmpty}
        onScrollBeginDrag={Keyboard.dismiss}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}
