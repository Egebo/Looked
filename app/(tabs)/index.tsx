import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={[styles.logo, { color: theme.colors.primary }]}>
            Looked
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
            {t('home.subtitle')}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={[styles.avatarBtn, { backgroundColor: theme.colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 4 }]}>
          <MaterialCommunityIcons name="account-outline" size={22} color={theme.colors.onSurface} />
        </TouchableOpacity>
      </View>

      {/* Hero Header */}
      <TouchableOpacity activeOpacity={0.92} onPress={() => router.push('/(tabs)/camera')} style={styles.heroWrapper}>
        <View style={[styles.heroCard, { backgroundColor: theme.colors.primary }]}>
          <View style={[styles.heroBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Text style={[styles.badgeText, { color: theme.colors.onPrimary }]}>{t('home.hero_badge')}</Text>
          </View>
          <Text style={[styles.heroTitle, { color: theme.colors.onPrimary }]}>
            {t('home.hero_title')}
          </Text>
          <Text style={[styles.heroDesc, { color: theme.colors.onPrimary, opacity: 0.85 }]}>
            {t('home.hero_desc')}
          </Text>
          <View style={[styles.heroBtn, { backgroundColor: theme.colors.onPrimary }]}>
            <Text style={[styles.heroBtnText, { color: theme.colors.primary }]}>{t('home.hero_btn')}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Quick Actions */}
      <Text variant="titleMedium" style={[styles.sectionLabel, { color: theme.colors.onBackground }]}>
        {t('home.actions')}
      </Text>
      <View style={styles.actionGrid}>
        <ActionCard
          icon="camera-plus-outline"
          label={t('home.save_outfit')}
          onPress={() => router.push('/scan-outfit')}
          theme={theme}
        />
        <ActionCard
          icon="hanger"
          label={t('home.wardrobe')}
          onPress={() => router.push('/(tabs)/wardrobe')}
          theme={theme}
        />
      </View>

      {/* Activity Cards */}
      <Text variant="titleMedium" style={[styles.sectionLabel, { color: theme.colors.onBackground }]}>
        {t('home.activities')}
      </Text>
      <ActivityCard
        title={t('home.past_reviews')}
        subtitle={t('home.past_reviews_sub')}
        icon="image-filter-hdr"
        onPress={() => router.push('/history/analysis')}
        theme={theme}
      />
      <ActivityCard
        title={t('home.saved_combinations')}
        subtitle={t('home.saved_combinations_sub')}
        icon="layers-outline"
        onPress={() => router.push('/history/combinations')}
        theme={theme}
      />
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

function ActionCard({ icon, label, onPress, theme }: any) {
  return (
    <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4 }]} onPress={onPress} activeOpacity={0.88}>
      <View style={[styles.actionIconBg, { backgroundColor: theme.colors.primaryContainer }]}>
        <MaterialCommunityIcons name={icon} size={28} color={theme.colors.primary} />
      </View>
      <Text style={{ fontWeight: '700', fontSize: 14, color: theme.colors.onSurface, textAlign: 'center' }}>{label}</Text>
    </TouchableOpacity>
  );
}

function ActivityCard({ title, subtitle, icon, onPress, theme }: any) {
  return (
    <TouchableOpacity
      style={[styles.activityCard, { backgroundColor: theme.colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 }]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={[styles.activityIcon, { backgroundColor: theme.colors.primaryContainer }]}>
        <MaterialCommunityIcons name={icon} size={22} color={theme.colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.activityTitle, { color: theme.colors.onSurface }]}>{title}</Text>
        <Text style={[styles.activitySub, { color: theme.colors.onSurfaceVariant }]}>{subtitle}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 12 },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 8,
  },
  logo: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  avatarBtn: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  heroWrapper: { marginBottom: 36 },
  heroCard: {
    borderRadius: 32,
    padding: 28,
    overflow: 'hidden',
    minHeight: 200,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 4,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  heroTitle: { fontSize: 32, fontWeight: '900', marginBottom: 10, letterSpacing: -0.5 },
  heroDesc: { fontSize: 15, lineHeight: 22, marginBottom: 24, paddingRight: 20 },
  heroBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 22, paddingVertical: 12,
    borderRadius: 16,
  },
  heroBtnText: { fontWeight: '800', fontSize: 14 },
  sectionLabel: {
    fontWeight: '800',
    marginBottom: 16, marginTop: 12,
  },
  actionGrid: { flexDirection: 'row', gap: 16, marginBottom: 36 },
  actionCard: {
    flex: 1, borderRadius: 28, padding: 24,
    alignItems: 'center', justifyContent: 'center', gap: 16, minHeight: 140,
  },
  actionIconBg: {
    width: 56, height: 56, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  activityCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    padding: 16, borderRadius: 24, marginBottom: 14,
  },
  activityIcon: {
    width: 48, height: 48, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  activityTitle: { fontWeight: '800', fontSize: 15, marginBottom: 4 },
  activitySub: { fontSize: 13, opacity: 0.8 },
});
