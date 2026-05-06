import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateStreak, isScheduledToday, lastNDates, todayKey } from '../storage/habits';
import { getTranslations } from '../i18n';

const CACHE_KEY = '@cache:insight';

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

export async function getInsight({ habits, completions, lang, apiKey }) {
  const today = todayKey();
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) {
      const cached = JSON.parse(raw);
      if (cached.day === today && cached.lang === lang) return cached.text;
    }
  } catch {}

  const summary = buildSummary(habits, completions);
  let text;

  if (apiKey && summary.length > 0) {
    try {
      text = await callAnthropic({ summary, lang, apiKey });
    } catch {
      text = fallbackInsight(summary, lang);
    }
  } else {
    text = fallbackInsight(summary, lang);
  }

  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ day: today, lang, text }));
  return text;
}

async function callAnthropic({ summary, lang, apiKey }) {
  const systemRu =
    'Ты доброжелательный коуч по привычкам. Дай один краткий персональный инсайт (2–3 предложения) на основе данных пользователя. Без списков, без markdown. Тон — тёплый и мотивирующий.';
  const systemEn =
    'You are a supportive habit coach. Give one short personal insight (2–3 sentences) based on the user data. No lists, no markdown. Warm, motivating tone.';

  const userMsg =
    (lang === 'en' ? 'User habits this week:\n' : 'Привычки пользователя за неделю:\n') +
    summary
      .map(
        (s) =>
          `- ${s.name}: streak ${s.streak}d, week ${s.weekRate}%`
      )
      .join('\n');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 220,
      system: lang === 'en' ? systemEn : systemRu,
      messages: [{ role: 'user', content: userMsg }],
    }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  const text = data?.content?.[0]?.text?.trim();
  if (!text) throw new Error('empty');
  return text;
}

export async function clearInsightCache() {
  await AsyncStorage.removeItem(CACHE_KEY);
}
