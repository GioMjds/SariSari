import {
  SPLASH_CANVAS,
  SPLASH_DOT,
  SPLASH_LETTERS,
} from '@/constants/splashWordmark';
import { useCallback, useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

/**
 * Motion follows docs/design/splash-loader/splash-loader-spec.md section 4.
 * Only transform and opacity animate. All sequencing runs on the UI thread,
 * so JS-thread work (db init) cannot stall it.
 */

const CINNAMON = '#623418';
const PERSIMMON = '#E85A1F';

const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  fall: Easing.bezier(0.55, 0, 1, 0.45),
  standard: Easing.bezier(0.4, 0, 0.2, 1),
  linear: Easing.linear,
};

// Phases
const P_ENTER = 0;
const P_ACCENT = 1;
const P_HOLD = 2;
const P_LOOP_MOVE = 3;
const P_LOOP_STATIC = 4;
const P_FADE = 5;
const P_EXIT = 6;

// Events
const E_ENTER_END = 0;
const E_ACCENT_END = 1;
const E_HOLD_END = 2;
const E_MOVE_END = 3;
const E_STATIC_END = 4;
const E_FADE_END = 5;

interface SplashWordmarkProps {
  /** App can render its first screen. Splash exits as soon as the spec allows. */
  ready: boolean;
  /** Called once, after the exit finished. Navigate here. */
  onDone: () => void;
}

interface LetterProps {
  d: string;
  index: number;
  width: number;
  height: number;
  k: number;
  animate: boolean;
}

