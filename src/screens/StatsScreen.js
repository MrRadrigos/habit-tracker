import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme';
import { useI18n } from '../i18n';
import {
  calculateStreak,
  getCompletions,
  getHabits,
  isScheduledToday,
  lastNDates,
  todayKey,
} from '../storage/habits';
import MonthChart from '../components/MonthChart';

function habitWeekRate(habit, completions) {
  const week = lastNDates(7);
  const done = new Set(completions[habit.id] || []);
  let scheduled = 0;
  let completed = 0;
  for (const d of week) {
    if (isScheduledToday(habit, d)) {
      scheduled += 1;
      if (done.has(todayKey(d))) completed += 1;
    }
  }
  return scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100);
}

function calculateTotalStreak(habits, completions) {
  if (habits.length === 0) return 0;
  let streak = 0;
  const cursor = new Date();
  let allDoneToday = true;
  for (const h of habits) {
    if (isScheduledToday(h, cursor)) {
      const done = (completions[h.id] || []).includes(todayKey(cursor));
      if (!done) {
        allDoneToday = false;
        break;
      }
    }
  }
  if (!allDoneToday) cursor.setDate(cursor.getDate() - 1);

  for (let i = 0; i < 365; i++) {
    let any = false;
    let allOk = true;
    for (const h of habits) {
      if (isScheduledToday(h, cursor)) {
        any = true;
        if (!(completions[h.id] || []).includes(todayKey(cursor))) {
          allOk = false;
          break;
        }
      }
    }
    if (!any) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    if (allOk) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export default function StatsScreen() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [habits, setHabits] = useState([]);
  const [completions, setCompletions] = useState({});

  const load = useCallback(async () => {
    const [h, c] = await Promise.all([getHabits(), getCompletions()]);
    setHabits(h);
    setCompletions(c);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const ranked = useMemo(() => {
    return habits
      .map((h) => ({
        habit: h,
        rate: habitWeekRate(h, completions),
        streak: calculateStreak(h, completions[h.id] || []),
      }))
      .sort((a, b) => b.rate - a.rate);
  }, [habits, completions]);

  const best = ranked.slice(0, 3);
  const worst = [...ranked].reverse().slice(0, 3);
  const totalStreak = useMemo(
    () => calculateTotalStreak(habits, completions),
    [habits, completions]
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.text }]}>{t.stats.title}</Text>

        <View
          style={[
            styles.streakCard,
            { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow },
          ]}
        >
          <Text style={[styles.streakLabel, { color: theme.textMuted }]}>
            {t.stats.totalStreak}
          </Text>
          <View style={styles.streakRow}>
            <Text style={styles.streakIcon}>🔥</Text>
            <Text style={[styles.streakNum, { color: theme.text }]}>{totalStreak}</Text>
            <Text style={[styles.streakUnit, { color: theme.textMuted }]}>
              {t.home.streakDays}
            </Text>
          </View>
        </View>

        <Text style={[styles.section, { color: theme.textMuted }]}>{t.stats.monthChart}</Text>
        <MonthChart habits={habits} completions={completions} />

        {best.length > 0 ? (
          <>
            <Text style={[styles.section, { color: theme.textMuted }]}>{t.stats.best}</Text>
            {best.map((b) => (
              <RankRow key={b.habit.id} entry={b} theme={theme} />
            ))}
          </>
        ) : null}

        {worst.length > 0 && worst[0].rate < 100 ? (
          <>
            <Text style={[styles.section, { color: theme.textMuted }]}>{t.stats.worst}</Text>
            {worst
              .filter((w) => w.rate < 100)
              .map((b) => (
                <RankRow key={b.habit.id} entry={b} theme={theme} />
              ))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function RankRow({ entry, theme }) {
  const { habit, rate, streak } = entry;
  return (
    <View
      style={[
        styles.rankRow,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <View style={[styles.rankIcon, { backgroundColor: habit.color + '2E' }]}>
        <Text style={{ fontSize: 18 }}>{habit.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rankName, { color: theme.text }]} numberOfLines={1}>
          {habit.name}
        </Text>
        <Text style={[styles.rankSub, { color: theme.textDim }]}>
          🔥 {streak}
        </Text>
      </View>
      <Text style={[styles.rankRate, { color: habit.color }]}>{rate}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 18, paddingBottom: 32 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginBottom: 18,
  },
  streakCard: {
    borderRadius: 22,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 8,
  },
  streakLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  streakIcon: { fontSize: 28, marginRight: 8 },
  streakNum: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 44,
  },
  streakUnit: { fontSize: 14, marginLeft: 6, marginBottom: 6 },
  section: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 22,
    marginBottom: 10,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  rankIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankName: { fontSize: 15, fontWeight: '600' },
  rankSub: { fontSize: 12, marginTop: 2 },
  rankRate: { fontSize: 15, fontWeight: '700', marginLeft: 8 },
});
