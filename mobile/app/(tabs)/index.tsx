import { StyleSheet, View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useEffect, useState, useCallback } from 'react';
import { getWeddingDetails, syncUserToDatabase, getServices, getVendorBookings } from '@/utils/api';
import { useRouter } from 'expo-router';
import { Colors, Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function HomeScreen() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [wedding, setWedding] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [daysLeft, setDaysLeft] = useState<{ days: number; hours: number; minutes: number } | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [stats, setStats] = useState<{ services: number; pendingBookings: number; package: string } | null>(null);

  const loadData = async () => {
    if (user) {
      try {
        const dbUser = await syncUserToDatabase(user);
        console.log("DEBUG: dbUser:", JSON.stringify(dbUser));
        const userRole = dbUser?.user?.selectedRole || dbUser?.selectedRole || 'USER';
        console.log("DEBUG: Determined userRole:", userRole);
        setRole(userRole === 'USER' ? 'COUPLE' : userRole);

        if (userRole === 'VENDOR') {
          const [vendorServices, vendorBookings] = await Promise.all([
            getServices(user.id),
            getVendorBookings(user.id)
          ]);
          setStats({
            services: vendorServices.length,
            pendingBookings: vendorBookings.filter((b: any) => b.status === 'PENDING').length,
            package: dbUser?.user?.packageType || dbUser?.packageType || 'NORMAL'
          });
          return;
        } else if (userRole === 'PROTOCOL') {
          router.replace('/(tabs)/protocol');
          return;
        } else if (userRole === 'MANAGER' || userRole === 'ADMIN') {
          router.replace('/(tabs)/management');
          return;
        } else if (userRole === 'ATTENDEE') {
          router.replace('/(tabs)/attendee');
          return;
        }

        const weddingData = await getWeddingDetails(user.id);
        setWedding(weddingData);

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
      }
    }
  };

  useEffect(() => {
    if (isLoaded && !user) {
      router.replace('/sign-in');
    } else if (isLoaded && user) {
      loadData();
    }
  }, [isLoaded, user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [user]);

  if (!isLoaded || !user) return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#fdf6f0', '#fff9f3', '#fef8f1']}
        style={styles.background}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.gold} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {role === 'VENDOR' ? `Vendor Portal` : (wedding ? "My Wedding" : `Hello, ${user.firstName}!`)}
            </Text>
            <Text style={styles.subtitle}>
              {role === 'VENDOR' ? `Manage your business` : (wedding ? "Your special day details" : "Welcome to your wedding dashboard")}
            </Text>
          </View>
          {role === 'COUPLE' && wedding && (
            <View style={styles.headerButtons}>
              <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/wedding-form')}>
                <IconSymbol name="pencil" size={16} color={Colors.light.text} />
                <Text style={styles.headerButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.headerButton, styles.deleteButton]}>
                <IconSymbol name="trash" size={16} color="#ef4444" />
                <Text style={[styles.headerButtonText, { color: '#ef4444' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {role === 'VENDOR' && stats ? (
          <View style={styles.vendorStats}>
            <LinearGradient
              colors={[Colors.light.gold, '#b8962e']}
              style={styles.packageCard}
            >
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
        ) : (
          wedding ? (
            <View style={styles.card}>
              <Text style={styles.weddingTitle}>
                {user.firstName} & {wedding.partnersName || "Partner"}
              </Text>

              {daysLeft !== null && (
                <View style={styles.countdownWrapper}>
                  <LinearGradient
                    colors={[Colors.light.gold, '#b8962e']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.countdownGradient}
                  >
                    <Text style={styles.countdownTitle}>Countdown to Your Big Day</Text>
                    <View style={styles.countdownGrid}>
                      <View style={styles.countdownBox}>
                        <Text style={styles.countdownNum}>{daysLeft.days}</Text>
                        <Text style={styles.countdownUnit}>Days</Text>
                      </View>
                      <View style={styles.countdownBox}>
                        <Text style={styles.countdownNum}>{daysLeft.hours}</Text>
                        <Text style={styles.countdownUnit}>Hours</Text>
                      </View>
                      <View style={styles.countdownBox}>
                        <Text style={styles.countdownNum}>{daysLeft.minutes}</Text>
                        <Text style={styles.countdownUnit}>Minutes</Text>
                      </View>
                      <View style={styles.countdownBox}>
                        <Text style={styles.countdownNum}>0</Text>
                        <Text style={styles.countdownUnit}>Seconds</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              )}

              <Text style={styles.dateLabel}>Wedding is on</Text>
              <Text style={styles.date}>
                {wedding.weddingDate ? new Date(wedding.weddingDate).toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : "Date not set"}
              </Text>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.infoText}>No wedding details found.</Text>
              <Text style={styles.infoText}>Please set up your wedding on the website first.</Text>
            </View>
          )
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {role === 'VENDOR' ? (
              <>
                <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(tabs)/vendor')}>
                  <LinearGradient
                    colors={['#fdf6f0', '#fff']}
                    style={styles.actionIconGradient}
                  >
                    <IconSymbol name="briefcase.fill" size={24} color={Colors.light.gold} />
                  </LinearGradient>
                  <Text style={styles.actionText}>My Services</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(tabs)/bookings')}>
                  <LinearGradient
                    colors={['#fdf6f0', '#fff']}
                    style={styles.actionIconGradient}
                  >
                    <IconSymbol name="calendar.badge.clock" size={24} color={Colors.light.gold} />
                  </LinearGradient>
                  <Text style={styles.actionText}>Bookings</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/vendor/packages')}>
                  <LinearGradient
                    colors={['#fdf6f0', '#fff']}
                    style={styles.actionIconGradient}
                  >
                    <IconSymbol name="star.fill" size={24} color={Colors.light.gold} />
                  </LinearGradient>
                  <Text style={styles.actionText}>Packages</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(tabs)/profile')}>
                  <LinearGradient
                    colors={['#fdf6f0', '#fff']}
                    style={styles.actionIconGradient}
                  >
                    <IconSymbol name="person.circle.fill" size={24} color={Colors.light.gold} />
                  </LinearGradient>
                  <Text style={styles.actionText}>Profile</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/wedding-form')}>
                  <LinearGradient
                    colors={['#fdf6f0', '#fff']}
                    style={styles.actionIconGradient}
                  >
                    <IconSymbol name="pencil" size={24} color={Colors.light.gold} />
                  </LinearGradient>
                  <Text style={styles.actionText}>Edit Wedding</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/wedding-card')}>
                  <LinearGradient
                    colors={['#fdf6f0', '#fff']}
                    style={styles.actionIconGradient}
                  >
                    <IconSymbol name="envelope" size={24} color={Colors.light.gold} />
                  </LinearGradient>
                  <Text style={styles.actionText}>Digital Card</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/gallery')}>
                  <LinearGradient
                    colors={['#fdf6f0', '#fff']}
                    style={styles.actionIconGradient}
                  >
                    <IconSymbol name="photo" size={24} color={Colors.light.gold} />
                  </LinearGradient>
                  <Text style={styles.actionText}>Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(tabs)/guests')}>
                  <LinearGradient
                    colors={['#fdf6f0', '#fff']}
                    style={styles.actionIconGradient}
                  >
                    <IconSymbol name="person.2.fill" size={24} color={Colors.light.gold} />
                  </LinearGradient>
                  <Text style={styles.actionText}>Guests</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/meeting-request')}>
                  <LinearGradient
                    colors={['#fdf6f0', '#fff']}
                    style={styles.actionIconGradient}
                  >
                    <IconSymbol name="calendar.badge.plus" size={24} color={Colors.light.gold} />
                  </LinearGradient>
                  <Text style={styles.actionText}>Request Meeting</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  deleteButton: {
    backgroundColor: '#fff1f2',
    borderColor: '#fee2e2',
  },
  headerButtonText: {
    fontFamily: Fonts.Cormorant.Regular,
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '600',
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
  card: {
    margin: 20,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: Colors.light.gold,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
  },
  weddingTitle: {
    fontFamily: Fonts.Playfair.Bold,
    fontSize: 28,
    color: Colors.light.gold,
    marginBottom: 20,
    textAlign: 'center',
  },
  countdownWrapper: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginVertical: 10,
  },
  countdownGradient: {
    padding: 20,
    alignItems: 'center',
  },
  countdownTitle: {
    fontFamily: Fonts.Playfair.Bold,
    fontSize: 20,
    color: '#fff',
    marginBottom: 20,
  },
  countdownGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
  },
  countdownBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  countdownNum: {
    fontFamily: Fonts.Playfair.Bold,
    fontSize: 24,
    color: '#fff',
  },
  countdownUnit: {
    fontFamily: Fonts.Cormorant.Regular,
    fontSize: 10,
    color: '#fff',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  dateLabel: {
    fontFamily: Fonts.Cormorant.Regular,
    fontStyle: 'italic',
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginTop: 20,
  },
  date: {
    fontFamily: Fonts.Cormorant.Regular,
    fontSize: 18,
    color: Colors.light.textSecondary,
    marginTop: 8,
  },
  infoText: {
    fontFamily: Fonts.Cormorant.Regular,
    fontSize: 18,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
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
    padding: 20,
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
});
