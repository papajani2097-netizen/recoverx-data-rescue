import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  FileSearch,
  Fingerprint,
  FolderOpen,
  HardDrive,
  Image as ImageIcon,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Video as VideoIcon
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { Link } from 'react-router';
import recoveryIllustration from '../assets/recovery-illustration.svg';
import { FileWorkspace, type WorkspaceMode } from './components/FileWorkspace';
import { supportEmail, supabase } from './lib/supabase';

function PageIntro({ eyebrow, title, description, children }: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-intro">
      <div className="eyebrow"><span className="eyebrow-sparkle">✳</span>{eyebrow}</div>
      <h1>{title}</h1>
      <p>{description}</p>
      {children}
    </header>
  );
}

function FeatureCard({ icon: Icon, title, description, to, label }: {
  icon: typeof FileSearch;
  title: string;
  description: string;
  to: string;
  label?: string;
}) {
  return (
    <Link className="feature-card" to={to}>
      <span className="feature-icon"><Icon size={20} strokeWidth={1.8} /></span>
      {label && <span className="feature-label">{label}</span>}
      <h3>{title}</h3>
      <p>{description}</p>
      <span className="card-link">Explore tool <ArrowUpRight size={15} /></span>
    </Link>
  );
}

function RecoveryNotice() {
  return (
    <aside className="notice-card">
      <span className="notice-icon"><ShieldCheck size={19} /></span>
      <div>
        <strong>Know what is—and is not—recoverable</strong>
        <p>RecoverX can inspect files you can already access. It cannot undelete data from a phone, PC, or drive in your browser. Check backups and device trash first; encrypted factory resets often make old data unrecoverable.</p>
      </div>
    </aside>
  );
}

export function HomePage() {
  return (
    <>
      <section className="hero-panel">
        <div className="hero-copy">
          <div className="eyebrow"><span className="live-dot" />YOUR DATA, YOUR CONTROL</div>
          <h1>Find what matters.<br /><span>Recover with confidence.</span></h1>
          <p>Clear, safe guidance for lost files—plus private tools to inspect backups and files you choose. No false promises. No uploads.</p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/resources/">Start with a recovery guide <ArrowRight size={16} /></Link>
            <Link className="button button-quiet" to="/file-tools/">Explore free tools</Link>
          </div>
          <div className="hero-proof">
            <span><LockKeyhole size={14} /> Files stay on your device</span>
            <span><Check size={15} /> No scan simulation</span>
          </div>
        </div>
        <div className="hero-art-wrap">
          <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
          <img className="hero-art" src={recoveryIllustration} alt="Illustration of safely organized digital files" />
          <div className="floating-status"><span className="status-check"><Check size={12} /></span><span><strong>Private by design</strong><small>Processing stays local</small></span></div>
        </div>
        <div className="hero-index"><span>01</span><i /> RECOVERX WORKSPACE</div>
      </section>

      <RecoveryNotice />

      <section className="section-block">
        <div className="section-heading">
          <div><div className="eyebrow">TOOLS THAT DO THE REAL WORK</div><h2>Start with what you can access</h2></div>
          <Link className="subtle-link" to="/file-tools/">All tools <ArrowRight size={15} /></Link>
        </div>
        <div className="feature-grid">
          <FeatureCard icon={FolderOpen} title="Inspect a backup folder" description="Review the files in an exported backup or folder you select, then download copies you can access." to="/file-tools/" label="LOCAL FILES" />
          <FeatureCard icon={ImageIcon} title="Re-encode an image" description="Try creating a fresh PNG from an image that your browser can still decode." to="/photo-recovery/" label="PHOTO TOOL" />
          <FeatureCard icon={Fingerprint} title="Find exact duplicates" description="Compare SHA-256 fingerprints of selected files without uploading them." to="/duplicates/" label="PRIVACY-FIRST" />
          <FeatureCard icon={VideoIcon} title="Inspect a video" description="Read duration and resolution from a selected video file in your browser." to="/video-recovery/" label="VIDEO TOOL" />
        </div>
      </section>

      <section className="quick-start">
        <div className="quick-start-copy">
          <div className="eyebrow">FIRST THINGS FIRST</div>
          <h2>Deleted something by accident?</h2>
          <p>Pause activity on the affected device, check its recently deleted folder and cloud backups, and avoid installing recovery apps onto the same drive.</p>
          <Link className="button button-outline" to="/resources/">Read the safe recovery checklist <ArrowRight size={15} /></Link>
        </div>
        <div className="steps-list">
          <div className="step-row"><span>01</span><div><strong>Stop unnecessary writes</strong><p>New data can overwrite recoverable files on some drives.</p></div></div>
          <div className="step-row"><span>02</span><div><strong>Check trusted backups</strong><p>Look in cloud history, device trash, and known backup copies.</p></div></div>
          <div className="step-row"><span>03</span><div><strong>Choose a safe next step</strong><p>For valuable data, ask a reputable recovery professional before experimenting.</p></div></div>
        </div>
      </section>

      <section className="metrics-strip" aria-label="RecoverX principles">
        <div><span className="metric-number"><LockKeyhole size={18} /></span><span><strong>Local-first</strong><small>Tools run in your browser</small></span></div>
        <div><span className="metric-number"><ShieldCheck size={18} /></span><span><strong>Clear limits</strong><small>No simulated recovery claims</small></span></div>
        <div><span className="metric-number"><Sparkles size={18} /></span><span><strong>Built to help</strong><small>Useful steps before software</small></span></div>
      </section>
    </>
  );
}

