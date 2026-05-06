import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { habitColors, habitIcons, useTheme } from '../theme';
import { useI18n } from '../i18n';
import { MAX_CUSTOM, useProfile } from '../storage/profile';
import { addHabit, deleteHabit, getHabits, updateHabit } from '../storage/habits';
import { syncNotifications } from '../services/notifications';

const FREE_LIMIT = 3;

function timeToDate(t) {
  const [h, m] = (t || '09:00').split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function dateToTime(d) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function AddHabitScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const { premium, customIcons, addCustomIcon, removeCustomIcon } = useProfile();

  const editing = route?.params?.habit;
  const isEdit = !!editing;
  const initialIcon = editing?.icon || habitIcons[0];

  const [name, setName] = useState(editing?.name || '');
  const [icon, setIcon] = useState(initialIcon);
  const [color, setColor] = useState(editing?.color || habitColors[0]);
  const [reminder, setReminder] = useState(editing?.reminder ?? null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [freqType, setFreqType] = useState(editing?.frequency?.type || 'daily');
  const [weekdays, setWeekdays] = useState(
    editing?.frequency?.type === 'weekly'
      ? editing.frequency.days || []
      : [0, 1, 2, 3, 4, 5, 6]
  );
  const [saving, setSaving] = useState(false);
  const [draftEmoji, setDraftEmoji] = useState('');
  const [inputOpen, setInputOpen] = useState(false);

  const handleAddCustom = async () => {
    const v = draftEmoji.trim();
    if (!v) {
      setInputOpen(false);
      return;
    }
    const ok = await addCustomIcon(v);
    if (ok) setIcon(v);
    setDraftEmoji('');
    setInputOpen(false);
  };

  const handleRemoveCustom = (emoji) => {
    Alert.alert(t.add.removeIconTitle, t.add.removeIconText, [
      { text: t.add.cancel, style: 'cancel' },
      {
        text: t.add.remove,
        style: 'destructive',
        onPress: async () => {
          await removeCustomIcon(emoji);
          if (icon === emoji) setIcon(habitIcons[0]);
        },
      },
    ]);
  };

  const handlePlusPress = () => {
    if (!premium) {
      navigation.navigate('Premium');
      return;
    }
    if (customIcons.length >= MAX_CUSTOM) return;
    setInputOpen(true);
  };

  const toggleDay = (i) => {
    setWeekdays((prev) =>
      prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i].sort()
    );
  };

  const canSave = name.trim().length > 0 && (freqType === 'daily' || weekdays.length > 0);

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    const patch = {
      name: name.trim(),
      icon,
      color,
      reminder,
      frequency:
        freqType === 'daily'
          ? { type: 'daily' }
          : { type: 'weekly', days: weekdays },
    };
    let next;
    if (isEdit) {
      next = await updateHabit(editing.id, patch);
    } else {
      const existing = await getHabits();
      if (!premium && existing.length >= FREE_LIMIT) {
        setSaving(false);
        navigation.replace('Premium');
        return;
      }
      const habit = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ...patch,
        createdAt: Date.now(),
      };
      next = await addHabit(habit);
    }
    await syncNotifications(next).catch(() => {});
    setSaving(false);
    navigation.goBack();
  };

  const handleDelete = () => {
    if (!isEdit) return;
    Alert.alert(t.add.confirmDeleteTitle, t.add.confirmDeleteText, [
      { text: t.add.cancel, style: 'cancel' },
      {
        text: t.add.delete,
        style: 'destructive',
        onPress: async () => {
          const next = await deleteHabit(editing.id);
          await syncNotifications(next).catch(() => {});
          navigation.goBack();
        },
      },
    ]);
  };

  const handleTimeChange = (event, date) => {
    if (Platform.OS !== 'ios') setPickerOpen(false);
    if (event?.type === 'dismissed') return;
    if (date) setReminder(dateToTime(date));
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
            <Text style={[styles.headerBtn, { color: theme.textMuted }]}>{t.add.cancel}</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {isEdit ? t.add.editTitle : t.add.title}
          </Text>
          <Pressable onPress={handleSave} disabled={!canSave} hitSlop={10}>
            <Text
              style={[
                styles.headerBtn,
                styles.headerBtnSave,
                { color: canSave ? theme.accent : theme.textDim },
              ]}
            >
              {t.add.save}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Preview theme={theme} icon={icon} color={color} name={name || t.add.namePlaceholder} />

          <Section label={t.add.name} theme={theme}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t.add.namePlaceholder}
              placeholderTextColor={theme.textDim}
              maxLength={40}
              style={[
                styles.input,
                { color: theme.text, backgroundColor: theme.card, borderColor: theme.border },
              ]}
            />
          </Section>

          <Section label={t.add.icon} theme={theme}>
            <View style={styles.iconGrid}>
              {habitIcons.map((i) => {
                const active = i === icon;
                return (
                  <Pressable
                    key={i}
                    onPress={() => setIcon(i)}
                    style={[
                      styles.iconCell,
                      {
                        backgroundColor: active ? color + '33' : theme.card,
                        borderColor: active ? color : theme.border,
                      },
                    ]}
                  >
                    <Text style={styles.iconCellText}>{i}</Text>
                  </Pressable>
                );
              })}
              {customIcons.map((i) => {
                const active = i === icon;
                return (
                  <Pressable
                    key={`c:${i}`}
                    onPress={() => setIcon(i)}
                    onLongPress={() => handleRemoveCustom(i)}
                    delayLongPress={350}
                    style={[
                      styles.iconCell,
                      {
                        backgroundColor: active ? color + '33' : theme.card,
                        borderColor: active ? color : theme.accent,
                      },
                    ]}
                  >
                    <Text style={styles.iconCellText}>{i}</Text>
                  </Pressable>
                );
              })}
              {(!premium || customIcons.length < MAX_CUSTOM) && (
                <Pressable
                  onPress={handlePlusPress}
                  style={[
                    styles.iconCell,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                      borderStyle: 'dashed',
                    },
                  ]}
                >
                  <Text style={styles.iconCellLock}>{premium ? '+' : '👑'}</Text>
                </Pressable>
              )}
            </View>
            {inputOpen && premium ? (
              <View style={styles.customRow}>
                <TextInput
                  value={draftEmoji}
                  onChangeText={setDraftEmoji}
                  placeholder={t.add.customIconHint}
                  placeholderTextColor={theme.textDim}
                  maxLength={4}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleAddCustom}
                  style={[
                    styles.input,
                    styles.customIconInput,
                    {
                      color: theme.text,
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                      flex: 1,
                    },
                  ]}
                />
                <Pressable
                  onPress={handleAddCustom}
                  style={({ pressed }) => [
                    styles.customAddBtn,
                    { backgroundColor: color, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Text style={styles.customAddBtnText}>{t.add.customIconAdd}</Text>
                </Pressable>
              </View>
            ) : null}
            {premium && customIcons.length >= MAX_CUSTOM ? (
              <Text style={[styles.helper, { color: theme.textDim }]}>
                {t.add.customIconLimit}
              </Text>
            ) : null}
          </Section>

          <Section label={t.add.color} theme={theme}>
            <View style={styles.colorRow}>
              {habitColors.map((c) => {
                const active = c === color;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setColor(c)}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c, borderColor: active ? theme.text : 'transparent' },
                    ]}
                  >
                    {active ? <Text style={styles.colorCheck}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          </Section>

          <Section label={t.add.reminder} theme={theme}>
            <View style={styles.chipsRow}>
              <Chip
                label={t.add.reminderOff}
                active={reminder === null}
                onPress={() => setReminder(null)}
                theme={theme}
                color={color}
              />
              <Chip
                label={reminder ? `🕘 ${reminder}` : t.add.pickTime}
                active={reminder !== null}
                onPress={() => setPickerOpen(true)}
                theme={theme}
                color={color}
              />
            </View>
            {pickerOpen ? (
              <DateTimePicker
                value={timeToDate(reminder)}
                mode="time"
                is24Hour
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
                themeVariant={theme.name}
              />
            ) : null}
            {Platform.OS === 'ios' && pickerOpen ? (
              <Pressable
                onPress={() => setPickerOpen(false)}
                style={({ pressed }) => [
                  styles.pickerDone,
                  { backgroundColor: color, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={styles.pickerDoneText}>{t.add.done}</Text>
              </Pressable>
            ) : null}
          </Section>

          <Section label={t.add.frequency} theme={theme}>
            <View style={styles.segment}>
              <SegmentBtn
                label={t.add.everyDay}
                active={freqType === 'daily'}
                onPress={() => setFreqType('daily')}
                theme={theme}
                color={color}
              />
              <SegmentBtn
                label={t.add.byDays}
                active={freqType === 'weekly'}
                onPress={() => setFreqType('weekly')}
                theme={theme}
                color={color}
              />
            </View>
            {freqType === 'weekly' ? (
              <View style={styles.weekRow}>
                {t.days.short.map((d, i) => {
                  const active = weekdays.includes(i);
                  return (
                    <Pressable
                      key={i}
                      onPress={() => toggleDay(i)}
                      style={[
                        styles.weekBtn,
                        {
                          backgroundColor: active ? color : theme.card,
                          borderColor: active ? color : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.weekBtnText,
                          { color: active ? '#fff' : theme.textMuted },
                        ]}
                      >
                        {d}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </Section>

          {isEdit ? (
            <Pressable
              onPress={handleDelete}
              style={({ pressed }) => [
                styles.deleteBtn,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.danger,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text style={[styles.deleteBtnText, { color: theme.danger }]}>
                {t.add.delete}
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Preview({ theme, icon, color, name }) {
  return (
    <View
      style={[
        styles.preview,
        { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow },
      ]}
    >
      <View style={[styles.previewIcon, { backgroundColor: color + '2E' }]}>
        <Text style={{ fontSize: 28 }}>{icon}</Text>
      </View>
      <Text style={[styles.previewName, { color: theme.text }]} numberOfLines={1}>
        {name}
      </Text>
      <View style={[styles.previewDot, { backgroundColor: color }]} />
    </View>
  );
}

function Section({ label, theme, children }) {
  return (
    <View style={{ marginTop: 22 }}>
      <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{label}</Text>
      {children}
    </View>
  );
}

function Chip({ label, active, onPress, theme, color }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? color : theme.card,
          borderColor: active ? color : theme.border,
        },
      ]}
    >
      <Text style={[styles.chipText, { color: active ? '#fff' : theme.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

function SegmentBtn({ label, active, onPress, theme, color }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.segmentBtn,
        {
          backgroundColor: active ? color : 'transparent',
        },
      ]}
    >
      <Text
        style={[
          styles.segmentText,
          { color: active ? '#fff' : theme.textMuted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  headerBtn: { fontSize: 15, fontWeight: '500' },
  headerBtnSave: { fontWeight: '700' },
  content: { paddingHorizontal: 18, paddingBottom: 32 },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 3,
  },
  previewIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  previewName: { flex: 1, fontSize: 17, fontWeight: '600' },
  previewDot: { width: 14, height: 14, borderRadius: 7 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  input: {
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  iconCell: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    borderWidth: 1.5,
  },
  iconCellText: { fontSize: 22 },
  iconCellLock: { fontSize: 20, fontWeight: '300' },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  customIconInput: {
    textAlign: 'center',
  },
  customAddBtn: {
    marginLeft: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  customAddBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  helper: {
    fontSize: 12,
    marginTop: 8,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    margin: 5,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCheck: { color: '#fff', fontWeight: '700', fontSize: 14 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    margin: 4,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
  segment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(127,127,140,0.12)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  segmentText: { fontSize: 13, fontWeight: '600' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekBtn: {
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  weekBtnText: { fontSize: 12, fontWeight: '700' },
  pickerDone: {
    marginTop: 10,
    alignSelf: 'flex-end',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
  },
  pickerDoneText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  deleteBtn: {
    marginTop: 28,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  deleteBtnText: { fontSize: 14, fontWeight: '700' },
});