function Letter({ d, index, width, height, k, animate }: LetterProps) {
  const y = useSharedValue(animate ? 8 * k : 0);
  const opacity = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (!animate) return;
    const cfg = { duration: 220, easing: EASE.out };
    y.value = withDelay(index * 40, withTiming(0, cfg));
    opacity.value = withDelay(index * 40, withTiming(1, cfg));
  }, [animate, index, y, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: y.value }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${SPLASH_CANVAS.width} ${SPLASH_CANVAS.height}`}
      >
        <Path d={d} fill={CINNAMON} fillRule="nonzero" />
      </Svg>
    </Animated.View>
  );
}

export function SplashWordmark({ ready, onDone }: SplashWordmarkProps) {
  const reducedMotion = useReducedMotion();
  const { width: screenWidth } = useWindowDimensions();

  const width = Math.min(screenWidth - 48, SPLASH_CANVAS.width);
  const k = width / SPLASH_CANVAS.width;
  const height = SPLASH_CANVAS.height * k;

  const readySV = useSharedValue(0);
  const phase = useSharedValue(P_ENTER);
  const driver = useSharedValue(0);
  const evtType = useSharedValue(-1);
  const evtCount = useSharedValue(0);
  const fadeInDone = useSharedValue(0);

  const wordOpacity = useSharedValue(reducedMotion ? 0 : 1);
  const wordY = useSharedValue(0);
  const dotY = useSharedValue(reducedMotion ? 0 : -24 * k);
  const dotOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const dotScale = useSharedValue(1);

  const finish = useCallback(() => onDone(), [onDone]);

  useEffect(() => {
    readySV.value = ready ? 1 : 0;
  }, [ready, readySV]);

  // ---- Full sequence (worklets) ----------------------------------------
  const fire = (type: number) => {
    'worklet';
    evtType.value = type;
    evtCount.value = evtCount.value + 1;
  };

  const runDriver = (ms: number, type: number) => {
    'worklet';
    driver.value = 0;
    driver.value = withTiming(
      1,
      { duration: ms, easing: EASE.linear },
      (finished) => {
        if (finished) fire(type);
      },
    );
  };

  const doExit = () => {
    'worklet';
    phase.value = P_EXIT;
    wordY.value = withTiming(-6 * k, { duration: 500, easing: EASE.standard });
    wordOpacity.value = withTiming(
      0,
      { duration: 500, easing: EASE.standard },
      (finished) => {
        if (finished) runOnJS(finish)();
      },
    );
  };

  const doAccent = () => {
    'worklet';
    phase.value = P_ACCENT;
    dotOpacity.value = withTiming(1, { duration: 80, easing: EASE.linear });
    dotY.value = withSequence(
      withTiming(2 * k, { duration: 280, easing: EASE.fall }),
      withTiming(0, { duration: 220, easing: EASE.out }),
    );
    dotScale.value = withDelay(
      240,
      withSequence(
        withTiming(0.92, { duration: 40, easing: EASE.linear }),
        withTiming(1, { duration: 220, easing: EASE.out }),
      ),
    );
    runDriver(500, E_ACCENT_END);
  };

  const doEarlyFade = () => {
    'worklet';
    phase.value = P_FADE;
    dotY.value = 0;
    dotOpacity.value = withTiming(
      1,
      { duration: 100, easing: EASE.linear },
      (finished) => {
        if (finished) fire(E_FADE_END);
      },
    );
  };

  const doLoopMove = () => {
    'worklet';
    phase.value = P_LOOP_MOVE;
    dotY.value = withSequence(
      withTiming(-6 * k, { duration: 200, easing: EASE.standard }),
      withTiming(1 * k, { duration: 150, easing: EASE.fall }),
      withTiming(0, { duration: 150, easing: EASE.out }),
    );
    dotScale.value = withDelay(
      310,
      withSequence(
        withTiming(0.96, { duration: 40, easing: EASE.linear }),
        withTiming(1, { duration: 150, easing: EASE.out }),
      ),
    );
    runDriver(500, E_MOVE_END);
  };

  useAnimatedReaction(
    () => evtCount.value,
    (count, prev) => {
      if (reducedMotion || prev === null || count === prev) return;
      const isReady = readySV.value === 1;
      switch (evtType.value) {
        case E_ENTER_END:
          if (isReady) doEarlyFade();
          else doAccent();
          break;
        case E_ACCENT_END:
          if (isReady) {
            doExit();
          } else {
            phase.value = P_HOLD;
            runDriver(300, E_HOLD_END);
          }
          break;
        case E_HOLD_END:
        case E_STATIC_END:
          if (isReady) doExit();
          else doLoopMove();
          break;
        case E_MOVE_END:
          if (isReady) {
            doExit();
          } else {
            phase.value = P_LOOP_STATIC;
            runDriver(700, E_STATIC_END);
          }
          break;
        case E_FADE_END:
          doExit();
          break;
      }
    },
  );

  // Ready during a static hold: exit at once. A hold is static, so the cut is seamless.
  useAnimatedReaction(
    () => readySV.value,
    (isReady) => {
      if (reducedMotion || isReady !== 1) return;
      if (phase.value === P_HOLD || phase.value === P_LOOP_STATIC) {
        cancelAnimation(driver);
        doExit();
      }
    },
  );

  // ---- Reduced motion: 200 ms fade in, wait for ready, 150 ms fade out ----
  useAnimatedReaction(
    () => readySV.value === 1 && fadeInDone.value === 1,
    (go) => {
      if (!reducedMotion || !go) return;
      wordOpacity.value = withTiming(
        0,
        {
          duration: 150,
          easing: EASE.linear,
          reduceMotion: ReduceMotion.Never,
        },
        (finished) => {
          if (finished) runOnJS(finish)();
        },
      );
    },
  );

  useEffect(() => {
    if (reducedMotion) {
      wordOpacity.value = withTiming(
        1,
        {
          duration: 200,
          easing: EASE.linear,
          reduceMotion: ReduceMotion.Never,
        },
        (finished) => {
          if (finished) fadeInDone.value = 1;
        },
      );
      return;
    }
    // Letters animate themselves. Enter ends when the last letter lands (500 ms).
    driver.value = withTiming(
      1,
      { duration: 500, easing: EASE.linear },
      (finished) => {
        if (finished) {
          evtType.value = E_ENTER_END;
          evtCount.value = evtCount.value + 1;
        }
      },
    );
    return () => cancelAnimation(driver);
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wordStyle = useAnimatedStyle(() => ({
    opacity: wordOpacity.value,
    transform: [{ translateY: wordY.value }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
    transform: [{ translateY: dotY.value }, { scale: dotScale.value }],
  }));

  return (
    <Animated.View
      accessible
      accessibilityRole="image"
      accessibilityLabel="SariSari"
      style={[{ width, height }, wordStyle]}
    >
      {SPLASH_LETTERS.map((letter, i) => (
        <Letter
          key={`${letter.ch}-${i}`}
          d={letter.d}
          index={i}
          width={width}
          height={height}
          k={k}
          animate={!reducedMotion}
        />
      ))}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: SPLASH_DOT.x * k,
          top: SPLASH_DOT.y * k,
          width: SPLASH_DOT.size * k,
          height: SPLASH_DOT.size * k,
        }}
      >
        <Animated.View
          style={[
            {
              flex: 1,
              backgroundColor: PERSIMMON,
              transformOrigin: '50% 100%',
            },
            dotStyle,
          ]}
        />
      </View>
    </Animated.View>
  );
}
