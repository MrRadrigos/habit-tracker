import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme';
import { useI18n } from '../i18n';
import { useProfile } from '../storage/profile';
import {
  calculateStreak,
  deleteHabit,
  getCompletions,
  getHabits,
  isScheduledToday,
  toggleCompletion,
  todayKey,
  weekCompletionRate,
} from '../storage/habits';
import HabitCard from '../components/HabitCard';
import MetricCard from '../components/MetricCard';
import InsightCard from '../components/InsightCard';
import { getInsight } from '../services/insights';
import { syncNotifications } from '../services/notifications';

function getGreeting(t) {
  const h = new Date().getHours();
  if (h < 6) return t.home.greetingNight;
  if (h < 12) return t.home.greetingMorning;
  if (h < 18) return t.home.greetingDay;
  return t.home.greetingEvening;
}

function formatDate(date, lang) {
  const locale = lang === 'en' ? 'en-US' : 'ru-RU';
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function HomeScreen({ navigation }) {
  const { theme } = useTheme();
  const { t, lang } = useI18n();
  const { name: userName } = useProfile();
  const [habits, setHabits] = useState([]);
  const [completions, setCompletions] = useState({});
  const [insight, setInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  useEffect(() => {
    syncNotifications(habits).catch(() => {});
  }, [habits]);

  useEffect(() => {
    let cancelled = false;
    if (habits.length === 0) {
      setInsight('');
      return;
    }
    setInsightLoading(true);
    getInsight({ habits, completions, lang })
      .then((text) => {
        if (!cancelled) setInsight(text);
      })
      .finally(() => {
        if (!cancelled) setInsightLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [habits, completions, lang]);

  const todayHabits = useMemo(
    () => habits.filter((h) => isScheduledToday(h)),
    [habits]
  );

  const metrics = useMemo(() => {
    const todayK = todayKey();
    const doneToday = todayHabits.filter((h) =>
      (completions[h.id] || []).includes(todayK)
    ).length;
    const totalToday = todayHabits.length;
    const record = habits.reduce((max, h) => {
      const s = calculateStreak(h, completions[h.id] || []);
      return s > max ? s : max;
    }, 0);
    const weekPct = weekCompletionRate(habits, completions);
    return {
      done: `${doneToday}/${totalToday}`,
      record: `${record}`,
      week: `${weekPct}%`,
    };
  }, [habits, todayHabits, completions]);

  const handleToggle = async (habitId) => {
    const updated = await toggleCompletion(habitId);
    setCompletions(updated);
  };

  const handleEdit = (habit) => {
    navigation.navigate('AddHabit', { habit });
  };

  const handleDelete = (habit) => {
    Alert.alert(t.add.confirmDeleteTitle, t.add.confirmDeleteText, [
      { text: t.add.cancel, style: 'cancel' },
      {
        text: t.add.delete,
        style: 'destructive',
        onPress: async () => {
          const next = await deleteHabit(habit.id);
          setHabits(next);
        },
      },
    ]);
  };

  const handleLongPress = (habit) => {
    Alert.alert(habit.name, t.add.actionsTitle, [
      { text: t.add.cancel, style: 'cancel' },
      { text: t.add.edit, onPress: () => handleEdit(habit) },
      { text: t.add.delete, style: 'destructive', onPress: () => handleDelete(habit) },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const greeting = getGreeting(t);
  const dateStr = formatDate(new Date(), lang);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.textMuted}
          />
        }
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, { color: theme.textMuted }]}>
              {greeting}{userName ? `, ${userName}` : ''}
            </Text>
            <Text style={[styles.date, { color: theme.text }]}>{dateStr}</Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('AddHabit')}
            style={({ pressed }) => [
              styles.addBtn,
              {
                backgroundColor: theme.accent,
                opacity: pressed ? 0.85 : 1,
                shadowColor: theme.accent,
              },
            ]}
          >
            <Text style={styles.addBtnText}>+</Text>
          </Pressable>
        </View>

        <View style={styles.metrics}>
          <MetricCard label={t.home.metricDone} value={metrics.done} />
          <View style={{ width: 10 }} />
          <MetricCard
            label={t.home.metricRecord}
            value={metrics.record}
            sub={t.home.streakDays}
            accent={theme.warning}
          />
          <View style={{ width: 10 }} />
          <MetricCard label={t.home.metricWeek} value={metrics.week} accent={theme.success} />
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t.home.todayTitle}</Text>

        {habits.length === 0 ? (
          <EmptyState
            theme={theme}
            t={t}
            onAdd={() => navigation.navigate('AddHabit')}
          />
        ) : todayHabits.length === 0 ? (
          <View style={[styles.emptyToday, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.emptyTodayText, { color: theme.textMuted }]}>
              {t.home.noHabitsToday}
            </Text>
          </View>
        ) : (
          todayHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              completionsForHabit={completions[habit.id] || []}
              streak={calculateStreak(habit, completions[habit.id] || [])}
              onToggle={() => handleToggle(habit.id)}
              onLongPress={() => handleLongPress(habit)}
              onEdit={() => handleEdit(habit)}
              onDelete={() => handleDelete(habit)}
            />
          ))
        )}

        {habits.length > 0 ? (
          <InsightCard text={insight} loading={insightLoading} />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function EmptyState({ theme, t, onAdd }) {
  return (
    <View
      style={[
        styles.empty,
        { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow },
      ]}
    >
      <Text style={styles.emptyEmoji}>🌱</Text>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>{t.home.emptyTitle}</Text>
      <Text style={[styles.emptySub, { color: theme.textMuted }]}>{t.home.emptySubtitle}</Text>
      <Pressable
        onPress={onAdd}
        style={({ pressed }) => [
          styles.emptyBtn,
          { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Text style={styles.emptyBtnText}>{t.home.addHabit}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
  },
  date: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.6,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '300',
    marginTop: -2,
  },
  metrics: {
    flexDirection: 'row',
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  empty: {
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 3,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  emptyBtn: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyToday: {
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 14,
  },
  emptyTodayText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
