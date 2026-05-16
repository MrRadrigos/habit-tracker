import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  addHabit as storageAddHabit,
  deleteHabit as storageDeleteHabit,
  getCompletions,
  getHabits,
  toggleCompletion as storageToggleCompletion,
  updateHabit as storageUpdateHabit,
} from './habits';
import { clearInsightCache } from '../services/insights';

const HabitsContext = createContext(null);

export function HabitsProvider({ children }) {
  const [habits, setHabits] = useState([]);
  const [completions, setCompletions] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const [h, c] = await Promise.all([getHabits(), getCompletions()]);
      setHabits(h);
      setCompletions(c);
      setLoaded(true);
    })();
  }, []);

  const refresh = useCallback(async () => {
    const [h, c] = await Promise.all([getHabits(), getCompletions()]);
    setHabits(h);
    setCompletions(c);
  }, []);

  const addHabit = useCallback(async (habit) => {
    const next = await storageAddHabit(habit);
    setHabits(next);
    await clearInsightCache().catch(() => {});
    return next;
  }, []);

  const updateHabit = useCallback(async (id, patch) => {
    const next = await storageUpdateHabit(id, patch);
    setHabits(next);
    await clearInsightCache().catch(() => {});
    return next;
  }, []);

  const deleteHabit = useCallback(async (id) => {
    const next = await storageDeleteHabit(id);
    setHabits(next);
    const c = await getCompletions();
    setCompletions(c);
    await clearInsightCache().catch(() => {});
    return next;
  }, []);

  const toggleCompletion = useCallback(async (habitId, date) => {
    const next = await storageToggleCompletion(habitId, date);
    setCompletions(next);
    return next;
  }, []);

  return (
    <HabitsContext.Provider
      value={{
        habits,
        completions,
        loaded,
        refresh,
        addHabit,
        updateHabit,
        deleteHabit,
        toggleCompletion,
      }}
    >
      {children}
    </HabitsContext.Provider>
  );
}

export function useHabits() {
  const ctx = useContext(HabitsContext);
  if (!ctx) throw new Error('useHabits must be used inside HabitsProvider');
  return ctx;
}
