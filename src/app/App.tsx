import { useState } from 'react';
import { Toaster } from 'sonner';
import { SplashScreen } from './components/SplashScreen';
import { HomeScreen } from './components/HomeScreen';
import { AllSpacesScreen } from './components/AllSpacesScreen';
import { SpaceDetailScreen } from './components/SpaceDetailScreen';
import { ActivityFilterModal } from './components/ActivityFilterModal';
import { ScheduleScreen } from './components/ScheduleScreen';
import { AlertsScreen } from './components/AlertsScreen';
import { BottomNav } from './components/BottomNav';
import { TopNav } from './components/TopNav';

export type Screen = 'splash' | 'home' | 'all-spaces' | 'space-detail' | 'schedule' | 'alerts';
export type SpaceType = 'pool-tables' | 'table-tennis' | 'squash-courts' | 'multipurpose-courts';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [selectedSpace, setSelectedSpace] = useState<SpaceType | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [activeNavTab, setActiveNavTab] = useState<'home' | 'spaces' | 'schedule' | 'alerts'>('home');

  const handleGetStarted = () => {
    setCurrentScreen('home');
  };

  const handleSpaceClick = (space: SpaceType) => {
    setSelectedSpace(space);
    setCurrentScreen('space-detail');
    setActiveNavTab('spaces');
  };

  const handleBack = () => {
    if (currentScreen === 'space-detail') {
      setCurrentScreen('home');
      setActiveNavTab('home');
      setSelectedSpace(null);
    } else if (currentScreen === 'all-spaces') {
      setCurrentScreen('home');
      setActiveNavTab('home');
      setActiveFilter(null);
    } else if (currentScreen === 'schedule') {
      if (selectedSpace) {
        setCurrentScreen('space-detail');
      } else {
        setCurrentScreen('home');
        setActiveNavTab('home');
      }
    } else if (currentScreen === 'alerts') {
      setCurrentScreen('home');
      setActiveNavTab('home');
    }
  };

  const handleNavChange = (tab: 'home' | 'spaces' | 'schedule' | 'alerts') => {
    if (tab === activeNavTab && currentScreen !== 'space-detail') return;

    setActiveNavTab(tab);
    if (tab === 'home') {
      setCurrentScreen('home');
      setSelectedSpace(null);
      setActiveFilter(null);
    } else if (tab === 'spaces') {
      setCurrentScreen('all-spaces');
    } else if (tab === 'schedule') {
      setCurrentScreen('schedule');
      setSelectedSpace(null);
    } else if (tab === 'alerts') {
      setCurrentScreen('alerts');
    }
  };

  const handleFilterApply = (activity: string) => {
    setActiveFilter(activity);
    setShowFilterModal(false);
    if (activity) {
      setCurrentScreen('all-spaces');
    }
  };

  const showNav = currentScreen !== 'splash';

  return (
    <div className="min-h-screen bg-[#2d2d2d] flex flex-col">
      <Toaster position="top-center" theme="dark" richColors />

      {showNav && (
        <TopNav activeTab={activeNavTab} onTabChange={handleNavChange} />
      )}

      <main className={`flex-1 overflow-y-auto ${showNav ? 'pb-20 md:pb-0' : ''}`}>
        {currentScreen === 'splash' && (
          <SplashScreen onGetStarted={handleGetStarted} />
        )}

        {currentScreen !== 'splash' && (
          <div className="max-w-3xl mx-auto w-full px-4 md:px-8 py-6">
            {currentScreen === 'home' && (
              <HomeScreen
                onSpaceClick={handleSpaceClick}
                onViewAllSpaces={() => setCurrentScreen('all-spaces')}
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
                onScheduleClick={() => setCurrentScreen('schedule')}
                onAlertClick={() => setCurrentScreen('alerts')}
              />
            )}
            {currentScreen === 'schedule' && (
              <ScheduleScreen
                onBack={handleBack}
                space={selectedSpace}
              />
            )}
            {currentScreen === 'alerts' && (
              <AlertsScreen
                onBack={handleBack}
                onSave={() => handleBack()}
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
    </div>
  );
}
