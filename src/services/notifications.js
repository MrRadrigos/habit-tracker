import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getHabits } from '../storage/habits';

let configured = false;

function configure() {
  if (configured) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('habits', {
      name: 'Habit reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#7C5CFF',
    }).catch(() => {});
  }
  configured = true;
}

export async function ensurePermission() {
  configure();
  const settings = await Notifications.getPermissionsAsync();
  if (
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return true;
  }
  const req = await Notifications.requestPermissionsAsync();
  return (
    req.granted ||
    req.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

// our weekday: 0=Mon ... 6=Sun
// expo weekday: 1=Sun ... 7=Sat
function ourDayToExpoWeekday(d) {
  return d === 6 ? 1 : d + 2;
}

function parseTime(t) {
  const [h, m] = t.split(':').map(Number);
  return { hour: h, minute: m };
}

async function scheduleForHabit(habit) {
  if (!habit.reminder) return;
  const { hour, minute } = parseTime(habit.reminder);
  const title = habit.icon ? `${habit.icon}  ${habit.name}` : habit.name;

  if (habit.frequency?.type === 'weekly') {
    for (const d of habit.frequency.days || []) {
      await Notifications.scheduleNotificationAsync({
        content: { title, sound: false },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: ourDayToExpoWeekday(d),
          hour,
          minute,
          channelId: 'habits',
        },
      }).catch(() => {});
    }
  } else {
    await Notifications.scheduleNotificationAsync({
      content: { title, sound: false },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: 'habits',
      },
    }).catch(() => {});
  }
}

export async function syncNotifications(habits) {
  configure();
  const list = habits || (await getHabits());
  const hasReminder = list.some((h) => h.reminder);
  if (hasReminder) {
    const ok = await ensurePermission();
    if (!ok) return;
  }
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
  for (const habit of list) {
    await scheduleForHabit(habit);
  }
}

export async function cancelAll() {
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
}
