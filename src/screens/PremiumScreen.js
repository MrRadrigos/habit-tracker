import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { useI18n } from '../i18n';
import { useProfile } from '../storage/profile';

export default function PremiumScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const { setPremium } = useProfile();

  const handleSubscribe = async () => {
    await setPremium(true);
    navigation.goBack();
  };

  const features = [
    { icon: '∞', text: t.premium.feature1 },
    { icon: '✨', text: t.premium.feature2 },
    { icon: '☁️', text: t.premium.feature3 },
    { icon: '⚡', text: t.premium.feature4 },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.closeRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={[styles.close, { color: theme.textMuted }]}>✕</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.crown, { backgroundColor: theme.accent + '22' }]}>
          <Text style={styles.crownIcon}>👑</Text>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>{t.premium.title}</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>{t.premium.subtitle}</Text>

        <View
          style={[
            styles.limitNote,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.limitTitle, { color: theme.warning }]}>
            {t.premium.limitTitle}
          </Text>
          <Text style={[styles.limitText, { color: theme.textMuted }]}>
            {t.premium.limitText}
          </Text>
        </View>

        <View style={styles.features}>
          {features.map((f, i) => (
            <View
              key={i}
              style={[
                styles.feature,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <View style={[styles.featureIcon, { backgroundColor: theme.accent + '22' }]}>
                <Text style={[styles.featureIconText, { color: theme.accent }]}>{f.icon}</Text>
              </View>
              <Text style={[styles.featureText, { color: theme.text }]}>{f.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
        <Pressable
          onPress={handleSubscribe}
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: theme.accent,
              opacity: pressed ? 0.85 : 1,
              shadowColor: theme.accent,
            },
          ]}
        >
          <Text style={styles.ctaText}>{t.premium.cta}</Text>
        </Pressable>
        <Pressable onPress={() => navigation.goBack()} style={styles.later} hitSlop={8}>
          <Text style={[styles.laterText, { color: theme.textMuted }]}>{t.premium.later}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  closeRow: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'flex-end',
  },
  close: { fontSize: 22, fontWeight: '300' },
  content: { paddingHorizontal: 22, alignItems: 'center', paddingBottom: 24 },
  crown: {
    width: 88,
    height: 88,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  crownIcon: { fontSize: 44 },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center', letterSpacing: -0.6 },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 22,
    lineHeight: 21,
  },
  limitNote: {
    width: '100%',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    marginBottom: 22,
  },
  limitTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  limitText: { fontSize: 13, lineHeight: 19 },
  features: { width: '100%' },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureIconText: { fontSize: 18, fontWeight: '700' },
  featureText: { flex: 1, fontSize: 14, fontWeight: '500' },
  footer: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cta: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 5,
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  later: { paddingVertical: 14, alignItems: 'center' },
  laterText: { fontSize: 14, fontWeight: '500' },
});
