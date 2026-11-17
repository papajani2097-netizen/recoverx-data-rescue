import { Navigate, Route, Routes } from 'react-router';
import { SiteLayout } from './components/SiteLayout';
import {
  AboutPage,
  AccountPage,
  AdminPage,
  DesktopPage,
  DuplicatesPage,
  FileToolsPage,
  HomePage,
  NotFoundPage,
  PhotoRecoveryPage,
  PricingPage,
  ResourcesPage,
  VideoRecoveryPage
} from './pages';

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/photo-recovery" element={<PhotoRecoveryPage />} />
        <Route path="/video-recovery" element={<VideoRecoveryPage />} />
        <Route path="/file-tools" element={<FileToolsPage />} />
        <Route path="/duplicates" element={<DuplicatesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/desktop" element={<DesktopPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/login" element={<Navigate to="/account" replace />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
