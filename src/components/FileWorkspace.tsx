import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  downloadBlob,
  findDuplicateFiles,
  formatBytes,
  readVideoMetadata,
  reencodeImage,
  sha256File,
  type DuplicateGroup,
  type VideoMetadata
} from '../lib/fileTools';

export type WorkspaceMode = 'folder' | 'inspect' | 'duplicates' | 'photo' | 'video';

interface FileWorkspaceProps {
  mode: WorkspaceMode;
}

const workspaceCopy: Record<WorkspaceMode, { title: string; description: string; action: string }> = {
  folder: {
    title: 'Inspect a backup folder',
    description: 'Choose a folder or files from a backup, exported archive, or device you can already access. RecoverX lists what you selected; it cannot search deleted device storage.',
    action: 'Choose folder or files'
  },
  inspect: {
    title: 'Inspect local files',
    description: 'Review file names, formats, and sizes on this device. Selected files are read locally and never uploaded.',
    action: 'Choose files'
  },
  duplicates: {
    title: 'Find exact duplicates',
    description: 'Compare SHA-256 fingerprints to find byte-for-byte identical files. Similar photos and edited versions are not treated as duplicates.',
    action: 'Choose files to compare'
  },
  photo: {
    title: 'Re-encode an image',
    description: 'If your browser can still decode a damaged image, re-encoding may make a fresh PNG copy. It cannot restore an image that is no longer available.',
    action: 'Choose images'
  },
  video: {
    title: 'Inspect video metadata',
    description: 'Read basic duration and resolution from video files you select. This does not scan storage or recover deleted videos.',
    action: 'Choose videos'
  }
};

function fileKey(file: File, index: number): string {
  return `${file.name}:${file.size}:${file.lastModified}:${index}`;
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds)) return 'Unknown duration';
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainder = totalSeconds % 60;
  return [hours, minutes, remainder].filter((value, index) => value > 0 || index > 0).map((value) => String(value).padStart(2, '0')).join(':');
}

