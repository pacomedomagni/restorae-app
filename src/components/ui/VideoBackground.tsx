/**
 * VideoBackground Component
 * Renders a high-quality looping video background with smooth fade-in.
 * Used for "2026 Premium" immersive screens.
 */
import React, { useState } from 'react';
import { StyleSheet, View, ImageSourcePropType } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface VideoBackgroundProps {
  source: { uri: string } | number;
  posterSource?: ImageSourcePropType;
  intensity?: number; // Overlay opacity (0.0 - 1.0)
}

export function VideoBackground({ source, posterSource, intensity = 0.3 }: VideoBackgroundProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handleLoad = () => {
    setIsLoaded(true);
    opacity.value = withTiming(1, { duration: 800 });
  };

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <Video
          source={source}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          isLooping
          shouldPlay
          isMuted
          onLoad={handleLoad}
          posterSource={posterSource}
          usePoster
          posterStyle={{ resizeMode: 'cover' }}
        />
      </Animated.View>
      
      {/* Cinematic Gradient Overlay */}
      <LinearGradient
        colors={[
            `rgba(0,0,0,${intensity * 0.5})`, 
            `rgba(0,0,0,${intensity})`,
            `rgba(0,0,0,${intensity * 1.5})`
        ]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
