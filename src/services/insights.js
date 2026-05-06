import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { calculateStreak, isScheduledToday, lastNDates, todayKey } from '../storage/habits';
import { getTranslations } from '../i18n';

const CACHE_KEY = '@cache:insight';

function getInsightsUrl() {
  const fromExpo = Constants?.expoConfig?.extra?.insightsUrl;
  const fromManifest = Constants?.manifest?.extra?.insightsUrl;
  const fromEnv =
    typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_INSIGHTS_URL : null;
  return fromExpo || fromManifest || fromEnv || '';
}

function buildSummary(habits, completions) {
  const week = lastNDates(7);
  return habits.map((habit) => {
    const done = new Set(completions[habit.id] || []);
    let scheduled = 0;
    let completed = 0;
    for (const d of week) {
      if (isScheduledToday(habit, d)) {
        scheduled += 1;
        if (done.has(todayKey(d))) completed += 1;
      }
    }
    const rate = scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100);
    return {
      name: habit.name,
      streak: calculateStreak(habit, completions[habit.id] || []),
      weekRate: rate,
    };
  });
}

function fallbackInsight(summary, lang) {
  const t = getTranslations(lang);
  if (summary.length === 0) return t.home.insightFallback;
  const best = [...summary].sort((a, b) => b.weekRate - a.weekRate)[0];
  if (lang === 'en') {
    return `Your strongest habit this week is "${best.name}" at ${best.weekRate}%. Keep the momentum and try to lift the others by one check today.`;
  }
  return `Самая сильная привычка недели — «${best.name}» (${best.weekRate}%). Удержи темп и подтяни остальные хотя бы на одну отметку сегодня.`;
}

async function callProxy({ summary, lang, url }) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ summary, lang }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (!data?.text) throw new Error('empty');
  return data.text.trim();
}

export async function getInsight({ habits, completions, lang }) {
  const today = todayKey();
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) {
      const cached = JSON.parse(raw);
      if (cached.day === today && cached.lang === lang) return cached.text;
    }
  } catch {}

  const summary = buildSummary(habits, completions);
  const url = getInsightsUrl();
  let text;

  if (url && summary.length > 0) {
    try {
      text = await callProxy({ summary, lang, url });
    } catch {
      text = fallbackInsight(summary, lang);
    }
  } else {
    text = fallbackInsight(summary, lang);
  }

  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ day: today, lang, text }));
  return text;
}

export async function clearInsightCache() {
  await AsyncStorage.removeItem(CACHE_KEY);
}
