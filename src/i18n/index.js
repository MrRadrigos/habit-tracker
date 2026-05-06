import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, createContext, useContext } from 'react';

const translations = {
  ru: {
    appName: 'Дневник привычек',
    tabs: {
      home: 'Сегодня',
      stats: 'Статистика',
      settings: 'Настройки',
    },
    home: {
      greetingMorning: 'Доброе утро',
      greetingDay: 'Добрый день',
      greetingEvening: 'Добрый вечер',
      greetingNight: 'Доброй ночи',
      todayTitle: 'Сегодня',
      emptyTitle: 'Привычек пока нет',
      emptySubtitle: 'Добавь первую привычку и начни строить лучшую версию себя',
      addHabit: 'Добавить привычку',
      metricDone: 'Выполнено',
      metricRecord: 'Рекорд',
      metricWeek: 'За неделю',
      streakDays: 'дн.',
      insightTitle: 'AI-инсайт дня',
      insightLoading: 'Анализирую твой прогресс…',
      insightFallback: 'Каждый отмеченный день — это инвестиция в твоё будущее. Продолжай!',
      noHabitsToday: 'На сегодня нет запланированных привычек — отдохни 🌿',
    },
    days: {
      short: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    },
    add: {
      title: 'Новая привычка',
      name: 'Название',
      namePlaceholder: 'Например, Медитация',
      icon: 'Иконка',
      customIcon: 'Свой эмодзи',
      customIconHint: 'Введите эмодзи',
      customIconAdd: 'Добавить',
      customIconLimit: 'Можно добавить до 5 эмодзи',
      removeIconTitle: 'Удалить эмодзи?',
      removeIconText: 'Эмодзи будет удалён из списка',
      remove: 'Удалить',
      color: 'Цвет',
      reminder: 'Напоминание',
      reminderOff: 'Без напоминания',
      pickTime: 'Выбрать время',
      done: 'Готово',
      frequency: 'Частота',
      everyDay: 'Каждый день',
      byDays: 'По дням недели',
      save: 'Сохранить',
      cancel: 'Отмена',
      edit: 'Редактировать',
      delete: 'Удалить',
      editTitle: 'Редактировать привычку',
      confirmDeleteTitle: 'Удалить привычку?',
      confirmDeleteText: 'Это действие нельзя отменить.',
      actionsTitle: 'Действия',
    },
    stats: {
      title: 'Статистика',
      monthChart: 'За последние 30 дней',
      best: 'Лучшие привычки',
      worst: 'Требуют внимания',
      totalStreak: 'Общий стрик',
    },
    settings: {
      title: 'Настройки',
      profile: 'Профиль',
      name: 'Имя',
      namePlaceholder: 'Как тебя зовут?',
      appearance: 'Внешний вид',
      theme: 'Тема',
      themeDark: 'Тёмная',
      themeLight: 'Светлая',
      themeSystem: 'Как в системе',
      language: 'Язык',
      subscription: 'Подписка',
      free: 'Бесплатный план',
      upgrade: 'Получить Premium',
      about: 'О приложении',
    },
    premium: {
      title: 'Разблокировать Premium',
      subtitle: 'Безлимитные привычки и расширенная аналитика',
      feature1: 'Без ограничений на количество привычек',
      feature2: 'Расширенные AI-инсайты',
      feature3: 'Экспорт данных и резервные копии',
      feature4: 'Приоритетная поддержка',
      cta: 'Оформить за 299 ₽/мес',
      later: 'Не сейчас',
      limitTitle: 'Достигнут лимит',
      limitText: 'В бесплатной версии можно создать до 3 привычек',
    },
  },
  en: {
    appName: 'Habit Diary',
    tabs: {
      home: 'Today',
      stats: 'Stats',
      settings: 'Settings',
    },
    home: {
      greetingMorning: 'Good morning',
      greetingDay: 'Good afternoon',
      greetingEvening: 'Good evening',
      greetingNight: 'Good night',
      todayTitle: 'Today',
      emptyTitle: 'No habits yet',
      emptySubtitle: 'Add your first habit and start building a better you',
      addHabit: 'Add habit',
      metricDone: 'Done today',
      metricRecord: 'Record',
      metricWeek: 'This week',
      streakDays: 'd',
      insightTitle: 'AI insight of the day',
      insightLoading: 'Analyzing your progress…',
      insightFallback: 'Every checked day is an investment in your future. Keep going!',
      noHabitsToday: 'Nothing scheduled for today — take a rest 🌿',
    },
    days: {
      short: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    add: {
      title: 'New habit',
      name: 'Name',
      namePlaceholder: 'For example, Meditation',
      icon: 'Icon',
      customIcon: 'Custom emoji',
      customIconHint: 'Type an emoji',
      customIconAdd: 'Add',
      customIconLimit: 'Up to 5 custom emojis',
      removeIconTitle: 'Remove emoji?',
      removeIconText: 'It will be removed from your custom set',
      remove: 'Remove',
      color: 'Color',
      reminder: 'Reminder',
      reminderOff: 'No reminder',
      pickTime: 'Pick time',
      done: 'Done',
      frequency: 'Frequency',
      everyDay: 'Every day',
      byDays: 'Pick weekdays',
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      editTitle: 'Edit habit',
      confirmDeleteTitle: 'Delete habit?',
      confirmDeleteText: 'This action cannot be undone.',
      actionsTitle: 'Actions',
    },
    stats: {
      title: 'Statistics',
      monthChart: 'Last 30 days',
      best: 'Best habits',
      worst: 'Need attention',
      totalStreak: 'Total streak',
    },
    settings: {
      title: 'Settings',
      profile: 'Profile',
      name: 'Name',
      namePlaceholder: "What's your name?",
      appearance: 'Appearance',
      theme: 'Theme',
      themeDark: 'Dark',
      themeLight: 'Light',
      themeSystem: 'System',
      language: 'Language',
      subscription: 'Subscription',
      free: 'Free plan',
      upgrade: 'Get Premium',
      about: 'About',
    },
    premium: {
      title: 'Unlock Premium',
      subtitle: 'Unlimited habits and advanced analytics',
      feature1: 'Unlimited habits',
      feature2: 'Advanced AI insights',
      feature3: 'Data export & backups',
      feature4: 'Priority support',
      cta: 'Subscribe for $3.99/mo',
      later: 'Not now',
      limitTitle: 'Limit reached',
      limitText: 'The free plan allows up to 3 habits',
    },
  },
};

const STORAGE_KEY = '@settings:lang';

const I18nContext = createContext({
  lang: 'ru',
  t: translations.ru,
  setLang: () => {},
});

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState('ru');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'ru' || stored === 'en') setLangState(stored);
    });
  }, []);

  const setLang = async (next) => {
    setLangState(next);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <I18nContext.Provider value={{ lang, t: translations[lang], setLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function getTranslations(lang) {
  return translations[lang] || translations.ru;
}
