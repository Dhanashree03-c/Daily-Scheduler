import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Plus, Trash2, Music2, AlertTriangle } from "lucide-react";
import { cn } from "../components/ui/utils";

interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
}

const SEED_TRACKS: Track[] = [
  {
    id: "seed-1",
    title: "SoundHelix Song 1",
    artist: "SoundHelix (sample)",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
];

function loadTracks(): Track[] {
  try {
    const saved = localStorage.getItem("musicTracks");
    if (!saved) return SEED_TRACKS;
    const parsed = JSON.parse(saved) as Track[];
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_TRACKS;
    // Drop persisted blob: URLs — they die on reload and mislead the user.
    const playable = parsed.filter((t) => t.url && !t.url.startsWith("blob:") && !t.url.includes("drive.google.com"));
    return playable.length ? playable : SEED_TRACKS;
  } catch {
    return SEED_TRACKS;
  }
}

function formatTime(time: number): string {
  if (!Number.isFinite(time) || time < 0) return "0:00";
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function isLikelyAudioUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim()) && !url.includes("drive.google.com");
}

export function MusicPlayer() {
  const [tracks, setTracks] = useState<Track[]>(loadTracks);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [showAddTrack, setShowAddTrack] = useState(false);
  const [newTrack, setNewTrack] = useState({ title: "", artist: "", url: "" });
  const [loadError, setLoadError] = useState("");

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    try {
      // Never persist blob: URLs.
      const persistable = tracks.filter((t) => !t.url.startsWith("blob:"));
      localStorage.setItem("musicTracks", JSON.stringify(persistable));
    } catch {
      toast.error("Couldn't save playlist", { description: "Storage is full or unavailable." });
    }
  }, [tracks]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const handleEnded = () => {
      if (currentTrackIndex < tracks.length - 1) {
        setCurrentTrackIndex((prev) => Math.min(prev + 1, tracks.length - 1));
      } else {
        setIsPlaying(false);
      }
    };
    const handleError = () => {
      setIsPlaying(false);
      setLoadError("This track couldn't play. Check the link or try another song.");
      toast.error("Couldn't play this track", { description: "The audio link may be broken or blocked." });
    };
    const handlePlaying = () => setLoadError("");

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("playing", handlePlaying);
    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("playing", handlePlaying);
    };
  }, [currentTrackIndex, tracks.length]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const currentTrack = tracks[currentTrackIndex];

  useEffect(() => {
    // Reset clock when switching tracks.
    setCurrentTime(0);
    setDuration(0);
    setLoadError("");
  }, [currentTrackIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (isPlaying) {
      audio.play().catch(() => {
        setIsPlaying(false);
        toast.error("Playback blocked", { description: "Tap play again — browsers need a user gesture." });
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrackIndex, currentTrack]);

  const togglePlayPause = async () => {
    if (!currentTrack) return;
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
      setLoadError("This track couldn't play. Try a direct MP3/audio link.");
      toast.error("Couldn't play", { description: "Check the link — it must point directly to an audio file." });
    }
  };

  const skipForward = () => {
    if (currentTrackIndex < tracks.length - 1) setCurrentTrackIndex((p) => p + 1);
  };
  const skipBackward = () => {
    // At start, restart; otherwise previous.
    if (currentTime > 3 && audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    if (currentTrackIndex > 0) setCurrentTrackIndex((p) => p - 1);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (!Number.isFinite(time)) return;
    setCurrentTime(time);
    if (audioRef.current) audioRef.current.currentTime = time;
  };

  const addTrack = () => {
    const title = newTrack.title.trim();
    const url = newTrack.url.trim();
    if (!title || !url) {
      toast.error("Add a title and audio link", { description: "Both are needed to save a track." });
      return;
    }
    if (!isLikelyAudioUrl(url)) {
      toast.error("That doesn't look like a direct audio link", {
        description: "Paste a link ending in .mp3/.ogg/.wav — Drive 'view' pages won't play.",
      });
      return;
    }
    const track: Track = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title,
      artist: newTrack.artist.trim() || "Unknown artist",
      url,
    };
    setTracks([...tracks, track]);
    setNewTrack({ title: "", artist: "", url: "" });
    setShowAddTrack(false);
    toast.success("Track added 🎵", { description: `"${title}" is in your playlist.` });
  };

  const deleteTrack = (id: string) => {
    const idx = tracks.findIndex((t) => t.id === id);
    const removed = tracks[idx];
    const next = tracks.filter((t) => t.id !== id);
    setTracks(next);
    if (idx === currentTrackIndex) {
      setIsPlaying(false);
      setCurrentTrackIndex(next.length ? Math.min(idx, next.length - 1) : 0);
    } else if (idx < currentTrackIndex) {
      setCurrentTrackIndex((p) => Math.max(0, p - 1));
    }
    toast.error("Track removed", {
      description: removed ? `"${removed.title}" removed.` : undefined,
      action: { label: "Undo", onClick: () => removed && setTracks((prev) => { const copy = [...prev]; copy.splice(Math.min(idx, copy.length), 0, removed); return copy; }) },
    });
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <main className="page-shell max-w-2xl mx-auto" aria-label="Music player">
      <div className="page-head">
        <div className="flex items-center gap-2">
          <Music2 className="size-8 text-primary" aria-hidden />
          <div>
            <p className="page-subtitle mb-0.5">Your vibe, your playlist 🎧</p>
            <h1 className="page-title">Music player</h1>
          </div>
        </div>
      </div>

      {currentTrack ? (
        <section className="rounded-3xl p-6 text-white shadow-xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-amber-400" aria-label="Now playing">
          <div className="flex items-center justify-center mb-4">
            <div className="w-28 h-28 bg-white/20 rounded-full flex items-center justify-center backdrop-blur ring-4 ring-white/20">
              <Music2 className={cn("size-14", isPlaying && "animate-pulse")} aria-hidden />
            </div>
          </div>

          <h2 className="text-xl font-bold text-center mb-1 break-words">{currentTrack.title}</h2>
          <p className="text-white/85 text-center mb-5 text-sm">{currentTrack.artist}</p>

          {loadError && (
            <p role="alert" className="flex items-start gap-2 text-sm bg-black/25 rounded-xl px-3 py-2 mb-3">
              <AlertTriangle className="size-4 mt-0.5 shrink-0" aria-hidden />
              {loadError}
            </p>
          )}

          <label htmlFor="track-progress" className="sr-only">Track progress</label>
          <input
            id="track-progress"
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
            className="w-full accent-white cursor-pointer"
          />
          <div className="flex justify-between text-xs text-white/85 mt-1 tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
            <span className="sr-only">{Math.round(progressPercent)}% played</span>
          </div>

          <div className="flex items-center justify-center gap-4 mb-4 mt-3">
            <button type="button" onClick={skipBackward} aria-label="Previous track or restart" className="min-w-11 min-h-11 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors">
              <SkipBack className="size-7" />
            </button>
            <button
              type="button"
              onClick={togglePlayPause}
              aria-label={isPlaying ? `Pause ${currentTrack.title}` : `Play ${currentTrack.title}`}
              className="min-w-14 min-h-14 flex items-center justify-center rounded-full bg-white text-fuchsia-600 shadow-lg hover:scale-105 active:scale-95 transition-transform"
            >
              {isPlaying ? <Pause className="size-7" /> : <Play className="size-7 ml-0.5" />}
            </button>
            <button type="button" onClick={skipForward} aria-label="Next track" className="min-w-11 min-h-11 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors">
              <SkipForward className="size-7" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              aria-label={isMuted ? "Unmute" : "Mute"}
              aria-pressed={isMuted}
              className="min-w-11 min-h-11 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            >
              {isMuted || volume === 0 ? <VolumeX /> : <Volume2 />}
            </button>
            <label htmlFor="volume" className="sr-only">Volume</label>
            <input
              id="volume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                setIsMuted(false);
              }}
              aria-valuetext={isMuted ? "Muted" : `${Math.round(volume * 100)}% volume`}
              className="flex-1 accent-white cursor-pointer"
            />
            <span className="text-xs w-8 text-right tabular-nums" aria-hidden>{isMuted ? "0%" : `${Math.round(volume * 100)}%`}</span>
          </div>
        </section>
      ) : (
        <div className="empty-state" role="status">
          <span className="empty-emoji" aria-hidden>🎵</span>
          <p className="text-sm text-muted-foreground">No tracks yet — add one and press play!</p>
        </div>
      )}

      <audio ref={audioRef} src={currentTrack?.url} preload="metadata" />

      <section className="bg-card border border-border rounded-2xl p-4 shadow-sm" aria-label="Playlist">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="font-bold">Your playlist ({tracks.length})</h2>
          <button
            type="button"
            onClick={() => setShowAddTrack(!showAddTrack)}
            aria-expanded={showAddTrack}
            className="min-h-11 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90"
          >
            <Plus className="size-4" aria-hidden /> Add track
          </button>
        </div>

        {showAddTrack && (
          <form
            className="space-y-3 mb-4 rounded-2xl border border-border bg-muted/40 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              addTrack();
            }}
          >
            <div>
              <label htmlFor="track-title" className="text-sm font-semibold block mb-1">Song title *</label>
              <input
                id="track-title"
                type="text"
                placeholder="e.g. Midnight City"
                value={newTrack.title}
                onChange={(e) => setNewTrack({ ...newTrack, title: e.target.value })}
                className="w-full min-h-11 px-3 py-2.5 border border-border rounded-xl bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>
            <div>
              <label htmlFor="track-artist" className="text-sm font-semibold block mb-1">Artist</label>
              <input
                id="track-artist"
                type="text"
                placeholder="e.g. M83"
                value={newTrack.artist}
                onChange={(e) => setNewTrack({ ...newTrack, artist: e.target.value })}
                className="w-full min-h-11 px-3 py-2.5 border border-border rounded-xl bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>
            <div>
              <label htmlFor="track-url" className="text-sm font-semibold block mb-1">Audio link (MP3 / OGG / WAV) *</label>
              <input
                id="track-url"
                type="url"
                placeholder="https://…/song.mp3"
                value={newTrack.url}
                onChange={(e) => setNewTrack({ ...newTrack, url: e.target.value })}
                className="w-full min-h-11 px-3 py-2.5 border border-border rounded-xl bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
              <p className="text-xs text-muted-foreground mt-1">Paste a direct audio file link — Google Drive share pages won&apos;t play.</p>
            </div>
            <button type="submit" className="w-full min-h-11 bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold hover:bg-primary/90">
              Add to playlist 🎵
            </button>
          </form>
        )}

        {tracks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Playlist is empty — add your first song above.</p>
        ) : (
          <ul className="space-y-1">
            {tracks.map((track, index) => {
              const active = index === currentTrackIndex;
              return (
                <li key={track.id}>
                  <div
                    className={cn(
                      "w-full flex items-center gap-2 rounded-xl px-3 py-1 text-left transition-colors",
                      active ? "bg-primary/10 border border-primary/25" : "hover:bg-accent"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentTrackIndex(index);
                        setIsPlaying(true);
                      }}
                      aria-current={active ? "true" : undefined}
                      aria-label={`Play ${track.title} by ${track.artist}`}
                      className="flex-1 min-w-0 flex items-center gap-3 min-h-11 text-left py-2"
                    >
                      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                        {active && isPlaying ? "▶" : index + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium truncate">{track.title}</span>
                        <span className="block text-xs text-muted-foreground truncate">{track.artist}</span>
                      </span>
                      {active && <span className="ml-auto text-xs font-semibold text-primary shrink-0">{isPlaying ? "Playing" : "Paused"}</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTrack(track.id)}
                      aria-label={`Remove ${track.title}`}
                      className="min-w-11 min-h-11 flex items-center justify-center rounded-xl text-destructive hover:bg-destructive/10 shrink-0"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
