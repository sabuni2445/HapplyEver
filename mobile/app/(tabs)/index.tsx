import { StyleSheet, View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Image, Dimensions } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useEffect, useState, useCallback, useRef } from 'react';
import { getWeddingDetails, syncUserToDatabase, getServices, getVendorBookings, getUserFromDatabase, getAllServices, getFeaturedServices } from '@/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Colors, Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { IconSymbol } from '@/components/ui/icon-symbol';
import ProtocolDashboard from '@/components/ProtocolDashboard';
import { Video, ResizeMode } from 'expo-av';
import Animated, { FadeInUp, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, interpolate, Extrapolate } from 'react-native-reanimated';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = 450;

export default function HomeScreen() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [wedding, setWedding] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [daysLeft, setDaysLeft] = useState<{ days: number; hours: number; minutes: number } | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [stats, setStats] = useState<{ services: number; pendingBookings: number; package: string } | null>(null);
  const [featuredServices, setFeaturedServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [localUser, setLocalUser] = useState<any>(null);

  const loadData = async () => {
    if (user || localUser) {
      const currentUserId = user?.id || localUser?.clerkId || localUser?.id;
      try {
        let dbUser;
        if (user) {
          dbUser = await syncUserToDatabase(user);
        } else {
          dbUser = localUser;
        }

        const userRole = dbUser?.user?.selectedRole || dbUser?.selectedRole || 'USER';
        setRole(userRole === 'USER' ? 'COUPLE' : userRole);

        if (userRole === 'VENDOR') {
          const [vendorServices, vendorBookings] = await Promise.all([
            getServices(currentUserId),
            getVendorBookings(currentUserId)
          ]);
          setStats({
            services: vendorServices.length,
            pendingBookings: vendorBookings.filter((b: any) => b.status === 'PENDING').length,
            package: dbUser?.user?.packageType || dbUser?.packageType || 'NORMAL'
          });
          setLoading(false);
          return;
        } else if (userRole === 'PROTOCOL') {
          setRole('PROTOCOL');
          setLoading(false);
          return;
        } else if (userRole === 'MANAGER' || userRole === 'ADMIN') {
          router.replace('/management');
          return;
        } else if (userRole === 'ATTENDEE') {
          router.replace('/attendee');
          return;
        }

        const [weddingData, premiumServices] = await Promise.all([
          getWeddingDetails(currentUserId),
          getFeaturedServices()
        ]);
        setWedding(weddingData);
        setFeaturedServices(premiumServices || []);

        if (weddingData?.weddingDate) {
          const today = new Date();
          const weddingDate = new Date(weddingData.weddingDate);
          const diffTime = weddingDate.getTime() - today.getTime();

          if (diffTime > 0) {
            const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
            setDaysLeft({ days, hours, minutes });
          } else {
            setDaysLeft(null);
          }
        }
      } catch (error) {
        console.error("Error loading home data:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      if (isLoaded) {
        if (user) {
          loadData();
        } else {
          const storedUser = await AsyncStorage.getItem('user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setLocalUser(parsedUser);
          } else {
            router.replace('/sign-in');
          }
        }
      }
    };
    checkSession();
  }, [isLoaded, user]);

  useEffect(() => {
    if (localUser) {
      loadData();
    }
  }, [localUser]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [user]);

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const heroStyle = useAnimatedStyle(() => {
    const scale = interpolate(scrollY.value, [-100, 0], [1.2, 1], Extrapolate.CLAMP);
    const translateY = interpolate(scrollY.value, [0, HERO_HEIGHT], [0, -HERO_HEIGHT / 2], Extrapolate.CLAMP);
    return {
      transform: [{ scale }, { translateY }],
    };
  });

  if (!isLoaded || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color={Colors.light.gold} />
      </View>
    );
  }

  const currentUser = user || localUser;
  if (!currentUser) return null;

  if (role === 'PROTOCOL') {
    return <ProtocolDashboard userId={localUser?.id?.toString() || user?.id || ''} />;
  }

  return (
    <View style={styles.container}>
      {role === 'COUPLE' && (
        <Animated.View style={[styles.heroContainer, heroStyle]}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069' }}
            style={styles.heroImage}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroOverlayContent}>
            <View style={styles.heroTopRow}>
              <Text style={styles.heroPreTitle}>ESTABLISHED MMXXV</Text>
              <BlurView intensity={20} tint="light" style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>DASHBOARD</Text>
              </BlurView>
            </View>
            <View style={styles.heroMainContent}>
              <Text style={styles.heroTitle}>The Wedding Journey</Text>
              <Text style={styles.heroSubtitle}>
                {currentUser?.firstName || 'Our'} & {wedding?.partnersName || 'Love'}
              </Text>
              {daysLeft && (
                <View style={styles.editorialCountdown}>
                  <Text style={styles.countdownValue}>{daysLeft.days}</Text>
                  <Text style={styles.countdownLabel}>DAYS UNTIL FOREVER</Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      )}

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.scrollContent, role === 'COUPLE' && { paddingTop: HERO_HEIGHT - 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.gold} />}
      >
        {role === 'COUPLE' ? (
          <View style={styles.editorialBody}>
            <LinearGradient colors={['rgba(255,255,255,0)', '#fff']} style={styles.bodyFade} />

            <View style={styles.editorialSection}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionPreTitle}>CURATED SELECTION</Text>
                  <Text style={styles.sectionTitleLarge}>Premium Partners</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/services')}>
                  <Text style={styles.seeAllText}>VIEW ALL</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.adsScroll}>
                {featuredServices.map((service, index) => (
                  <Animated.View key={service.id} entering={FadeInUp.delay(index * 100)}>
                    <TouchableOpacity
                      style={styles.editorialAdCard}
                      onPress={() => router.push({ pathname: '/explore', params: { category: service.category } })}
                    >
                      <Image source={{ uri: service.imageUrl }} style={styles.adImage} />
                      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={StyleSheet.absoluteFill} />
                      <View style={styles.adContentEditorial}>
                        <Text style={styles.adCategoryEditorial}>{service.category}</Text>
                        <Text style={styles.adNameEditorial}>{service.serviceName}</Text>
                        <View style={styles.adFooterEditorial}>
                          <Text style={styles.adDetailEditorial}>{service.location || 'Addis Ababa'}</Text>
                          <IconSymbol name="arrow.right" size={14} color="#fff" />
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </ScrollView>
            </View>

            <View style={styles.editorialSection}>
              <Text style={styles.sectionPreTitle}>ESSENTIAL TOOLS</Text>
              <Text style={styles.sectionTitleLarge}>Quick Actions</Text>

              <View style={styles.editorialMasonry}>
                <View style={styles.masonryCol}>
                  <TouchableOpacity style={[styles.masonryCard, { height: 220 }]} onPress={() => router.push('/wedding-form')}>
                    <BlurView intensity={10} tint="light" style={styles.masonryGlass}>
                      <IconSymbol name="pencil" size={28} color={Colors.light.gold} />
                      <Text style={styles.masonryTitle}>Edit Journey</Text>
                      <Text style={styles.masonryDesc}>Update wedding details</Text>
                    </BlurView>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.masonryCard, { height: 160 }]} onPress={() => router.push('/gallery')}>
                    <LinearGradient colors={['#F9F9FB', '#FFF']} style={styles.masonrySolid}>
                      <IconSymbol name="photo" size={24} color={Colors.light.text} />
                      <Text style={[styles.masonryTitle, { color: Colors.light.text }]}>Gallery</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                <View style={styles.masonryCol}>
                  <TouchableOpacity style={[styles.masonryCard, { height: 160 }]} onPress={() => router.push('/wedding-card')}>
                    <LinearGradient colors={[Colors.light.gold, '#b8962e']} style={styles.masonryGold}>
                      <IconSymbol name="envelope" size={24} color="#fff" />
                      <Text style={[styles.masonryTitle, { color: '#fff' }]}>Digital Card</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.masonryCard, { height: 220 }]} onPress={() => router.push('/guests')}>
                    <BlurView intensity={60} tint="light" style={styles.masonryGlass}>
                      <IconSymbol name="person.2.fill" size={28} color={Colors.light.gold} />
                      <Text style={styles.masonryTitle}>Guest List</Text>
                      <Text style={styles.masonryDesc}>Manage invitations</Text>
                    </BlurView>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {wedding?.weddingDate && (
              <View style={styles.editorialSection}>
                <BlurView intensity={80} style={styles.calendarCard}>
                  <View style={styles.calendarHeader}>
                    <Text style={styles.calendarMonth}>{new Date(wedding.weddingDate).toLocaleDateString(undefined, { month: 'long' }).toUpperCase()}</Text>
                    <Text style={styles.calendarYear}>{new Date(wedding.weddingDate).getFullYear()}</Text>
                  </View>
                  <View style={styles.calendarBody}>
                    <Text style={styles.calendarDayNum}>{new Date(wedding.weddingDate).getDate()}</Text>
                    <Text style={styles.calendarDayText}>{new Date(wedding.weddingDate).toLocaleDateString(undefined, { weekday: 'long' })}</Text>
                  </View>
                  <View style={styles.calendarFooter}>
                    <IconSymbol name="mappin.and.ellipse" size={14} color={Colors.light.gold} />
                    <Text style={styles.calendarLocation}>{wedding.location || 'Location Pending'}</Text>
                  </View>
                </BlurView>
              </View>
            )}
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>
                  {role === 'VENDOR' ? `Vendor Portal` : `Hello, ${currentUser.firstName || currentUser.username || 'Friend'}`}
                </Text>
                <Text style={styles.subtitle}>
                  {role === 'VENDOR' ? `Manage your business` : "Welcome to your wedding dashboard"}
                </Text>
              </View>
            </View>

            {role === 'VENDOR' && stats && (
              <View style={styles.vendorStats}>
                <LinearGradient colors={[Colors.light.gold, '#b8962e']} style={styles.packageCard}>
                  <View style={styles.packageHeader}>
                    <IconSymbol name="star.fill" size={24} color="#fff" />
                    <Text style={styles.packageTitle}>{stats.package} Plan</Text>
                  </View>
                  <TouchableOpacity style={styles.upgradeBtn} onPress={() => router.push('/vendor/packages')}>
                    <Text style={styles.upgradeBtnText}>Upgrade Plan</Text>
                  </TouchableOpacity>
                </LinearGradient>

                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statNum}>{stats.services}</Text>
                    <Text style={styles.statLabel}>Services</Text>
                  </View>
                  <View style={[styles.statBox, stats.pendingBookings > 0 && styles.activeStatBox]}>
                    <Text style={[styles.statNum, stats.pendingBookings > 0 && { color: '#fff' }]}>{stats.pendingBookings}</Text>
                    <Text style={[styles.statLabel, stats.pendingBookings > 0 && { color: '#fff' }]}>Pending Requests</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionsGrid}>
                {role === 'VENDOR' ? (
                  <>
                    <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(tabs)/vendor')}>
                      <LinearGradient colors={['#fdf6f0', '#fff']} style={styles.actionIconGradient}>
                        <IconSymbol name="briefcase.fill" size={24} color={Colors.light.gold} />
                      </LinearGradient>
                      <Text style={styles.actionText}>My Services</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(tabs)/bookings')}>
                      <LinearGradient colors={['#fdf6f0', '#fff']} style={styles.actionIconGradient}>
                        <IconSymbol name="calendar.badge.clock" size={24} color={Colors.light.gold} />
                      </LinearGradient>
                      <Text style={styles.actionText}>Bookings</Text>
                    </TouchableOpacity>
                  </>
                ) : null}
              </View>
            </View>
          </>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  heroContainer: {
    height: HERO_HEIGHT,
    width: width,
    position: 'absolute',
    top: 0,
    zIndex: 0,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlayContent: {
    ...StyleSheet.absoluteFillObject,
    padding: 30,
    paddingTop: 60,
    justifyContent: 'space-between',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroPreTitle: {
    fontFamily: Fonts.Playfair.Bold,
    fontSize: 10,
    letterSpacing: 4,
    color: 'rgba(255,255,255,0.7)',
  },
  heroBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroBadgeText: {
    fontFamily: Fonts.Playfair.Bold,
    fontSize: 9,
    letterSpacing: 2,
    color: '#fff',
  },
  heroMainContent: {
    marginBottom: 40,
  },
  heroTitle: {
    fontFamily: Fonts.Playfair.Bold,
    fontSize: 42,
    color: '#fff',
    marginBottom: 5,
  },
  heroSubtitle: {
    fontFamily: Fonts.Cormorant.Regular,
    fontSize: 24,
    color: Colors.light.gold,
    fontStyle: 'italic',
    marginBottom: 20,
  },
  editorialCountdown: {
    marginTop: 10,
  },
  countdownValue: {
    fontFamily: Fonts.Playfair.Bold,
    fontSize: 64,
    color: 'rgba(255,255,255,0.15)',
    position: 'absolute',
    top: -40,
    left: -10,
  },
  countdownLabel: {
    fontFamily: Fonts.Playfair.Bold,
    fontSize: 11,
    letterSpacing: 5,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 10,
  },
  editorialBody: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -40,
    paddingTop: 30,
  },
  bodyFade: {
    height: 100,
    width: '100%',
    position: 'absolute',
    top: -100,
  },
  editorialSection: {
    paddingHorizontal: 25,
    marginBottom: 45,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  sectionPreTitle: {
    fontFamily: Fonts.Playfair.Bold,
    fontSize: 10,
    letterSpacing: 3,
    color: Colors.light.gold,
    marginBottom: 8,
  },
  sectionTitleLarge: {
    fontFamily: Fonts.Playfair.Bold,
    fontSize: 28,
    color: Colors.light.text,
  },
  seeAllText: {
    fontFamily: Fonts.Playfair.Bold,
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.light.textSecondary,
    marginBottom: 5,
  },
  adsScroll: {
    paddingRight: 25,
    paddingLeft: 25,
  },
  editorialAdCard: {
    width: 240,
    height: 320,
    marginRight: 20,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#f8f8f8',
  },
  adImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  adContentEditorial: {
    ...StyleSheet.absoluteFillObject,
    padding: 20,
    justifyContent: 'flex-end',
  },
  adCategoryEditorial: {
    fontFamily: Fonts.Playfair.Bold,
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.light.gold,
    marginBottom: 5,
  },
  adNameEditorial: {
    fontFamily: Fonts.Playfair.Bold,
    fontSize: 20,
    color: '#fff',
    marginBottom: 10,
  },
  adFooterEditorial: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  adDetailEditorial: {
    fontFamily: Fonts.Cormorant.Regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  editorialMasonry: {
    flexDirection: 'row',
    gap: 15,
  },
  masonryCol: {
    flex: 1,
    gap: 15,
  },
  masonryCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  masonryGlass: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
  },
  masonrySolid: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-end',
  },
  masonryGold: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-end',
  },
  masonryTitle: {
    fontFamily: Fonts.Playfair.Bold,
    fontSize: 18,
    marginTop: 12,
    color: Colors.light.gold,
  },
  masonryDesc: {
    fontFamily: Fonts.Cormorant.Regular,
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  calendarCard: {
    padding: 30,
    borderRadius: 30,
    backgroundColor: 'rgba(212, 175, 55, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  calendarMonth: {
    fontFamily: Fonts.Playfair.Bold,
    fontSize: 14,
    letterSpacing: 4,
    color: Colors.light.text,
  },
  calendarYear: {
    fontFamily: Fonts.Playfair.Bold,
    fontSize: 14,
    color: Colors.light.gold,
  },
  calendarBody: {
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarDayNum: {
    fontFamily: Fonts.Playfair.Bold,
    fontSize: 72,
    color: Colors.light.text,
    lineHeight: 80,
  },
  calendarDayText: {
    fontFamily: Fonts.Cormorant.Regular,
    fontSize: 18,
    color: Colors.light.gold,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  calendarFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarLocation: {
    fontFamily: Fonts.Cormorant.Regular,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontFamily: Fonts.Playfair.Bold,
    fontSize: 32,
    color: Colors.light.text,
  },
  subtitle: {
    fontFamily: Fonts.Cormorant.Regular,
    fontSize: 18,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontFamily: Fonts.Playfair.Bold,
    fontSize: 24,
    marginBottom: 20,
    color: Colors.light.text,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: Colors.light.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.05)',
  },
  actionIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
  },
  actionText: {
    fontFamily: Fonts.Cormorant.Regular,
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  vendorStats: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  packageCard: {
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: Colors.light.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  packageTitle: {
    fontFamily: Fonts.Playfair.Bold,
    fontSize: 20,
    color: '#fff',
    textTransform: 'capitalize',
  },
  upgradeBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  upgradeBtnText: {
    color: '#fff',
    fontFamily: Fonts.Cormorant.Bold,
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
    shadowColor: Colors.light.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  activeStatBox: {
    backgroundColor: Colors.light.gold,
    borderColor: Colors.light.gold,
  },
  statNum: {
    fontFamily: Fonts.Playfair.Bold,
    fontSize: 32,
    color: Colors.light.gold,
  },
  statLabel: {
    fontFamily: Fonts.Cormorant.Regular,
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  celebrationCard: {
    margin: 20,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: Colors.light.gold,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.light.gold,
  },
  celebrationContent: {
    padding: 32,
    alignItems: 'center',
  },
  congratsIcon: {
    marginBottom: 16,
  },
  congratsTitle: {
    fontFamily: Fonts.Playfair.Bold,
    fontSize: 28,
    color: Colors.light.gold,
    textAlign: 'center',
    marginBottom: 12,
  },
  congratsText: {
    fontFamily: Fonts.Cormorant.Regular,
    fontSize: 18,
    color: Colors.light.text,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 24,
  },
  feedbackBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  feedbackGradient: {
    padding: 16,
    alignItems: 'center',
  },
  feedbackBtnText: {
    color: '#fff',
    fontFamily: Fonts.Cormorant.Bold,
    fontSize: 18,
  },
});
