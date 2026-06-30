import { useState } from 'react';
import { Toaster } from 'sonner';
import { SplashScreen } from './components/SplashScreen';
import { HomeScreen } from './components/HomeScreen';
import { AllSpacesScreen } from './components/AllSpacesScreen';
import { SpaceDetailScreen } from './components/SpaceDetailScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { AuthScreen } from './components/AuthScreen';
import { BookingModal } from './components/BookingModal';
import { ActivityFilterModal } from './components/ActivityFilterModal';
import { BottomNav, type NavTab } from './components/BottomNav';
import { TopNav } from './components/TopNav';
import { useAuth } from '../lib/AuthContext';

export type Screen = 'splash' | 'home' | 'all-spaces' | 'space-detail' | 'profile' | 'auth';
export type SpaceType = 'gym' | 'cricket-futsal' | 'volleyball' | 'table-tennis' | 'pool-table' | 'darts';

export default function App() {
  const { user, loading } = useAuth();

  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [selectedSpace, setSelectedSpace] = useState<SpaceType | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [activeNavTab, setActiveNavTab] = useState<NavTab>('home');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [authReturnScreen, setAuthReturnScreen] = useState<Screen>('home');

  // Don't render until auth state is resolved
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
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
        setAuthReturnScreen('home');
        setCurrentScreen('auth');
      } else {
        setCurrentScreen('profile');
        setActiveNavTab('bookings');
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
    setCurrentScreen(authReturnScreen === 'space-detail' && selectedSpace ? 'space-detail' : 'home');
    setActiveNavTab('home');
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

      {showBookingModal && selectedSpace && (
        <BookingModal
          space={selectedSpace}
          onClose={() => setShowBookingModal(false)}
          onBooked={() => {
            setShowBookingModal(false);
            setCurrentScreen('profile');
            setActiveNavTab('bookings');
          }}
        />
      )}
    </div>
  );
}