export function AboutPage() {
  return (
    <>
      <PageIntro eyebrow="ABOUT RECOVERX" title="Recovery starts with honesty." description="RecoverX is being built to make practical data-recovery guidance and safe file tools easier to use—without pretending that a website can read erased device storage." />
      <div className="content-grid">
        <article className="content-card content-card-featured"><ShieldCheck size={24} /><h2>Privacy before convenience</h2><p>The tools on this site run in your browser against files you select. File contents are not uploaded to RecoverX. Authentication is optional and separate from local file analysis.</p></article>
        <article className="content-card"><HardDrive size={22} /><h2>Respect device limits</h2><p>Modern phones encrypt storage. A factory reset usually destroys the keys needed to read the old data. On SSDs, TRIM may also make deleted data unavailable. We say so plainly.</p></article>
        <article className="content-card"><FileSearch size={22} /><h2>Useful tools, not fake scans</h2><p>Available tools inspect selected local files, calculate fingerprints, read video metadata, and re-encode decodable images. Deeper disk recovery is not available in this web app.</p></article>
      </div>
      <section className="contact-panel"><div><div className="eyebrow">QUESTIONS OR FEEDBACK</div><h2>Talk to the RecoverX team</h2><p>For questions about this site, send us a message.</p></div><a className="button button-outline" href={`mailto:${supportEmail}`}>Email support <ArrowUpRight size={15} /></a></section>
    </>
  );
}

export function PhotoRecoveryPage() {
  return (
    <>
      <PageIntro eyebrow="PHOTO RECOVERY" title="Your photos deserve a careful recovery." description="Start with the device's Recently Deleted folder and cloud photo backups. If you have an image file that still opens, the local tool below can try making a fresh PNG copy." />
      <RecoveryNotice />
      <FileWorkspace mode="photo" />
      <section className="guide-grid">
        <article className="content-card"><span className="guide-number">01 / IPHONE</span><h3>Check Photos and iCloud</h3><p>Open Photos → Recently Deleted, then check iCloud Photos and other backups associated with your Apple Account.</p><a href="https://support.apple.com/en-us/HT205856" target="_blank" rel="noreferrer">Apple recovery guide <ArrowUpRight size={14} /></a></article>
        <article className="content-card"><span className="guide-number">02 / ANDROID</span><h3>Check Gallery and Google Photos</h3><p>Review the device Gallery trash and the Trash folder in Google Photos. Availability and retention depend on the app and backup settings.</p><a href="https://support.google.com/photos/answer/6128858" target="_blank" rel="noreferrer">Google Photos help <ArrowUpRight size={14} /></a></article>
      </section>
    </>
  );
}

