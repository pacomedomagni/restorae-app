/**
 * ContextMenu Component
 * 
 * A premium long-press context menu with smooth animations.
 * Features:
 * - Animated scale entrance
 * - Blur background
 * - Haptic feedback
 * - Customizable menu items
 */
import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';
import { useTheme } from '../../contexts/ThemeContext';
import { useHaptics } from '../../hooks/useHaptics';
import { spacing, borderRadius, withAlpha } from '../../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// =============================================================================
// TYPES
// =============================================================================

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  destructive?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

export interface ContextMenuProps {
  visible: boolean;
  items: ContextMenuItem[];
  onClose: () => void;
  /** Position of the menu (where the long press occurred) */
  position?: { x: number; y: number };
  /** Title for the menu */
  title?: string;
  /** Subtitle */
  subtitle?: string;
}

// =============================================================================
// MENU ITEM
// =============================================================================

interface MenuItemProps {
  item: ContextMenuItem;
  index: number;
  onPress: () => void;
  isLast: boolean;
}

function MenuItem({ item, index, onPress, isLast }: MenuItemProps) {
  const { colors, reduceMotion } = useTheme();
  const { impactLight } = useHaptics();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!reduceMotion) {
      scale.value = withSpring(0.97, { damping: 20, stiffness: 400 });
    }
  };

  const handlePressOut = () => {
    if (!reduceMotion) {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    }
  };

  const handlePress = async () => {
    if (item.disabled) return;
    await impactLight();
    onPress();
    item.onPress();
  };

  const textColor = item.destructive 
    ? colors.statusError 
    : item.disabled 
      ? colors.inkFaint 
      : colors.ink;

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.delay(50 * index).duration(200)}
      style={animatedStyle}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={item.disabled}
        style={[
          styles.menuItem,
          { backgroundColor: withAlpha(colors.canvas, 0.8) },
          !isLast && styles.menuItemBorder,
          { borderBottomColor: withAlpha(colors.inkFaint, 0.1) },
        ]}
        accessibilityRole="menuitem"
        accessibilityLabel={item.label}
        accessibilityState={{ disabled: item.disabled }}
      >
        {item.icon && (
          <Text style={[styles.menuIcon, { opacity: item.disabled ? 0.5 : 1 }]}>
            {item.icon}
          </Text>
        )}
        <Text
          variant="bodyLarge"
          style={[
            styles.menuLabel,
            { color: textColor },
            item.disabled && styles.disabledText,
          ]}
        >
          {item.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// =============================================================================
// CONTEXT MENU
// =============================================================================

export function ContextMenu({ 
  visible, 
  items, 
  onClose, 
  position,
  title,
  subtitle,
}: ContextMenuProps) {
  const { colors, reduceMotion, isDark } = useTheme();
  const { impactMedium } = useHaptics();
  const insets = useSafeAreaInsets();
  
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      impactMedium();
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 150 });
    } else {
      scale.value = withTiming(0.8, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  const menuStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Calculate menu position to stay on screen
  const getMenuPosition = () => {
    const menuWidth = 250;
    const menuHeight = (items.length * 52) + (title ? 60 : 0) + 20;
    
    let x = position?.x ?? SCREEN_WIDTH / 2;
    let y = position?.y ?? SCREEN_HEIGHT / 2;
    
    // Adjust for screen edges
    x = Math.max(spacing[4], Math.min(x - menuWidth / 2, SCREEN_WIDTH - menuWidth - spacing[4]));
    y = Math.max(insets.top + spacing[4], Math.min(y - menuHeight / 2, SCREEN_HEIGHT - menuHeight - insets.bottom - spacing[4]));
    
    return { left: x, top: y };
  };

  if (!visible) return null;

  const menuPosition = getMenuPosition();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable 
        style={styles.overlay} 
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close menu"
      >
        {/* Backdrop */}
        <Animated.View 
          entering={reduceMotion ? undefined : FadeIn.duration(150)}
          exiting={reduceMotion ? undefined : FadeOut.duration(100)}
          style={[styles.backdrop, { backgroundColor: withAlpha('#000', 0.3) }]}
        />

        {/* Menu */}
        <Animated.View
          style={[
            styles.menuContainer,
            menuPosition,
            menuStyle,
          ]}
        >
          <BlurView
            intensity={isDark ? 60 : 80}
            tint={isDark ? 'dark' : 'light'}
            style={styles.blurContainer}
          >
            <View style={[
              styles.menuContent,
              { 
                backgroundColor: withAlpha(colors.canvasElevated, 0.85),
                borderColor: withAlpha(colors.inkFaint, 0.1),
              },
            ]}>
              {/* Header */}
              {(title || subtitle) && (
                <View style={[
                  styles.menuHeader,
                  { borderBottomColor: withAlpha(colors.inkFaint, 0.1) },
                ]}>
                  {title && (
                    <Text variant="labelLarge" color="ink" numberOfLines={1}>
                      {title}
                    </Text>
                  )}
                  {subtitle && (
                    <Text variant="bodySmall" color="inkMuted" numberOfLines={1}>
                      {subtitle}
                    </Text>
                  )}
                </View>
              )}

              {/* Menu Items */}
              <View style={styles.menuItems}>
                {items.map((item, index) => (
                  <MenuItem
                    key={item.id}
                    item={item}
                    index={index}
                    onPress={onClose}
                    isLast={index === items.length - 1}
                  />
                ))}
              </View>
            </View>
          </BlurView>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// =============================================================================
// HOOK FOR EASY USAGE
// =============================================================================

interface UseContextMenuReturn {
  isVisible: boolean;
  position: { x: number; y: number } | undefined;
  show: (x: number, y: number) => void;
  hide: () => void;
  onLongPress: (event: any) => void;
}

export function useContextMenu(): UseContextMenuReturn {
  const [isVisible, setIsVisible] = React.useState(false);
  const [position, setPosition] = React.useState<{ x: number; y: number } | undefined>();

  const show = React.useCallback((x: number, y: number) => {
    setPosition({ x, y });
    setIsVisible(true);
  }, []);

  const hide = React.useCallback(() => {
    setIsVisible(false);
  }, []);

  const onLongPress = React.useCallback((event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    show(pageX, pageY);
  }, [show]);

  return {
    isVisible,
    position,
    show,
    hide,
    onLongPress,
  };
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  menuContainer: {
    position: 'absolute',
    width: 250,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  blurContainer: {
    overflow: 'hidden',
    borderRadius: borderRadius.xl,
  },
  menuContent: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuHeader: {
    padding: spacing[3],
    borderBottomWidth: 1,
    gap: spacing[1],
  },
  menuItems: {
    // No padding - items go edge to edge
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuIcon: {
    fontSize: 20,
    width: 24,
    textAlign: 'center',
  },
  menuLabel: {
    flex: 1,
  },
  disabledText: {
    opacity: 0.5,
  },
});

export default ContextMenu;
