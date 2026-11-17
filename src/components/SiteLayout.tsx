import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { Seo } from './Seo';

const navigation = [
  { label: 'Overview', to: '/' },
  { label: 'File tools', to: '/file-tools/' },
  { label: 'Photo recovery', to: '/photo-recovery/' },
  { label: 'Video recovery', to: '/video-recovery/' },
  { label: 'Duplicates', to: '/duplicates/' },
  { label: 'Recovery guides', to: '/resources/' }
];

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function SiteLayout() {
  const location = useLocation();
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installError, setInstallError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
    } catch (error) {
      setInstallError(error instanceof Error ? error.message : 'The app could not be installed.');
    }
  };

  return (
    <div className="app-shell">
      <Seo />
      <aside className={`sidebar${menuOpen ? ' sidebar-open' : ''}`} aria-label="Main navigation">
        <Link className="brand" to="/" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark" aria-hidden="true">R</span>
          <span>
            <strong>Recover<span>X</span></strong>
            <small>DATA RECOVERY PLATFORM</small>
          </span>
        </Link>

        <div className="nav-section-label">WORKSPACE</div>
        <nav className="primary-nav">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-dot" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="privacy-card">
            <span className="privacy-icon" aria-hidden="true">◈</span>
            <strong>Your files stay yours</strong>
            <p>Browser tools process files on this device. Nothing is uploaded.</p>
          </div>
          <Link className="profile-link" to="/account/" onClick={() => setMenuOpen(false)}>
            <span className="profile-avatar" aria-hidden="true">R</span>
            <span><strong>RecoverX account</strong><small>Sign in or create account</small></span>
            <span className="profile-arrow" aria-hidden="true">↗</span>
          </Link>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <button
            type="button"
            className="menu-toggle"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span /><span /><span />
          </button>
          <div className="breadcrumb">
            <span>RecoverX</span><span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{location.pathname === '/' ? 'Overview' : location.pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ')}</span>
          </div>
          <div className="topbar-actions">
            <span className="secure-label"><span className="status-dot" />Private workspace</span>
            {installPrompt && <button className="button button-quiet button-small" type="button" onClick={handleInstall}>Install app</button>}
            <Link className="button button-small button-outline" to="/pricing/">View plans</Link>
          </div>
        </header>
        {installError && <p className="inline-error" role="alert">{installError}</p>}

        <main className="page-main">
          <Outlet />
        </main>

        <footer className="site-footer">
          <div className="footer-brand"><span className="brand-mark brand-mark-small" aria-hidden="true">R</span><span>RecoverX © {new Date().getFullYear()}</span></div>
          <p>Honest recovery guidance. Your data stays in your control.</p>
          <div className="footer-links">
            <Link to="/about/">About</Link>
            <Link to="/resources/">Resources</Link>
            <Link to="/pricing/">Plans</Link>
          </div>
        </footer>
      </div>
      {menuOpen && <button className="sidebar-scrim" type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    </div>
  );
}
