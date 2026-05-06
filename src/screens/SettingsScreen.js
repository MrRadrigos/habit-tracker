import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { useI18n } from '../i18n';
import { useProfile } from '../storage/profile';

export default function SettingsScreen({ navigation }) {
  const { theme, mode, setMode } = useTheme();
  const { t, lang, setLang } = useI18n();
  const { name, setName, premium } = useProfile();
  const [draftName, setDraftName] = useState(name);

  const onBlurName = () => {
    if (draftName !== name) setName(draftName);
  };

  const version = Constants?.expoConfig?.version || '1.0.0';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.text }]}>{t.settings.title}</Text>

        <SectionLabel theme={theme}>{t.settings.profile}</SectionLabel>
        <View style={[styles.card, cardStyle(theme)]}>
          <Row label={t.settings.name} theme={theme}>
            <TextInput
              value={draftName}
              onChangeText={setDraftName}
              onBlur={onBlurName}
              placeholder={t.settings.namePlaceholder}
              placeholderTextColor={theme.textDim}
              style={[styles.input, { color: theme.text }]}
              maxLength={30}
              returnKeyType="done"
              onSubmitEditing={onBlurName}
            />
          </Row>
        </View>

        <SectionLabel theme={theme}>{t.settings.appearance}</SectionLabel>
        <View style={[styles.card, cardStyle(theme)]}>
          <SegmentRow
            label={t.settings.theme}
            theme={theme}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'system', label: t.settings.themeSystem },
              { value: 'dark', label: t.settings.themeDark },
              { value: 'light', label: t.settings.themeLight },
            ]}
          />
          <Divider theme={theme} />
          <SegmentRow
            label={t.settings.language}
            theme={theme}
            value={lang}
            onChange={setLang}
            options={[
              { value: 'ru', label: 'RU' },
              { value: 'en', label: 'EN' },
            ]}
          />
        </View>

        <SectionLabel theme={theme}>{t.settings.subscription}</SectionLabel>
        <Pressable
          onPress={() => navigation.navigate('Premium')}
          style={({ pressed }) => [
            styles.card,
            cardStyle(theme),
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <View style={styles.subRow}>
            <View style={[styles.subBadge, { backgroundColor: theme.accent + '22' }]}>
              <Text style={{ fontSize: 22 }}>{premium ? '👑' : '⭐'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.subTitle, { color: theme.text }]}>
                {premium ? 'Premium' : t.settings.free}
              </Text>
              <Text style={[styles.subText, { color: theme.textMuted }]}>
                {premium ? '∞' : t.settings.upgrade}
              </Text>
            </View>
            <Text style={[styles.chev, { color: theme.textDim }]}>›</Text>
          </View>
        </Pressable>

        <SectionLabel theme={theme}>{t.settings.about}</SectionLabel>
        <View style={[styles.card, cardStyle(theme)]}>
          <Row label={t.appName} theme={theme}>
            <Text style={[styles.value, { color: theme.textMuted }]}>v{version}</Text>
          </Row>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ children, theme }) {
  return (
    <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{children}</Text>
  );
}

function Row({ label, theme, children }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
      <View style={styles.rowRight}>{children}</View>
    </View>
  );
}

function Divider({ theme }) {
  return <View style={[styles.divider, { backgroundColor: theme.border }]} />;
}

function SegmentRow({ label, value, options, onChange, theme }) {
  return (
    <View style={styles.segRow}>
      <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
      <View style={[styles.segment, { backgroundColor: theme.cardAlt }]}>
        {options.map((o) => {
          const active = value === o.value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              style={[
                styles.segItem,
                active && { backgroundColor: theme.accent },
              ]}
            >
              <Text
                style={[
                  styles.segText,
                  { color: active ? '#fff' : theme.textMuted },
                ]}
              >
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function cardStyle(theme) {
  return {
    backgroundColor: theme.card,
    borderColor: theme.border,
    shadowColor: theme.shadow,
  };
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 18, paddingBottom: 40 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 22,
    marginBottom: 10,
  },
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    paddingVertical: 10,
  },
  rowLabel: { fontSize: 15, fontWeight: '500', flex: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center' },
  input: {
    fontSize: 15,
    minWidth: 160,
    textAlign: 'right',
    padding: 0,
  },
  value: { fontSize: 14 },
  segRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: 10,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    marginLeft: 10,
  },
  segItem: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
  },
  segText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: -14,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  subBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subTitle: { fontSize: 15, fontWeight: '700' },
  subText: { fontSize: 13, marginTop: 2 },
  chev: { fontSize: 22, fontWeight: '300' },
});
