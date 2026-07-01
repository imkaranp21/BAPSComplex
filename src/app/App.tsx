import { useState } from 'react';
import { Toaster } from 'sonner';
import { SplashScreen } from './components/SplashScreen';
import { HomeScreen } from './components/HomeScreen';
import { AllSpacesScreen } from './components/AllSpacesScreen';
import { SpaceDetailScreen } from './components/SpaceDetailScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { BookingsScreen } from './components/BookingsScreen';
import { AuthScreen } from './components/AuthScreen';
import { ResetPasswordScreen } from './components/ResetPasswordScreen';
import { BookingModal } from './components/BookingModal';
import { ActivityFilterModal } from './components/ActivityFilterModal';
import { BottomNav, type NavTab } from './components/BottomNav';
import { TopNav } from './components/TopNav';
import { useAuth } from '../lib/AuthContext';

export type Screen = 'splash' | 'home' | 'all-spaces' | 'space-detail' | 'profile' | 'bookings' | 'auth';
export type SpaceType = 'gym' | 'cricket-futsal' | 'volleyball' | 'table-tennis' | 'pool-table' | 'darts';

export default function App() {
  const { user, profile, loading, isRecovery, clearRecovery } = useAuth();

  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [selectedSpace, setSelectedSpace] = useState<SpaceType | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [activeNavTab, setActiveNavTab] = useState<NavTab>('home');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showPendingNotice, setShowPendingNotice] = useState(false);
  const [authReturnScreen, setAuthReturnScreen] = useState<Screen>('home');

  // Don't render until auth state is resolved
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Password reset link was clicked — show the set-new-password form
  if (isRecovery) {
    return <ResetPasswordScreen onDone={clearRecovery} />;
  }

  const handleGetStarted = () => {
    setCurrentScreen('home');
    setActiveNavTab('home');
  };

  const handleSpaceClick = (space: SpaceType) => {
    setSelectedSpace(space);
    setCurrentScreen('space-detail');
    setActiveNavTab('spaces');
  };

  const handleBookClick = () => {
    if (!user) {
      setAuthReturnScreen('space-detail');
      setCurrentScreen('auth');
    } else if (profile?.membership_status !== 'active') {
      setShowPendingNotice(true);
    } else {
      setShowBookingModal(true);
    }
  };

  const handleBack = () => {
    if (currentScreen === 'space-detail') {
      setCurrentScreen('all-spaces');
      setActiveNavTab('spaces');
    } else if (currentScreen === 'all-spaces') {
      setCurrentScreen('home');
      setActiveNavTab('home');
      setActiveFilter(null);
    } else if (currentScreen === 'auth') {
      setCurrentScreen(authReturnScreen);
    } else {
      setCurrentScreen('home');
      setActiveNavTab('home');
    }
  };

  const handleNavChange = (tab: NavTab) => {
    setActiveNavTab(tab);
    if (tab === 'home') {
      setCurrentScreen('home');
      setSelectedSpace(null);
      setActiveFilter(null);
    } else if (tab === 'spaces') {
      setCurrentScreen('all-spaces');
    } else if (tab === 'bookings') {
      if (!user) {
        setAuthReturnScreen('bookings');
        setCurrentScreen('auth');
      } else {
        setCurrentScreen('bookings');
      }
    } else if (tab === 'profile') {
      setCurrentScreen('profile');
    }
  };

  const handleFilterApply = (activity: string) => {
    setActiveFilter(activity);
    setShowFilterModal(false);
    if (activity) setCurrentScreen('all-spaces');
  };

  const handleAuthSuccess = () => {
    if (authReturnScreen === 'space-detail' && selectedSpace) {
      setCurrentScreen('space-detail');
      setActiveNavTab('spaces');
    } else if (authReturnScreen === 'bookings') {
      setCurrentScreen('bookings');
      setActiveNavTab('bookings');
    } else {
      setCurrentScreen('home');
      setActiveNavTab('home');
    }
  };

  const showNav = currentScreen !== 'splash' && currentScreen !== 'auth';

  return (
    <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
      <Toaster position="top-center" theme="light" richColors />

      {showNav && (
        <TopNav activeTab={activeNavTab} onTabChange={handleNavChange} />
      )}

      <main className={`flex-1 overflow-y-auto ${showNav ? 'pb-20 md:pb-0' : ''}`}>
        {currentScreen === 'splash' && (
          <SplashScreen onGetStarted={handleGetStarted} />
        )}

        {currentScreen === 'auth' && (
          <AuthScreen
            onSuccess={handleAuthSuccess}
            onBack={handleBack}
            defaultMode="login"
          />
        )}

        {currentScreen !== 'splash' && currentScreen !== 'auth' && (
          <div className="max-w-3xl mx-auto w-full px-4 md:px-8 py-6">
            {currentScreen === 'home' && (
              <HomeScreen
                onSpaceClick={handleSpaceClick}
                onViewAllSpaces={() => { setCurrentScreen('all-spaces'); setActiveNavTab('spaces'); }}
                onFilterClick={() => setShowFilterModal(true)}
                activeFilter={activeFilter}
                onClearFilter={() => setActiveFilter(null)}
              />
            )}
            {currentScreen === 'all-spaces' && (
              <AllSpacesScreen
                onBack={handleBack}
                onSpaceClick={handleSpaceClick}
                onFilterClick={() => setShowFilterModal(true)}
                activeFilter={activeFilter}
                onClearFilter={() => setActiveFilter(null)}
              />
            )}
            {currentScreen === 'space-detail' && selectedSpace && (
              <SpaceDetailScreen
                space={selectedSpace}
                onBack={handleBack}
                onBookClick={handleBookClick}
              />
            )}
            {currentScreen === 'bookings' && (
              <BookingsScreen
                onSignIn={() => {
                  setAuthReturnScreen('bookings');
                  setCurrentScreen('auth');
                }}
              />
            )}
            {currentScreen === 'profile' && (
              <ProfileScreen
                onSignIn={() => {
                  setAuthReturnScreen('profile');
                  setCurrentScreen('auth');
                }}
              />
            )}
          </div>
        )}
      </main>

      {showNav && (
        <BottomNav activeTab={activeNavTab} onTabChange={handleNavChange} />
      )}

      {showFilterModal && (
        <ActivityFilterModal
          onClose={() => setShowFilterModal(false)}
          onApply={handleFilterApply}
          currentFilter={activeFilter}
        />
      )}

      {showPendingNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowPendingNotice(false)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-amber-600 text-xl font-bold">!</span>
            </div>
            <h2 className="text-lg font-bold text-stone-900 mb-2">Membership Pending</h2>
            <p className="text-stone-500 text-sm mb-5">
              Your account is awaiting approval from an admin. Once your membership is activated, you'll be able to book spaces.
            </p>
            <button
              onClick={() => setShowPendingNotice(false)}
              className="w-full bg-orange-600 text-white font-semibold py-3 rounded-xl hover:bg-orange-700 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {showBookingModal && selectedSpace && (
        <BookingModal
          space={selectedSpace}
          onClose={() => setShowBookingModal(false)}
          onBooked={() => {
            setShowBookingModal(false);
            setCurrentScreen('bookings');
            setActiveNavTab('bookings');
          }}
        />
      )}
    </div>
  );
}
