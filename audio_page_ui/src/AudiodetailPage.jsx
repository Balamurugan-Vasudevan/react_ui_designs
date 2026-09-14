import { useEffect, useRef, useState } from "react";
import { Play, Pause, Heart, Bookmark, Share2, MessageCircle, MoreHorizontal } from "lucide-react";

const SEARCH_TERM = "Daft Punk";
const SEARCH_URL = `https://itunes.apple.com/search?term=${encodeURIComponent(SEARCH_TERM)}&media=music&entity=song&limit=6`;

function toSong(track) {
  return {
    title: track.trackName,
    creator: track.artistName,
    tags: [track.primaryGenreName || "Music", "Preview"],
    summary: `${track.collectionName || "Single"} by ${track.artistName}.`,
    duration: Math.round((track.trackTimeMillis || 30000) / 1000),
    artwork: track.artworkUrl100?.replace("100x100", "600x600"),
    previewUrl: track.previewUrl,
  };
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function AudioDetailPage() {
  const audioRef = useRef(null);
  const [episode, setEpisode] = useState(null);
  const [upNext, setUpNext] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadSongs() {
      try {
        const response = await fetch(SEARCH_URL);
        if (!response.ok) throw new Error("Could not load songs");
        const data = await response.json();
        const songs = data.results.filter((track) => track.previewUrl).map(toSong);
        if (!songs.length) throw new Error("No playable songs were found");
        if (isActive) {
          setEpisode(songs[0]);
          setUpNext(songs.slice(1));
        }
      } catch (loadError) {
        if (isActive) setError(loadError.message);
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    loadSongs();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    function updateProgress() {
      setCurrent(audio.currentTime);
    }

    function stopPlayback() {
      setIsPlaying(false);
    }

    function setLoadedDuration() {
      setAudioDuration(audio.duration);
    }

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("ended", stopPlayback);
    audio.addEventListener("loadedmetadata", setLoadedDuration);
    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("ended", stopPlayback);
      audio.removeEventListener("loadedmetadata", setLoadedDuration);
    };
  }, [episode]);

  function togglePlayback() {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => setError("The audio preview could not be played."));
    }
    setIsPlaying(!isPlaying);
  }

  function handleScrub(event) {
    if (!episode || !audioRef.current) return;
    const bar = event.currentTarget;
    const rect = bar.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const clamped = Math.min(Math.max(ratio, 0), 1);
    audioRef.current.currentTime = clamped * (audioDuration || episode.duration);
  }

  if (isLoading) return <div style={styles.status}>Loading live song data...</div>;
  if (error || !episode) return <div style={styles.status}>{error || "No song data available."}</div>;

  const duration = audioDuration || episode.duration;
  const progressPercent = Math.min((current / duration) * 100, 100);

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
      `}</style>

      <div style={styles.card}>
        <audio ref={audioRef} src={episode.previewUrl} preload="metadata" />
        <div style={styles.header}>
          <div style={styles.artwork} aria-hidden="true">
            {episode.artwork ? <img src={episode.artwork} alt="" style={styles.artworkImage} /> : <div style={styles.artworkMark}>♪</div>}
          </div>

          <div style={styles.metaColumn}>
            <div style={styles.tagRow}>
              {episode.tags.map((tag) => (
                <span key={tag} style={styles.tag}>{tag}</span>
              ))}
            </div>
            <h1 style={styles.title}>{episode.title}</h1>
            <p style={styles.creator}>{episode.creator}</p>
            <p style={styles.summary}>{episode.summary}</p>
          </div>
        </div>

        <div style={styles.playRow}>
          <button
            onClick={togglePlayback}
            style={styles.playButton}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={22} fill="#171512" /> : <Play size={22} fill="#171512" style={{ marginLeft: 2 }} />}
          </button>
          <span style={styles.playLabel}>{isPlaying ? "Playing" : "Play episode"}</span>
        </div>

        <div style={styles.progressSection}>
          <div style={styles.scrubTrack} onClick={handleScrub}>
            <div style={{ ...styles.scrubFill, width: `${progressPercent}%` }} />
            <div style={{ ...styles.scrubHandle, left: `${progressPercent}%` }} />
          </div>
          <div style={styles.timeRow}>
            <span style={styles.timeText}>{formatTime(current)}</span>
            <span style={styles.timeText}>{formatTime(duration)}</span>
          </div>
        </div>

        <div style={styles.actionRow}>
          <button
            style={styles.actionButton}
            onClick={() => setIsLiked(!isLiked)}
            aria-pressed={isLiked}
          >
            <Heart size={18} fill={isLiked ? "#C68B4F" : "none"} color={isLiked ? "#C68B4F" : "#A39C8E"} />
            <span style={isLiked ? styles.actionLabelActive : styles.actionLabel}>Like</span>
          </button>

          <button
            style={styles.actionButton}
            onClick={() => setIsSaved(!isSaved)}
            aria-pressed={isSaved}
          >
            <Bookmark size={18} fill={isSaved ? "#C68B4F" : "none"} color={isSaved ? "#C68B4F" : "#A39C8E"} />
            <span style={isSaved ? styles.actionLabelActive : styles.actionLabel}>Save</span>
          </button>

          <button style={styles.actionButton}>
            <Share2 size={18} color="#A39C8E" />
            <span style={styles.actionLabel}>Share</span>
          </button>

          <button style={styles.actionButton}>
            <MessageCircle size={18} color="#A39C8E" />
            <span style={styles.actionLabel}>Comments</span>
          </button>

          <button style={{ ...styles.actionButton, marginLeft: "auto" }} aria-label="More options">
            <MoreHorizontal size={18} color="#A39C8E" />
          </button>
        </div>

        <div style={styles.relatedSection}>
          <p style={styles.relatedHeading}>Up next from Signal & Noise</p>
          <div>
            {upNext.map((item, index) => (
              <div key={item.title} style={styles.relatedRow}>
                <span style={styles.relatedIndex}>{String(index + 1).padStart(2, "0")}</span>
                <div style={styles.relatedText}>
                  <p style={styles.relatedTitle}>{item.title}</p>
                  <p style={styles.relatedCreator}>{item.creator}</p>
                </div>
                <span style={styles.relatedDuration}>{formatTime(item.duration)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const ink = "#171512";
const surface = "#211E1A";
const line = "#332F29";
const bone = "#F2EDE4";
const bonesecondary = "#A39C8E";
const copper = "#C68B4F";

const styles = {
  status: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: ink,
    color: bone,
    fontFamily: "'Inter', sans-serif",
  },
  page: {
    background: ink,
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    padding: "48px 20px",
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 560,
  },
  header: {
    display: "flex",
    gap: 20,
    marginBottom: 32,
  },
  artwork: {
    width: 128,
    height: 128,
    flexShrink: 0,
    borderRadius: 6,
    background: `linear-gradient(155deg, ${surface}, #171512)`,
    border: `1px solid ${line}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  artworkImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: 6,
  },
  artworkMark: {
    fontFamily: "'Fraunces', serif",
    fontSize: 28,
    fontWeight: 500,
    color: copper,
    letterSpacing: 1,
  },
  metaColumn: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    minWidth: 0,
  },
  tagRow: {
    display: "flex",
    gap: 8,
    marginBottom: 10,
  },
  tag: {
    fontSize: 11,
    color: bonesecondary,
    border: `1px solid ${line}`,
    borderRadius: 3,
    padding: "2px 7px",
  },
  title: {
    fontFamily: "'Fraunces', serif",
    fontSize: 26,
    fontWeight: 600,
    color: bone,
    margin: 0,
    lineHeight: 1.2,
  },
  creator: {
    fontSize: 14,
    color: copper,
    margin: "4px 0 10px",
  },
  summary: {
    fontSize: 13.5,
    color: bonesecondary,
    lineHeight: 1.6,
    margin: 0,
  },
  playRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: copper,
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  playLabel: {
    fontSize: 14,
    fontWeight: 500,
    color: bone,
  },
  progressSection: {
    marginBottom: 24,
  },
  scrubTrack: {
    position: "relative",
    height: 3,
    background: line,
    borderRadius: 2,
    cursor: "pointer",
  },
  scrubFill: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    background: copper,
    borderRadius: 2,
  },
  scrubHandle: {
    position: "absolute",
    top: "50%",
    width: 10,
    height: 10,
    background: bone,
    borderRadius: "50%",
    transform: "translate(-50%, -50%)",
  },
  timeRow: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 8,
  },
  timeText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11.5,
    color: bonesecondary,
  },
  actionRow: {
    display: "flex",
    alignItems: "center",
    gap: 22,
    paddingBottom: 24,
    borderBottom: `1px solid ${line}`,
    marginBottom: 28,
  },
  actionButton: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
  },
  actionLabel: {
    fontSize: 12.5,
    color: bonesecondary,
  },
  actionLabelActive: {
    fontSize: 12.5,
    color: copper,
  },
  relatedSection: {},
  relatedHeading: {
    fontSize: 13,
    color: bonesecondary,
    marginBottom: 12,
  },
  relatedRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "12px 0",
    borderBottom: `1px solid ${line}`,
  },
  relatedIndex: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    color: bonesecondary,
    width: 20,
  },
  relatedText: {
    flex: 1,
    minWidth: 0,
  },
  relatedTitle: {
    fontSize: 14,
    color: bone,
    margin: 0,
    fontWeight: 500,
  },
  relatedCreator: {
    fontSize: 12,
    color: bonesecondary,
    margin: "2px 0 0",
  },
  relatedDuration: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11.5,
    color: bonesecondary,
  },
};