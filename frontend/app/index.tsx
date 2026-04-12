import { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const titleOpacity = useSharedValue(0);
  const titleScale = useSharedValue(0.7);
  const sloganOpacity = useSharedValue(0);
  const lineWidth = useSharedValue(0);

  useEffect(() => {
    titleOpacity.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    titleScale.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    lineWidth.value = withDelay(400, withTiming(120, { duration: 800, easing: Easing.out(Easing.cubic) }));
    sloganOpacity.value = withDelay(800, withTiming(1, { duration: 800 }));
  }, []);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        if (user) {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/(auth)/login');
        }
      }, 2800);
      return () => clearTimeout(timer);
    }
  }, [loading, user]);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ scale: titleScale.value }],
  }));

  const sloganStyle = useAnimatedStyle(() => ({
    opacity: sloganOpacity.value,
  }));

  const lineStyle = useAnimatedStyle(() => ({
    width: lineWidth.value,
    opacity: lineWidth.value > 0 ? 1 : 0,
  }));

  return (
    <View testID="splash-screen" style={styles.container}>
      <Animated.Text style={[styles.title, titleStyle]}>ARIA</Animated.Text>
      <Animated.View style={[styles.line, lineStyle]} />
      <Animated.Text style={[styles.slogan, sloganStyle]}>
        L'intelligence artificielle{'\n'}au service de votre beauté
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 72,
    fontWeight: '100',
    color: '#FF2D55',
    letterSpacing: 28,
    paddingLeft: 28,
  },
  line: {
    height: 1,
    backgroundColor: '#FF2D55',
    marginTop: 20,
    marginBottom: 20,
  },
  slogan: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    letterSpacing: 2,
    lineHeight: 22,
    textTransform: 'uppercase',
  },
});
