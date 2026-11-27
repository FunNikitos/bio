<script lang="ts">
  import type { AudioTrack, ProfileConfigV1 } from '../../schema/profile';
  import { activeLrcIndex, parseLrc } from '../../engine/effects/lrcParser';

  interface Props {
    profile: ProfileConfigV1;
    entered: boolean;
    videoEl: HTMLVideoElement | null;
    volume?: number;
    muted?: boolean;
  }

  let { profile, entered, videoEl, volume = $bindable(0.6), muted = $bindable(false) }: Props = $props();

  let audioEl = $state<HTMLAudioElement | null>(null);
  let trackIdx = $state(0);
  let playing = $state(false);
  let currentTime = $state(0);
  let duration = $state(0);
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
        <div class="audio-row-main">
          {#if currentTrack.coverUrl}
            <img src={currentTrack.coverUrl} alt={currentTrack.title} class="audio-cover" />
          {:else}
            <div class="audio-cover fallback">♪</div>
          {/if}
          <div class="audio-right">
            <div class="audio-head">
              <span class="audio-title">{currentTrack.title}</span>
              {#if currentTrack.artist}
                <span class="audio-artist">· {currentTrack.artist}</span>
              {/if}
            </div>
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
              <div class="audio-controls">
                <button type="button" class="ctrl-btn" aria-label="Предыдущий трек" onclick={() => stepTrack(-1)} disabled={tracks.length <= 1}>⏮</button>
                <button type="button" class="ctrl-btn play-main" aria-label={playing ? 'Пауза' : 'Воспроизвести'} onclick={togglePlay}>
                  {playing ? '⏸' : '▶'}
                </button>
                <button type="button" class="ctrl-btn" aria-label="Следующий трек" onclick={() => stepTrack(1)} disabled={tracks.length <= 1}>⏭</button>
              </div>
            </div>
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
    width: 100%;
    padding: 14px 16px;
    border-radius: var(--bio-card-radius, 20px);
    background: color-mix(in srgb, var(--bio-card-color) 24%, rgba(27, 27, 27, 0.2));
    backdrop-filter: blur(var(--bio-card-blur, 10px));
    -webkit-backdrop-filter: blur(var(--bio-card-blur, 10px));
    border: var(--bio-border-w, 1px) solid var(--bio-border-color, rgba(255, 255, 255, 0.08));
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .audio-card.is-beat {
    animation: audioBeat 0.7s ease-in-out infinite;
  }
  .audio-row-main {
    display: flex;
    align-items: center;
    gap: 13px;
  }
  .audio-cover {
    width: 62px;
    height: 62px;
    border-radius: max(8px, calc(var(--bio-card-radius, 20px) - 10px));
    object-fit: cover;
    flex: none;
  }
  .audio-cover.fallback {
    display: grid;
    place-items: center;
    background: color-mix(in srgb, var(--bio-accent) 26%, transparent);
    font-weight: 700;
    font-size: 1.3rem;
  }
  .audio-right { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
  .audio-head { display: flex; align-items: baseline; gap: 6px; min-width: 0; text-align: left; }
  .audio-title {
    font-size: 1.05rem;
    font-weight: 500;
    color: var(--bio-slot-trackTitle, var(--bio-text));
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .audio-artist {
    font-size: 0.82rem;
    color: var(--bio-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .audio-controls { display: flex; align-items: center; gap: 4px; flex: none; }
  .ctrl-btn {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: color-mix(in srgb, var(--bio-text) 60%, transparent);
    cursor: pointer;
    display: grid;
    place-items: center;
    font-size: 0.9rem;
    padding: 0;
  }
  .ctrl-btn:disabled { opacity: 0.35; cursor: default; }
  .ctrl-btn.play-main {
    width: 32px;
    height: 32px;
    font-size: 1.1rem;
    color: var(--bio-text);
  }
  .audio-seek-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.74rem;
    color: var(--bio-text-muted);
    font-variant-numeric: tabular-nums;
    min-width: 0;
  }
  .audio-seek-row input[type="range"] {
    flex: 1;
    min-width: 0;
    width: 100%;
    accent-color: var(--bio-accent);
  }
  @media (max-width: 480px) {
    .audio-card { padding: 12px; }
    .audio-row-main { gap: 10px; }
    .audio-cover { width: 52px; height: 52px; }
    .audio-seek-row { gap: 5px; font-size: 0.7rem; }
    .ctrl-btn { width: 22px; height: 22px; font-size: 0.8rem; }
    .ctrl-btn.play-main { width: 28px; height: 28px; font-size: 0.96rem; }
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
