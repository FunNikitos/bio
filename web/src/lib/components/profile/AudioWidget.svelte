<script lang="ts">
  import type { AudioTrack, ProfileConfigV1 } from '../../schema/profile';
  import { activeLrcIndex, parseLrc } from '../../engine/effects/lrcParser';

  interface Props {
    profile: ProfileConfigV1;
    entered: boolean;
    videoEl: HTMLVideoElement | null;
  }

  let { profile, entered, videoEl }: Props = $props();

  let audioEl = $state<HTMLAudioElement | null>(null);
  let trackIdx = $state(0);
  let playing = $state(false);
  let currentTime = $state(0);
  let duration = $state(0);
  let volume = $state(0.6);
  let muted = $state(false);
  let vizBars = $state<number[]>(Array.from({ length: 18 }, () => 18));

  const tracks = $derived(profile.audio.tracks);
  const currentTrack: AudioTrack | null = $derived(tracks[trackIdx] ?? tracks[0] ?? null);
  const lrcLines = $derived(currentTrack?.lrcText ? parseLrc(currentTrack.lrcText) : []);
  const activeLyric = $derived(activeLrcIndex(lrcLines, currentTime));

  const STATIC_WAVE = [34, 52, 76, 68, 92, 84, 70, 96, 88, 62, 78, 94, 82, 58, 72, 64, 48, 38];

  $effect(() => {
    volume = Math.min(1, Math.max(0.05, profile.audio.defaultVolume / 100));
  });

  $effect(() => {
    if (!audioEl) return;
    audioEl.volume = muted ? 0 : volume;
  });

  $effect(() => {
    if (!entered || !profile.audio.enabled || !profile.audio.autoplayOnEnter || !currentTrack || !audioEl) return;
    if (profile.audio.shuffle && tracks.length > 1) {
      trackIdx = Math.floor(Math.random() * tracks.length);
    }
    void audioEl.play().then(() => { playing = true; }).catch(() => {});
  });

  $effect(() => {
    if (!playing || profile.audio.visualizer === 'off') return;
    const id = window.setInterval(() => {
      vizBars = vizBars.map((_, idx) => 22 + Math.round(Math.abs(Math.sin(Date.now() / 160 + idx * 0.7)) * 74));
    }, 90);
    return () => clearInterval(id);
  });

  function togglePlay() {
    if (!audioEl || !currentTrack) return;
    if (playing) {
      audioEl.pause();
      playing = false;
    } else {
      void audioEl.play().then(() => {
        playing = true;
        if (profile.audio.syncVideoWithAudio && videoEl && Number.isFinite(videoEl.duration) && videoEl.duration > 0) {
          videoEl.currentTime = audioEl!.currentTime % videoEl.duration;
          void videoEl.play().catch(() => {});
        }
      }).catch(() => {});
    }
  }

  function stepTrack(delta: number) {
    if (tracks.length <= 1) return;
    trackIdx = (trackIdx + delta + tracks.length) % tracks.length;
    currentTime = 0;
    if (playing) {
      queueMicrotask(() => { void audioEl?.play().catch(() => {}); });
    }
  }

  function seekTo(val: string) {
    if (!audioEl || !Number.isFinite(duration) || duration <= 0) return;
    const nextTime = (Number(val) / 1000) * duration;
    audioEl.currentTime = nextTime;
    currentTime = nextTime;
    if (profile.audio.syncVideoWithAudio && videoEl && Number.isFinite(videoEl.duration) && videoEl.duration > 0) {
      videoEl.currentTime = nextTime % videoEl.duration;
    }
  }

  function fmt(sec: number): string {
    if (!Number.isFinite(sec) || sec < 0) return '0:00';
    const s = Math.floor(sec);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }
</script>

