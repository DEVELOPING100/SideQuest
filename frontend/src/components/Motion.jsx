import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated } from 'react-native';

// Respect the phone's Reduce Motion preference, including changes while open.
export default function Motion({ children, style, pulse = false, trigger = true }) {
  const [value] = useState(() => new Animated.Value(1));
  useEffect(() => {
    let active = true;
    let animation;
    function run(reduced) {
      animation?.stop();
      value.setValue(1);
      if (!active || reduced || !trigger) return;
      if (pulse) {
        animation = Animated.loop(Animated.sequence([
          Animated.timing(value, { toValue: 1.12, duration: 1200, useNativeDriver: true }),
          Animated.timing(value, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ]));
      } else {
        value.setValue(0.92);
        animation = Animated.spring(value, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true });
      }
      animation.start();
    }
    AccessibilityInfo.isReduceMotionEnabled().then(run).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', run);
    return () => { active = false; animation?.stop(); subscription.remove(); };
  }, [pulse, trigger, value]);
  return <Animated.View style={[style, { transform: [{ scale: value }] }]}>{children}</Animated.View>;
}
