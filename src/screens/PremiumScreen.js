import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { useI18n } from '../i18n';
import { useProfile } from '../storage/profile';
import {
  isPaymentConfigured,
  openCheckout,
} from '../services/purchases';

const POLL_INTERVAL_MS = 4000;
const POLL_TIMEOUT_MS = 120000;

export default function PremiumScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const { setPremium, refreshPremium, userId } = useProfile();

  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const pollRef = useRef(null);
  const pollDeadlineRef = useRef(0);

  const features = [
    { icon: '∞', text: t.premium.feature1 },
    { icon: '✨', text: t.premium.feature2 },
    { icon: '☁️', text: t.premium.feature3 },
    { icon: '⚡', text: t.premium.feature4 },
  ];

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setWaiting(false);
  };

  const pollOnce = async () => {
    const ok = await refreshPremium();
    if (ok) {
      stopPolling();
      navigation.goBack();
      return true;
    }
    if (Date.now() > pollDeadlineRef.current) {
      stopPolling();
    }
    return false;
  };

  const startPolling = () => {
    stopPolling();
    setWaiting(true);
    pollDeadlineRef.current = Date.now() + POLL_TIMEOUT_MS;
    pollRef.current = setInterval(pollOnce, POLL_INTERVAL_MS);
  };

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && waiting) {
        pollOnce();
      }
    });
    return () => {
      sub.remove();
      stopPolling();
    };
  }, [waiting]);

  const handleSubscribe = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (isPaymentConfigured()) {
        if (!userId) {
          Alert.alert(t.premium.errorTitle, t.premium.errorBody);
          return;
        }
        await openCheckout(userId);
        startPolling();
      } else {
        // Stub mode while payment URL is not configured yet — just toggle.
        await setPremium(true);
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert(t.premium.errorTitle, err?.message || t.premium.errorBody);
    } finally {
      setBusy(false);
    }
  };

  const handleManualCheck = async () => {
    const ok = await pollOnce();
    if (!ok) {
      Alert.alert(t.premium.notReadyTitle, t.premium.notReadyBody);
    }
  };

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

        {waiting ? (
          <View
            style={[
              styles.waiting,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <ActivityIndicator color={theme.accent} />
            <Text style={[styles.waitingText, { color: theme.textMuted }]}>
              {t.premium.waitingPayment}
            </Text>
            <Pressable onPress={handleManualCheck} hitSlop={8}>
              <Text style={[styles.waitingLink, { color: theme.accent }]}>
                {t.premium.checkStatus}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
        <Pressable
          onPress={handleSubscribe}
          disabled={busy}
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: theme.accent,
              opacity: pressed || busy ? 0.85 : 1,
              shadowColor: theme.accent,
            },
          ]}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>{t.premium.openCheckout}</Text>
          )}
        </Pressable>
        <Pressable onPress={handleManualCheck} style={styles.later} hitSlop={8}>
          <Text style={[styles.laterText, { color: theme.textMuted }]}>
            {t.premium.restore}
          </Text>
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
  waiting: {
    width: '100%',
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  waitingText: { marginTop: 8, fontSize: 13, textAlign: 'center' },
  waitingLink: { marginTop: 10, fontSize: 13, fontWeight: '700' },
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
