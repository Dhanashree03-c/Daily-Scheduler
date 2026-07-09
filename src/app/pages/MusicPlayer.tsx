import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Plus, Trash2, Music } from 'lucide-react';

interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
}

export function MusicPlayer() {
  const [tracks, setTracks] = useState<Track[]>(() => {
    const saved = localStorage.getItem('musicTracks');
    return saved ? JSON.parse(saved) : [
      {
        id: '1',
        title: 'Sample Track 1',
        artist: 'Artist Name',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
      },
      {
        id: '2',
        title: 'Double Take',
        artist: 'Dhruv',
        url: 'https://drive.google.com/file/d/1_aaVURAqr-IteSAthttrKl73OGm8CN3n/view?usp=sharing'
      }
    ];
  });

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [showAddTrack, setShowAddTrack] = useState(false);
  const [newTrack, setNewTrack] = useState({ title: '', artist: '', url: '' });

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    localStorage.setItem('musicTracks', JSON.stringify(tracks));
  }, [tracks]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (currentTrackIndex < tracks.length - 1) {
        setCurrentTrackIndex(prev => prev + 1);
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrackIndex, tracks.length]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play();
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlayPause = () => setIsPlaying(!isPlaying);

  const skipForward = () => {
    if (currentTrackIndex < tracks.length - 1) {
      setCurrentTrackIndex(prev => prev + 1);
    }
  };

  const skipBackward = () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(prev => prev - 1);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const addTrack = () => {
    if (newTrack.title && newTrack.url) {
      const track: Track = {
        id: Date.now().toString(),
        title: newTrack.title,
        artist: newTrack.artist || 'Unknown Artist',
        url: newTrack.url
      };
      setTracks([...tracks, track]);
      setNewTrack({ title: '', artist: '', url: '' });
      setShowAddTrack(false);
    }
  };

  const deleteTrack = (id: string) => {
    setTracks(tracks.filter(t => t.id !== id));
    if (tracks[currentTrackIndex]?.id === id && currentTrackIndex > 0) {
      setCurrentTrackIndex(prev => prev - 1);
    }
  };

  const currentTrack = tracks[currentTrackIndex];

  return (
    <div className="pb-20 px-4 pt-6 max-w-2xl mx-auto">
      <h1 className="text-2xl mb-6">Music Player</h1>

      {currentTrack && (
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 mb-6 text-white shadow-lg">
          <div className="flex items-center justify-center mb-6">
            <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
              <Music className="size-16" />
            </div>
          </div>

          <h2 className="text-xl text-center mb-1">{currentTrack.title}</h2>
          <p className="text-blue-100 text-center mb-6">{currentTrack.artist}</p>

          <input
            type="range"
            aria-label="Track progress"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
          />

          <div className="flex justify-between text-xs text-blue-100 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          <div className="flex items-center justify-center gap-6 mb-4 mt-4">
            <button onClick={skipBackward} aria-label="Previous track">
              <SkipBack className="size-8" />
              <span className="sr-only">Previous track</span>
            </button>

            <button onClick={togglePlayPause} aria-label="Play or Pause">
              {isPlaying ? <Pause className="size-8" /> : <Play className="size-8" />}
              <span className="sr-only">Play Pause</span>
            </button>

            <button onClick={skipForward} aria-label="Next track">
              <SkipForward className="size-8" />
              <span className="sr-only">Next track</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setIsMuted(!isMuted)} aria-label="Toggle volume">
              {isMuted ? <VolumeX /> : <Volume2 />}
              <span className="sr-only">Toggle volume</span>
            </button>

            <input
              type="range"
              aria-label="Volume control"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="flex-1"
            />
          </div>
        </div>
      )}

      <audio ref={audioRef} src={currentTrack?.url} />

      <div className="bg-white rounded-lg shadow-sm p-4">
        <button onClick={() => setShowAddTrack(!showAddTrack)} aria-label="Add track">
          <Plus />
          <span className="sr-only">Add track</span>
        </button>

        {showAddTrack && (
          <div>
            <label htmlFor="title">Track Title</label>
            <input
              id="title"
              type="text"
              placeholder="Enter track title"
              value={newTrack.title}
              onChange={(e) => setNewTrack({ ...newTrack, title: e.target.value })}
            />

            <label htmlFor="artist">Artist</label>
            <input
              id="artist"
              type="text"
              placeholder="Enter artist name"
              value={newTrack.artist}
              onChange={(e) => setNewTrack({ ...newTrack, artist: e.target.value })}
            />

            <label htmlFor="audio">Upload Audio File</label>
            <input
              id="audio"
              type="file"
              accept="audio/*"
              aria-label="Upload audio file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  setNewTrack({
                    ...newTrack,
                    url,
                    title: newTrack.title || file.name
                  });
                }
              }}
            />

            <button onClick={addTrack}>Add Track</button>
          </div>
        )}

        {tracks.map((track, index) => (
          <div key={track.id} onClick={() => setCurrentTrackIndex(index)}>
            {track.title}
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteTrack(track.id);
              }}
              aria-label="Delete track"
            >
              <Trash2 />
              <span className="sr-only">Delete track</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}