export function VideoRecoveryPage() {
  return (
    <>
      <PageIntro eyebrow="VIDEO RECOVERY" title="Get a clearer picture of your video files." description="Inspect duration and frame size for videos you can already access. For deleted videos, check the device's trash and cloud backup before trying recovery software." />
      <RecoveryNotice />
      <FileWorkspace mode="video" />
      <div className="info-banner"><LockKeyhole size={18} /><p>Video metadata is read by your browser from the selected files only. RecoverX does not upload, restore, or scan device storage.</p></div>
    </>
  );
}

function ToolPage({ mode, eyebrow, title, description }: {
  mode: WorkspaceMode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <>
      <PageIntro eyebrow={eyebrow} title={title} description={description} />
      <FileWorkspace mode={mode} />
      {mode === 'folder' && <RecoveryNotice />}
    </>
  );
}

export function FileToolsPage() {
  return <ToolPage mode="folder" eyebrow="LOCAL FILE TOOLS" title="A clear view of the files you can access." description="Choose a backup folder or files. RecoverX can list and copy accessible files; it cannot search your device for deleted data." />;
}

export function DuplicatesPage() {
  return <ToolPage mode="duplicates" eyebrow="DUPLICATE FINDER" title="Find exact copies, privately." description="Compare cryptographic fingerprints of files you select. Exact matches have identical content; similar or edited files are not grouped." />;
}

export function PricingPage() {
  return (
    <>
      <PageIntro eyebrow="SIMPLE, TRANSPARENT PLANS" title="Useful tools should start free." description="The local file tools are free to use. Subscription billing is not enabled yet, so RecoverX will not ask for payment for unavailable premium features." />
      <div className="pricing-grid">
        <article className="plan-card">
          <div className="plan-name">FREE <span>AVAILABLE</span></div>
          <h2>$0 <small>/ forever</small></h2>
          <p>Private tools for files and backups you already have.</p>
          <ul><li><Check size={16} /> Local file and folder inspection</li><li><Check size={16} /> Exact duplicate comparison</li><li><Check size={16} /> Image re-encoding and video metadata</li><li><Check size={16} /> Practical recovery guides</li></ul>
          <Link className="button button-outline button-full" to="/file-tools/">Use free tools <ArrowRight size={15} /></Link>
        </article>
        <article className="plan-card plan-card-premium">
          <div className="plan-name">PREMIUM <span className="coming-label">COMING SOON</span></div>
          <h2>Not available yet</h2>
          <p>We will publish exact features and pricing before enabling subscriptions.</p>
          <ul><li><span className="plan-bullet" /> Secure billing integration pending</li><li><span className="plan-bullet" /> Desktop recovery app pending</li><li><span className="plan-bullet" /> No charge or auto-renewal is active</li></ul>
          <button className="button button-disabled button-full" type="button" disabled>Coming soon</button>
        </article>
      </div>
    </>
  );
}

export function DesktopPage() {
  return (
    <>
      <PageIntro eyebrow="RECOVERX FOR WINDOWS" title="A desktop recovery app is in development." description="RecoverX does not currently scan disks or restore deleted files. We will not offer a download until the Windows application and its recovery engine are ready and independently tested." />
      <div className="desktop-status-panel">
        <span className="desktop-status-icon"><HardDrive size={28} /></span>
        <div><span className="coming-label">COMING SOON · NOT AVAILABLE FOR DOWNLOAD</span><h2>Windows app and Rust engine</h2><p>Low-level disk recovery requires a trusted native application. This browser site cannot access raw disk sectors or phone storage.</p></div>
      </div>
      <RecoveryNotice />
      <section className="content-card safety-card"><h2>For now, protect the data you have</h2><ul><li>Stop saving new files to the affected drive if the missing data matters.</li><li>Check cloud, device, and external-drive backups first.</li><li>Do not install recovery software onto the same drive you hope to recover.</li><li>For a failing or physically damaged drive, power it down and seek a qualified lab.</li></ul><Link className="subtle-link" to="/resources/">Read device-specific recovery guides <ArrowRight size={15} /></Link></section>
    </>
  );
}

