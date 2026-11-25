<script lang="ts">
  import type { ProfileConfigV1 } from '../../schema/profile';
  import { startParticleCanvas } from '../../engine/effects/canvasParticles';

  interface Props {
    profile: ProfileConfigV1;
    backgroundCss: string;
    washCss: string;
    videoPlaying: boolean;
    videoFailed: boolean;
    onVideoRef?: (el: HTMLVideoElement | null) => void;
    onVideoError?: () => void;
  }

  let {
    profile,
    backgroundCss,
    washCss,
    videoPlaying,
    videoFailed,
    onVideoRef,
    onVideoError
  }: Props = $props();

  let canvasEl = $state<HTMLCanvasElement | null>(null);
  let videoEl = $state<HTMLVideoElement | null>(null);

  $effect(() => {
    onVideoRef?.(videoEl);
  });

  $effect(() => {
    if (!videoEl) return;
    videoEl.muted = profile.effects.background.videoMuted;
    if (videoPlaying) {
      void videoEl.play().catch(() => {});
    } else {
      videoEl.pause();
    }
  });

  $effect(() => {
    if (!canvasEl) return;
    return startParticleCanvas(
      canvasEl,
      profile.effects.background.particleEffect,
      profile.theme.fx1,
      profile.theme.fx2,
      profile.effects.background.particleIntensity
    );
  });

  const bg = $derived(profile.effects.background);
</script>

<div class="bio-bg-layer" style="background: {backgroundCss};">
  {#if bg.type === 'image' && bg.mediaUrl}
    <img
      src={bg.mediaUrl}
      alt=""
      aria-hidden="true"
      class="bio-bg-media {bg.fit === 'contain' ? 'fit-contain' : 'fit-cover'}"
    />
  {:else if bg.type === 'video' && bg.mediaUrl && !videoFailed}
    <video
      bind:this={videoEl}
      src={bg.mediaUrl}
      poster={bg.posterUrl || undefined}
      muted={bg.videoMuted}
      playsinline
      loop
      preload="metadata"
      aria-hidden="true"
      class="bio-bg-media bio-bg-video {bg.fit === 'contain' ? 'fit-contain' : 'fit-cover'}"
      onerror={() => onVideoError?.()}
    ></video>
  {:else if bg.type === 'video' && bg.posterUrl}
    <img
      src={bg.posterUrl}
      alt=""
      aria-hidden="true"
      class="bio-bg-media {bg.fit === 'contain' ? 'fit-contain' : 'fit-cover'}"
    />
  {/if}

  <div class="bio-bg-dim"></div>
  {#if washCss !== 'none'}
    <div class="bio-bg-wash" style="background: {washCss};"></div>
  {/if}
  <div class="bio-bg-filter"></div>
</div>

<canvas bind:this={canvasEl} class="bio-fx-canvas" aria-hidden="true"></canvas>
