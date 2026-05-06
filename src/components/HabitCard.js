import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useTheme } from '../theme';
import { useI18n } from '../i18n';
import { dayOfWeekIndex, isScheduledToday, lastNDates, todayKey } from '../storage/habits';

function hexWithAlpha(hex, alpha) {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

function Checkbox({ checked, color, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const fill = useRef(new Animated.Value(checked ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(fill, {
      toValue: checked ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [checked]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(
        checked ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
      ).catch(() => {});
    }
    onPress();
  };

  const bg = fill.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,0,0,0)', color],
  });

  return (
    <Pressable onPress={handlePress} hitSlop={10}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Animated.View
          style={[
            styles.checkbox,
            { borderColor: color, backgroundColor: bg },
          ]}
        >
          {checked ? <Text style={styles.checkmark}>✓</Text> : null}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

function WeekStrip({ habit, doneSet, color }) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const days = lastNDates(7);
  const todayIdx = dayOfWeekIndex();

  return (
    <View style={styles.weekStrip}>
      {days.map((d, i) => {
        const key = todayKey(d);
        const scheduled = isScheduledToday(habit, d);
        const completed = doneSet.has(key);
        const dayLabel = t.days.short[dayOfWeekIndex(d)];
        const isToday = i === days.length - 1;

        let bg = 'transparent';
        let textColor = theme.textDim;
        let borderColor = 'transparent';

        if (completed) {
          bg = color;
          textColor = '#fff';
        } else if (scheduled) {
          bg = hexWithAlpha(color, 0.12);
          textColor = theme.textMuted;
        } else {
          bg = theme.cardAlt;
        }
        if (isToday && !completed) {
          borderColor = color;
        }

        return (
          <View key={i} style={styles.weekCell}>
            <Text style={[styles.weekLabel, { color: theme.textDim }]}>{dayLabel}</Text>
            <View
              style={[
                styles.weekDot,
                { backgroundColor: bg, borderColor, borderWidth: borderColor === 'transparent' ? 0 : 1.5 },
              ]}
            >
              <Text style={[styles.weekNum, { color: textColor }]}>{d.getDate()}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function HabitCard({
  habit,
  completionsForHabit,
  streak,
  onToggle,
  onLongPress,
  onEdit,
  onDelete,
}) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const swipeRef = useRef(null);
  const pressScale = useRef(new Animated.Value(1)).current;

  const doneSet = new Set(completionsForHabit);
  const checked = doneSet.has(todayKey());
  const color = habit.color;

  const animatePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.97,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const animatePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  const handleLongPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    Animated.sequence([
      Animated.timing(pressScale, { toValue: 0.94, duration: 90, useNativeDriver: true }),
      Animated.spring(pressScale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
    onLongPress?.();
  };

  const closeAndRun = (fn) => {
    swipeRef.current?.close?.();
    setTimeout(() => fn?.(), 80);
  };

  const renderRightActions = () => (
    <View style={styles.swipeActions}>
      <Pressable
        onPress={() => closeAndRun(onEdit)}
        style={({ pressed }) => [
          styles.swipeAction,
          { backgroundColor: theme.warning, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Text style={styles.swipeIcon}>✏️</Text>
        <Text style={styles.swipeText}>{t.add.edit}</Text>
      </Pressable>
      <Pressable
        onPress={() => closeAndRun(onDelete)}
        style={({ pressed }) => [
          styles.swipeAction,
          { backgroundColor: theme.danger, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Text style={styles.swipeIcon}>🗑️</Text>
        <Text style={styles.swipeText}>{t.add.delete}</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.cardOuter}>
      <ReanimatedSwipeable
        ref={swipeRef}
        renderRightActions={renderRightActions}
        rightThreshold={40}
        overshootRight={false}
        friction={2}
        containerStyle={styles.swipeContainer}
      >
        <Animated.View style={{ transform: [{ scale: pressScale }] }}>
          <Pressable
            onLongPress={handleLongPress}
            delayLongPress={350}
            onPressIn={animatePressIn}
            onPressOut={animatePressOut}
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                shadowColor: theme.shadow,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.row}>
              <View style={[styles.iconWrap, { backgroundColor: hexWithAlpha(color, 0.18) }]}>
                <Text style={styles.icon}>{habit.icon}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                  {habit.name}
                </Text>
                <View style={styles.streakRow}>
                  <Text style={styles.streakIcon}>🔥</Text>
                  <Text style={[styles.streakNum, { color: theme.textMuted }]}>
                    {streak} {t.home.streakDays}
                  </Text>
                  {habit.reminder ? (
                    <Text style={[styles.reminder, { color: theme.textDim }]}>· {habit.reminder}</Text>
                  ) : null}
                </View>
              </View>
              <Checkbox checked={checked} color={color} onPress={onToggle} />
            </View>
            <WeekStrip habit={habit} doneSet={doneSet} color={color} />
          </Pressable>
        </Animated.View>
      </ReanimatedSwipeable>
    </View>
  );
}

const styles = StyleSheet.create({
  cardOuter: {
    marginBottom: 14,
    borderRadius: 22,
  },
  swipeContainer: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  swipeActions: {
    flexDirection: 'row',
    width: 168,
  },
  swipeAction: {
    width: 80,
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  swipeIcon: {
    fontSize: 20,
  },
  swipeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  card: {
    borderRadius: 22,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 22,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  streakIcon: {
    fontSize: 13,
  },
  streakNum: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
  reminder: {
    fontSize: 12,
    marginLeft: 6,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: -1,
  },
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  weekCell: {
    alignItems: 'center',
    flex: 1,
  },
  weekLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  weekDot: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekNum: {
    fontSize: 12,
    fontWeight: '600',
  },
});