export function ResourcesPage() {
  return (
    <>
      <PageIntro eyebrow="RECOVERY RESOURCES" title="Start with the safest recovery path." description="Check built-in trash folders and backups before installing third-party tools. These official resources explain each platform's options." />
      <RecoveryNotice />
      <div className="resource-list">
        <a className="resource-item" href="https://support.apple.com/en-us/HT205856" target="_blank" rel="noreferrer"><span className="resource-icon">A</span><span><strong>Restore deleted files on iPhone and iPad</strong><small>Recently Deleted, iCloud, and Apple support</small></span><ArrowUpRight size={17} /></a>
        <a className="resource-item" href="https://support.google.com/photos/answer/6128858" target="_blank" rel="noreferrer"><span className="resource-icon">G</span><span><strong>Restore items from Google Photos trash</strong><small>Google Photos official help</small></span><ArrowUpRight size={17} /></a>
        <a className="resource-item" href="https://support.microsoft.com/en-us/windows/restore-files-from-the-recycle-bin-in-windows-10-8596f0c1-5f07-4c33-9a7a-5b2a1c9b3c16" target="_blank" rel="noreferrer"><span className="resource-icon">W</span><span><strong>Restore files from the Windows Recycle Bin</strong><small>Microsoft Support</small></span><ArrowUpRight size={17} /></a>
        <a className="resource-item" href="https://support.apple.com/guide/mac-help/recover-files-mh35860/mac" target="_blank" rel="noreferrer"><span className="resource-icon">M</span><span><strong>Recover files with Time Machine on Mac</strong><small>Apple Support</small></span><ArrowUpRight size={17} /></a>
      </div>
      <section className="warning-panel"><span className="warning-mark">!</span><p><strong>After a factory reset:</strong> modern iPhones and most Android devices encrypt user data. Resetting usually destroys the encryption keys, so an app cannot decrypt the former contents. Restore from a cloud or computer backup if one exists.</p></section>
      <p className="resource-disclaimer">External links are provided for convenience. RecoverX is not affiliated with or endorsed by these providers.</p>
    </>
  );
}

