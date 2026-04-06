import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout';
import { useSettingsStore } from './store';
import { useActiveChild } from './hooks/useActiveChild';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { WeekPlannerPage } from './pages/WeekPlannerPage';
import { ActivityLibraryPage } from './pages/ActivityLibraryPage';
import { ActivityDetailPage } from './pages/ActivityDetailPage';
import { WeekendReviewPage } from './pages/WeekendReviewPage';
import { SettingsPage } from './pages/SettingsPage';

function AppRoutes() {
  const hasCompletedOnboarding = useSettingsStore((s) => s.hasCompletedOnboarding);
  const { hasChildren } = useActiveChild();

  if (!hasCompletedOnboarding || !hasChildren) {
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/week" element={<WeekPlannerPage />} />
        <Route path="/activities" element={<ActivityLibraryPage />} />
        <Route path="/activities/:activityId" element={<ActivityDetailPage />} />
        <Route path="/review" element={<WeekendReviewPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