{#if profile.audio.enabled && currentTrack}
  <audio
    bind:this={audioEl}
    src={currentTrack.url}
    loop={tracks.length === 1}
    preload="metadata"
    ontimeupdate={() => { if (audioEl) currentTime = audioEl.currentTime; }}
    onloadedmetadata={() => { if (audioEl) duration = audioEl.duration; }}
    onended={() => { if (tracks.length > 1) stepTrack(1); }}
  ></audio>

  {#if profile.audio.playerStyle !== 'hidden'}
    {#if profile.audio.playerStyle === 'volume-only'}
      <div class="audio-pill">
        <button type="button" class="icon-btn" onclick={() => { muted = !muted; }} aria-label={muted ? 'Включить звук' : 'Выключить звук'}>
          {muted ? '🔇' : '🔊'}
        </button>
        <button type="button" class="icon-btn" onclick={togglePlay} aria-label={playing ? 'Пауза' : 'Играть'}>
          {playing ? '⏸' : '▶'}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.02"
          value={muted ? 0 : volume}
          aria-label="Громкость"
          oninput={(e) => { volume = Number((e.target as HTMLInputElement).value); muted = volume === 0; }}
        />
      </div>
    {:else}
      <div class="audio-card" class:is-beat={playing && profile.audio.beatShake}>
        <div class="audio-top">
          {#if currentTrack.coverUrl}
            <img src={currentTrack.coverUrl} alt={currentTrack.title} class="audio-cover" />
          {:else}
            <div class="audio-cover fallback">♪</div>
          {/if}
          <div class="audio-meta">
            <div class="audio-title">{currentTrack.title}</div>
            {#if currentTrack.artist}
              <div class="audio-artist">{currentTrack.artist}</div>
            {/if}
          </div>
          <div class="audio-controls">
            {#if tracks.length > 1}
              <button type="button" class="ctrl-btn" aria-label="Предыдущий трек" onclick={() => stepTrack(-1)}>⏮</button>
            {/if}
            <button type="button" class="ctrl-btn play-main" aria-label={playing ? 'Пауза' : 'Воспроизвести'} onclick={togglePlay}>
              {playing ? '⏸' : '▶'}
            </button>
            {#if tracks.length > 1}
              <button type="button" class="ctrl-btn" aria-label="Следующий трек" onclick={() => stepTrack(1)}>⏭</button>
            {/if}
          </div>
        </div>

        {#if profile.audio.visualizer === 'bars'}
          <div class="viz-bars" aria-hidden="true">
            {#each vizBars as h}
              <span style="height:{playing ? h : 16}%"></span>
            {/each}
          </div>
        {:else if profile.audio.visualizer === 'waveform'}
          <div class="viz-wave" aria-hidden="true">
            {#each STATIC_WAVE as h, i}
              {@const ratio = duration > 0 ? currentTime / duration : 0}
              <span class:passed={i < ratio * STATIC_WAVE.length} style="height:{h}%"></span>
            {/each}
          </div>
        {/if}

        <div class="audio-seek-row">
          <span>{fmt(currentTime)}</span>
          <input
            type="range"
            min="0"
            max="1000"
            value={duration > 0 ? Math.round((currentTime / duration) * 1000) : 0}
            aria-label="Позиция трека"
            oninput={(e) => seekTo((e.target as HTMLInputElement).value)}
          />
          <span>{fmt(duration)}</span>
          <button type="button" class="mute-mini" onclick={() => { muted = !muted; }} aria-label="Звук">
            {muted ? '🔇' : '🔊'}
          </button>
        </div>

        {#if profile.audio.showLyrics && lrcLines.length > 0}
          <div class="lyrics-box">
            {#each lrcLines as line, idx}
              <p class:active={idx === activeLyric}>{line.text}</p>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  {/if}
{/if}

<style>
  .audio-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--bio-card-color) 78%, rgba(0, 0, 0, 0.4));
    backdrop-filter: blur(16px);
    border: 1px solid color-mix(in srgb, var(--bio-text) 16%, transparent);
  }
  .audio-pill input[type="range"] { width: 72px; accent-color: var(--bio-accent); }
  .icon-btn {
    border: none;
    background: transparent;
    cursor: pointer;
    padding: 2px 4px;
  }

  .audio-card {
    width: min(100%, 360px);
    padding: 12px 14px;
    border-radius: calc(var(--bio-card-radius, 20px) * 0.78);
    background: color-mix(in srgb, var(--bio-card-color) 78%, rgba(0, 0, 0, 0.35));
    backdrop-filter: blur(var(--bio-card-blur, 18px));
    border: 1px solid color-mix(in srgb, var(--bio-text) 16%, transparent);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .audio-card.is-beat {
    animation: audioBeat 0.7s ease-in-out infinite;
  }
  .audio-top {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .audio-cover {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    object-fit: cover;
    flex: none;
  }
  .audio-cover.fallback {
    display: grid;
    place-items: center;
    background: color-mix(in srgb, var(--bio-accent) 26%, transparent);
    font-weight: 700;
  }
  .audio-meta { flex: 1; min-width: 0; text-align: left; }
  .audio-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--bio-slot-trackTitle, var(--bio-text));
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .audio-artist {
    font-size: 0.76rem;
    color: var(--bio-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .audio-controls { display: flex; align-items: center; gap: 6px; }
  .ctrl-btn {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 1px solid color-mix(in srgb, var(--bio-text) 18%, transparent);
    background: transparent;
    cursor: pointer;
    display: grid;
    place-items: center;
    font-size: 0.78rem;
  }
  .ctrl-btn.play-main {
    background: var(--bio-accent);
    border-color: transparent;
    color: #fff;
  }
  .viz-bars,
  .viz-wave {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 22px;
  }
  .viz-bars span,
  .viz-wave span {
    flex: 1;
    border-radius: 2px;
    background: color-mix(in srgb, var(--bio-text) 28%, transparent);
    transition: height 0.1s ease;
  }
  .viz-bars span,
  .viz-wave span.passed {
    background: var(--bio-accent);
  }
  .audio-seek-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.74rem;
    color: var(--bio-text-muted);
    font-variant-numeric: tabular-nums;
  }
  .audio-seek-row input[type="range"] {
    flex: 1;
    accent-color: var(--bio-accent);
  }
  .mute-mini {
    border: none;
    background: transparent;
    cursor: pointer;
    padding: 0 2px;
  }
  .lyrics-box {
    max-height: 76px;
    overflow-y: auto;
    font-size: 0.78rem;
    color: var(--bio-text-subtle);
    border-top: 1px solid color-mix(in srgb, var(--bio-text) 10%, transparent);
    padding-top: 6px;
    text-align: center;
  }
  .lyrics-box p { margin: 2px 0; transition: color 0.15s ease; }
  .lyrics-box p.active { color: var(--bio-accent); font-weight: 600; }

  @keyframes audioBeat {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.012); }
  }
</style>