export function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!active) return;
      if (authError) setError(authError.message);
      setUser(data.user);
    }).catch((caught: unknown) => {
      if (!active) return;
      setError(caught instanceof Error ? caught.message : 'Could not verify the current session.');
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError('');
    setMessage('');
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');
    try {
      const result = isSignUp
        ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}account/` } })
        : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) {
        setError(result.error.message);
      } else if (isSignUp) {
        setMessage('Account request received. Check your email if email confirmation is enabled for your Supabase project.');
      } else {
        setMessage('Signed in successfully.');
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The authentication request could not be completed.');
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) setError(signOutError.message);
      else setMessage('You have signed out.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not sign out.');
    }
  };

  const deleteAccount = async () => {
    if (!supabase || !window.confirm('Permanently delete your RecoverX account? This cannot be undone.')) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const { error: deleteError } = await supabase.functions.invoke('delete-account', { method: 'DELETE' });
      if (deleteError) {
        setError(deleteError.message);
      } else {
        const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
        setUser(null);
        setMessage(signOutError
          ? 'Your account was deleted, but this browser could not clear the local session. Please sign out manually.'
          : 'Your account and profile have been deleted.');
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The account could not be deleted.');
    } finally {
      setBusy(false);
    }
  };

  if (!supabase) {
    return (
      <>
        <PageIntro eyebrow="ACCOUNT" title="Your RecoverX account" description="Account services are optional. Local file tools work without signing in." />
        <div className="content-card configuration-card"><LockKeyhole size={24} /><h2>Authentication is not configured</h2><p>To enable secure sign-in, configure the Supabase URL and public anon key in the deployment environment. Never expose a service-role key in the website.</p></div>
      </>
    );
  }

  return (
    <>
      <PageIntro eyebrow="ACCOUNT" title={user ? 'Welcome back.' : 'Your RecoverX account'} description={user ? `Signed in as ${user.email ?? 'your account'}.` : 'Sign in or create an account. Local file tools remain available without signing in.'} />
      <div className="auth-card">
        {user ? (
          <div className="auth-success"><span className="success-icon"><Check size={22} /></span><h2>You’re signed in</h2><p>Account access is separate from local file analysis. Your files stay on this device.</p><div className="account-actions"><button className="button button-outline" type="button" disabled={busy} onClick={signOut}>Sign out</button><button className="text-button delete-account-button" type="button" disabled={busy} onClick={deleteAccount}>{busy ? 'Deleting…' : 'Permanently delete account'}</button></div></div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2>{isSignUp ? 'Create your account' : 'Sign in to RecoverX'}</h2>
            <label>Email address<input name="email" type="email" autoComplete="email" required /></label>
            <label>Password<input name="password" type="password" autoComplete={isSignUp ? 'new-password' : 'current-password'} minLength={8} required /></label>
            <button className="button button-primary button-full" disabled={busy} type="submit">{busy ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}</button>
            <button className="text-button auth-switch" type="button" onClick={() => { setIsSignUp((value) => !value); setError(''); setMessage(''); }}>
              {isSignUp ? 'Already have an account? Sign in' : 'New to RecoverX? Create an account'}
            </button>
          </form>
        )}
        {error && <p className="inline-error" role="alert">{error}</p>}
        {message && <p className="inline-notice" role="status">{message}</p>}
      </div>
    </>
  );
}

interface AdminAuditLog {
  id: string;
  action: string;
  actor_id: string | null;
  created_at: string;
}

export function AdminPage() {
  const [status, setStatus] = useState<'loading' | 'signed-out' | 'forbidden' | 'ready' | 'error'>('loading');
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setStatus('error');
      setMessage('Supabase is not configured for this deployment.');
      return;
    }

    let active = true;
    const loadAdminData = async () => {
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (!active) return;
      if (userError) {
        setStatus('error');
        setMessage(userError.message);
        return;
      }
      if (!user) {
        setStatus('signed-out');
        return;
      }
      if (user.app_metadata.role !== 'admin') {
        setStatus('forbidden');
        return;
      }

      const { data, error: queryError } = await client
        .from('audit_logs')
        .select('id, action, actor_id, created_at')
        .order('created_at', { ascending: false })
        .limit(25);
      if (!active) return;
      if (queryError) {
        setStatus('error');
        setMessage(queryError.message);
        return;
      }
      setLogs((data ?? []) as AdminAuditLog[]);
      setStatus('ready');
    };

    loadAdminData().catch((caught: unknown) => {
      if (!active) return;
      setStatus('error');
      setMessage(caught instanceof Error ? caught.message : 'Could not load the admin dashboard.');
    });
    return () => { active = false; };
  }, []);

  return (
    <>
      <PageIntro eyebrow="RESTRICTED AREA" title="Administration" description="Administrator access is verified using trusted Supabase app metadata and database row-level security." />
      {status === 'loading' && <div className="content-card"><p>Verifying administrator access…</p></div>}
      {status === 'signed-out' && <div className="content-card"><h2>Sign in required</h2><p>Sign in with an account that has been granted administrator access.</p><Link className="button button-primary" to="/account/">Go to sign in</Link></div>}
      {status === 'forbidden' && <div className="content-card"><h2>Access denied</h2><p>This account does not have the trusted administrator role.</p></div>}
      {status === 'error' && <p className="inline-error" role="alert">{message}</p>}
      {status === 'ready' && (
        <section className="content-card admin-card">
          <h2>Recent audit events</h2>
          {logs.length === 0 ? <p>No audit events are available.</p> : (
            <div className="admin-log-list">{logs.map((log) => <div className="admin-log" key={log.id}><strong>{log.action}</strong><span>{log.actor_id ?? 'System'} · {new Date(log.created_at).toLocaleString()}</span></div>)}</div>
          )}
        </section>
      )}
    </>
  );
}

export function NotFoundPage() {
  return (
    <section className="not-found-panel">
      <span>404</span><h1>This page isn’t here.</h1><p>Try a recovery guide or return to your RecoverX workspace.</p><Link className="button button-primary" to="/">Back to overview <ArrowRight size={16} /></Link>
    </section>
  );
}
