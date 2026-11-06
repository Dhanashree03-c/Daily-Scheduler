/**
 * Music library storage — do you need a database?
 *
 * Short answer: NO database needed for this app as-is.
 *  - Link tracks (MP3 URLs) store only tiny metadata (title/artist/URL) in
 *    localStorage and stream on tap. Nothing to sync.
 *  - Uploaded files (your own MP3s) can't live in localStorage (tiny quota,
 *    and blob: URLs die on reload). Those go in IndexedDB via localForage
 *    — still 100% on-device, no server.
 *
 * You'd only need a real backend database for: multi-device sync, sharing
 * playlists with friends, or streaming copyrighted catalogues.
 */
import localforage from "localforage";

const lib = localforage.createInstance({ name: "nowplan-music", storeName: "audio" });

export async function saveAudioBlob(trackId: string, blob: Blob): Promise<void> {
  await lib.setItem(trackId, blob);
}

export async function loadAudioBlob(trackId: string): Promise<Blob | null> {
  try {
    const v = await lib.getItem<Blob>(trackId);
    return v instanceof Blob ? v : null;
  } catch {
    return null;
  }
}

export async function removeAudioBlob(trackId: string): Promise<void> {
  try {
    await lib.removeItem(trackId);
  } catch {
    /* ignore */
  }
}

export async function audioStorageSize(): Promise<number> {
  try {
    let total = 0;
    await lib.iterate((value) => {
      if (value instanceof Blob) total += value.size;
    });
    return total;
  } catch {
    return 0;
  }
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = -1;
  let n = bytes;
  do {
    n /= 1024;
    i++;
  } while (n >= 1 && i < units.length - 1);
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
