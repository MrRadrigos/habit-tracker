import AsyncStorage from '@react-native-async-storage/async-storage';

const HABITS_KEY = '@data:habits';
const COMPLETIONS_KEY = '@data:completions';

export function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function dayOfWeekIndex(date = new Date()) {
  // Monday = 0 ... Sunday = 6
  const js = date.getDay();
  return js === 0 ? 6 : js - 1;
}

export async function getHabits() {
  const raw = await AsyncStorage.getItem(HABITS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveHabits(habits) {
  await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(habits));
}

export async function addHabit(habit) {
  const habits = await getHabits();
  const next = [...habits, habit];
  await saveHabits(next);
  return next;
}

export async function updateHabit(id, patch) {
  const habits = await getHabits();
  const next = habits.map((h) => (h.id === id ? { ...h, ...patch, id } : h));
  await saveHabits(next);
  return next;
}

export async function deleteHabit(id) {
  const habits = await getHabits();
  const next = habits.filter((h) => h.id !== id);
  await saveHabits(next);
  const completions = await getCompletions();
  if (completions[id]) {
    delete completions[id];
    await saveCompletions(completions);
  }
  return next;
}

export async function getCompletions() {
  const raw = await AsyncStorage.getItem(COMPLETIONS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function saveCompletions(map) {
  await AsyncStorage.setItem(COMPLETIONS_KEY, JSON.stringify(map));
}

export async function toggleCompletion(habitId, dayKey = todayKey()) {
  const map = await getCompletions();
  const days = new Set(map[habitId] || []);
  if (days.has(dayKey)) days.delete(dayKey);
  else days.add(dayKey);
  map[habitId] = Array.from(days).sort();
  await saveCompletions(map);
  return map;
}

export function isScheduledToday(habit, date = new Date()) {
  if (!habit.frequency || habit.frequency.type === 'daily') return true;
  if (habit.frequency.type === 'weekly') {
    const idx = dayOfWeekIndex(date);
    return habit.frequency.days?.includes(idx);
  }
  return true;
}

export function calculateStreak(habit, completionsForHabit = []) {
  const set = new Set(completionsForHabit);
  let streak = 0;
  const cursor = new Date();
  // If today is not done yet, allow streak from yesterday
  if (!set.has(todayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  for (let i = 0; i < 365; i++) {
    const k = todayKey(cursor);
    if (!isScheduledToday(habit, cursor)) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    if (set.has(k)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function lastNDates(n, end = new Date()) {
  const result = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    result.push(d);
  }
  return result;
}

export function weekCompletionRate(habits, completions) {
  const week = lastNDates(7);
  let scheduled = 0;
  let done = 0;
  for (const habit of habits) {
    const hDone = new Set(completions[habit.id] || []);
    for (const d of week) {
      if (isScheduledToday(habit, d)) {
        scheduled += 1;
        if (hDone.has(todayKey(d))) done += 1;
      }
    }
  }
  if (scheduled === 0) return 0;
  return Math.round((done / scheduled) * 100);
}