export function FileWorkspace({ mode }: FileWorkspaceProps) {
  const fileInput = useRef<HTMLInputElement | null>(null);
  const copy = workspaceCopy[mode];
  const [files, setFiles] = useState<File[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [fingerprints, setFingerprints] = useState<Record<string, string>>({});
  const [videoMetadata, setVideoMetadata] = useState<Record<string, VideoMetadata>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const totalSize = useMemo(() => files.reduce((total, file) => total + file.size, 0), [files]);

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.currentTarget.files ?? []);
    setFiles(selected);
    setDuplicates([]);
    setFingerprints({});
    setVideoMetadata({});
    setError('');
    setNotice(selected.length ? `${selected.length} item${selected.length === 1 ? '' : 's'} selected. Files remain on this device.` : '');
  };

  const compareDuplicates = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const groups = await findDuplicateFiles(files);
      setDuplicates(groups);
      setNotice(groups.length
        ? `Found ${groups.length} exact duplicate group${groups.length === 1 ? '' : 's'}. No files were changed.`
        : 'No exact duplicates found among the selected files.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not compare these files.');
    } finally {
      setBusy(false);
    }
  };

  const readFingerprint = async (file: File, index: number) => {
    setBusy(true);
    setError('');
    try {
      const fingerprint = await sha256File(file);
      setFingerprints((current) => ({ ...current, [fileKey(file, index)]: fingerprint }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not calculate the file fingerprint.');
    } finally {
      setBusy(false);
    }
  };

  const inspectVideos = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    const metadata: Record<string, VideoMetadata> = {};
    const failures: string[] = [];

    for (const [index, file] of files.entries()) {
      try {
        metadata[fileKey(file, index)] = await readVideoMetadata(file);
      } catch (caught) {
        failures.push(caught instanceof Error ? caught.message : `Could not read ${file.name}.`);
      }
    }

    setVideoMetadata(metadata);
    setError(failures.join(' '));
    setNotice(`${Object.keys(metadata).length} video${Object.keys(metadata).length === 1 ? '' : 's'} inspected locally.`);
    setBusy(false);
  };

  const repairImage = async (file: File) => {
    setBusy(true);
    setError('');
    try {
      const repairedCopy = await reencodeImage(file);
      const safeName = file.name.replace(/\.[^.]+$/, '') || file.name;
      downloadBlob(repairedCopy, `${safeName}-re-encoded.png`);
      setNotice(`Created a PNG copy of ${file.name}. The original was not changed.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `Could not re-encode ${file.name}.`);
    } finally {
      setBusy(false);
    }
  };

  const setFolderInput = (element: HTMLInputElement | null) => {
    fileInput.current = element;
    if (element && mode === 'folder') {
      element.setAttribute('webkitdirectory', '');
      element.setAttribute('directory', '');
    }
  };

  return (
    <section className="workspace-card" aria-labelledby={`workspace-${mode}`}>
      <div className="workspace-heading">
        <div className="workspace-icon" aria-hidden="true">
          {mode === 'photo' ? '▧' : mode === 'video' ? '▷' : mode === 'duplicates' ? '⧉' : '⌕'}
        </div>
        <div>
          <h2 id={`workspace-${mode}`}>{copy.title}</h2>
          <p>{copy.description}</p>
        </div>
      </div>

      <input
        ref={setFolderInput}
        className="visually-hidden"
        type="file"
        multiple
        accept={mode === 'photo' ? 'image/*' : mode === 'video' ? 'video/*' : undefined}
        onChange={handleFileSelection}
        aria-label={copy.action}
      />
      <div className="workspace-controls">
        <button className="button button-primary" type="button" onClick={() => fileInput.current?.click()}>
          <span aria-hidden="true">＋</span> {copy.action}
        </button>
        {mode === 'duplicates' && files.length > 1 && (
          <button className="button button-outline" type="button" disabled={busy} onClick={compareDuplicates}>
            {busy ? 'Comparing…' : 'Compare selected files'}
          </button>
        )}
        {mode === 'video' && files.length > 0 && (
          <button className="button button-outline" type="button" disabled={busy} onClick={inspectVideos}>
            {busy ? 'Reading metadata…' : 'Read video metadata'}
          </button>
        )}
        {files.length > 0 && <span className="selection-summary">{files.length} files · {formatBytes(totalSize)}</span>}
      </div>

      {error && <p className="inline-error" role="alert">{error}</p>}
      {notice && <p className="inline-notice" role="status">{notice}</p>}

      {mode === 'duplicates' && duplicates.length > 0 && (
        <div className="duplicate-results" aria-live="polite">
          {duplicates.map((group) => (
            <div className="duplicate-group" key={group.fingerprint}>
              <strong>{group.files.length} identical files · {group.fingerprint.slice(0, 16)}…</strong>
              <ul>{group.files.map((file, index) => <li key={`${file.name}-${file.lastModified}-${index}`}>{file.name} <span>{formatBytes(file.size)}</span></li>)}</ul>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="file-list" aria-live="polite">
          {files.map((file, index) => {
            const key = fileKey(file, index);
            return (
              <article className="file-row" key={key}>
                <span className="file-type-mark" aria-hidden="true">{file.type.startsWith('image/') ? 'IMG' : file.type.startsWith('video/') ? 'VID' : 'FILE'}</span>
                <div className="file-details">
                  <strong title={file.name}>{file.name}</strong>
                  <span>{file.webkitRelativePath || file.type || 'Unknown format'} · {formatBytes(file.size)}</span>
                  {videoMetadata[key] && <span>{videoMetadata[key].width} × {videoMetadata[key].height} · {formatDuration(videoMetadata[key].durationSeconds)}</span>}
                  {fingerprints[key] && <code className="fingerprint">{fingerprints[key]}</code>}
                </div>
                <div className="file-actions">
                  {mode === 'photo' && (
                    <button className="text-button" type="button" disabled={busy} onClick={() => repairImage(file)}>Re-encode copy</button>
                  )}
                  {mode === 'inspect' && (
                    <button className="text-button" type="button" disabled={busy} onClick={() => readFingerprint(file, index)}>
                      {fingerprints[key] ? 'Fingerprint ready' : 'SHA-256'}
                    </button>
                  )}
                  {mode === 'folder' && (
                    <button className="text-button" type="button" onClick={() => downloadBlob(file, file.name)}>Download copy</button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="privacy-footnote"><span aria-hidden="true">●</span> Runs in this browser. Your selected files are not sent to RecoverX.</p>
    </section>
  );
}
