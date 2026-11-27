<script lang="ts">
  import type { ProfileConfigV1 } from '../../schema/profile';
  import { BADGE_ICONS } from '../../schema/icons';
  import { computeProfileStyle } from '../../engine/themeCss';
  import { renderBioMarkup } from '../../engine/bioMarkdown';
  import { attachTilt } from '../../engine/effects/tilt';
  import { startAnimatedTitle, startScramble, startTypewriter } from '../../engine/effects/textEffects';
  import { playClickSound, startCursorTrail } from '../../engine/effects/cursorEngine';
  import SplashOverlay from './SplashOverlay.svelte';
  import BackgroundLayer from './BackgroundLayer.svelte';
  import ProfileAvatar from './ProfileAvatar.svelte';
  import LinksSection from './LinksSection.svelte';
  import AudioWidget from './AudioWidget.svelte';
  import BlocksSection from './BlocksSection.svelte';
  import TerminalView from './TerminalView.svelte';

  interface Props {
    profile: ProfileConfigV1;
    views: number;
    likes: number;
    isPreview?: boolean;
    onLike?: () => void;
    onLinkClick?: (linkId: string) => void;
  }

  let { profile, views, likes, isPreview = false, onLike, onLinkClick }: Props = $props();

  let entered = $state(false);
  let cardVisible = $state(true);
  let videoEl = $state<HTMLVideoElement | null>(null);
  let videoPlaying = $state(false);
  let videoFailed = $state(false);
  let cursorCanvas = $state<HTMLCanvasElement | null>(null);
  let cardEl = $state<HTMLElement | null>(null);
  let toastText = $state('');
  let toastTimer = 0;
  let likedLocal = $state(false);

  let renderedName = $state('');
  let renderedBio = $state('');
  let activeSection = $state(0);
  let audioVolume = $state(0.6);
  let audioMuted = $state(false);

  let nekoPos = $state({ x: 80, y: 80 });

  const computed = $derived(computeProfileStyle(profile));
  const needsSplash = $derived(
    !isPreview &&
      (profile.effects.splash.enabled || profile.meta.nsfwGate || Boolean(profile.meta.passcode))
  );

  $effect(() => {
    entered = !needsSplash;
  });

  $effect(() => {
    if (!entered) {
      cardVisible = false;
      return;
    }
    const delayMs = Math.max(0, profile.layout.cardDelaySec) * 1000;
    if (delayMs === 0) {
      cardVisible = true;
      return;
    }
    cardVisible = false;
    const id = window.setTimeout(() => { cardVisible = true; }, delayMs);
    return () => clearTimeout(id);
  });

  $effect(() => {
    videoFailed = false;
    videoPlaying =
      entered &&
      profile.effects.background.type === 'video' &&
      !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  });

  $effect(() => {
    if (profile.theme.customFontUrl && profile.theme.customFontName) {
      const styleId = 'bio-custom-font-face';
      let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = `@font-face { font-family: "${profile.theme.customFontName}"; src: url("${profile.theme.customFontUrl}"); font-display: swap; }`;
    }
  });

  $effect(() => {
    if (isPreview) return;
    return startAnimatedTitle(
      profile.meta.tabTitle || `@${profile.identity.username}`,
      profile.meta.animatedTabTitle
    );
  });

  $effect(() => {
    const baseName = profile.identity.displayName || profile.identity.username || 'bio';
    const fx = profile.effects.usernameEffect;
    if (fx === 'typewriter') {
      return startTypewriter(
        [baseName],
        profile.effects.typewriter.typeSpeed,
        profile.effects.typewriter.deleteSpeed,
        profile.effects.typewriter.loop,
        (t) => { renderedName = t; }
      );
    }
    if (fx === 'scramble') {
      return startScramble(baseName, (t) => { renderedName = t; });
    }
    renderedName = baseName;
  });

  $effect(() => {
    const fx = profile.effects.bioEffect;
    const baseBio = profile.identity.bio || '';
    if (fx === 'typewriter') {
      const phrases = profile.effects.typewriter.phrases.length
        ? profile.effects.typewriter.phrases
        : [baseBio];
      return startTypewriter(
        phrases,
        profile.effects.typewriter.typeSpeed,
        profile.effects.typewriter.deleteSpeed,
        profile.effects.typewriter.loop,
        (t) => { renderedBio = t; }
      );
    }
    if (fx === 'scramble') {
      return startScramble(baseBio, (t) => { renderedBio = t; });
    }
    renderedBio = baseBio;
  });

  $effect(() => {
    if (!cardEl || profile.layout.cardLayout === 'cinematic-split') return;
    return attachTilt(
      cardEl,
      profile.layout.tiltEnabled,
      profile.layout.tiltMode,
      profile.layout.tiltStrength
    );
  });

  $effect(() => {
    if (!cursorCanvas) return;
    return startCursorTrail(
      cursorCanvas,
      profile.effects.cursor.trail,
      profile.effects.cursor.trailColor || profile.theme.accent,
      profile.effects.cursor.trailSpeed
    );
  });

  $effect(() => {
    if (profile.effects.cursor.trail !== 'oneko-cat') return;
    const fine = window.matchMedia?.('(pointer: fine)').matches ?? true;
    if (!fine) return;
    let target = { x: 80, y: 80 };
    const onMove = (e: PointerEvent) => { target = { x: e.clientX + 16, y: e.clientY + 16 }; };
    window.addEventListener('pointermove', onMove, { passive: true });
    const id = window.setInterval(() => {
      nekoPos = {
        x: nekoPos.x + (target.x - nekoPos.x) * 0.16,
        y: nekoPos.y + (target.y - nekoPos.y) * 0.16
      };
    }, 30);
    return () => {
      window.removeEventListener('pointermove', onMove);
      clearInterval(id);
    };
  });

  function showToast(msg: string) {
    clearTimeout(toastTimer);
    toastText = msg;
    toastTimer = window.setTimeout(() => { toastText = ''; }, 3200);
  }

  function handleGlobalPointerDown() {
    if (profile.effects.cursor.clickSound !== 'none') {
      playClickSound(profile.effects.cursor.clickSound, profile.effects.cursor.clickVolume);
    }
  }

  const nameFxClass = $derived(
    profile.effects.usernameEffect === 'none' ? '' : `fx-${profile.effects.usernameEffect}`
  );
  const bioFxClass = $derived(
    profile.effects.bioEffect === 'none' ? '' : `fx-${profile.effects.bioEffect}`
  );
  const caretGlyph = $derived(
    profile.effects.typewriter.caret === 'block'
      ? '█'
      : profile.effects.typewriter.caret === 'underscore'
        ? '_'
        : profile.effects.typewriter.caret === 'none'
          ? ''
          : '|'
  );
  const cursorStyle = $derived(
    profile.effects.cursor.customUrl
      ? `cursor: url("${profile.effects.cursor.customUrl}") 16 16, auto;`
      : ''
  );

  const visibleBadges = $derived(profile.badges.items.filter((b) => b.visible));
  const viewsCorner = $derived(profile.layout.cornerWidgets.views);
  const audioCorner = $derived(profile.layout.cornerWidgets.audio);
  const isFloat = $derived(profile.layout.cardLayout === 'float');
  const isBento = $derived(profile.layout.cardLayout === 'bento');
  const isSplit = $derived(profile.layout.cardLayout === 'cinematic-split');
</script>

<svelte:window onpointerdown={handleGlobalPointerDown} />

<div
  class="bio-root {computed.wrapperClasses.join(' ')}"
  class:is-preview={isPreview}
  style="{computed.rootVars}; {cursorStyle}"
>
  <BackgroundLayer
    {profile}
    backgroundCss={computed.backgroundCss}
    washCss={computed.washCss}
    {videoPlaying}
    {videoFailed}
    onVideoRef={(el) => { videoEl = el; }}
    onVideoError={() => { videoFailed = true; videoPlaying = false; }}
  />

  <canvas bind:this={cursorCanvas} class="bio-cursor-canvas" aria-hidden="true"></canvas>

  {#if profile.effects.cursor.trail === 'oneko-cat'}
    <div
      class="oneko-cat"
      style="transform: translate3d({Math.round(nekoPos.x)}px, {Math.round(nekoPos.y)}px, 0);"
      aria-hidden="true"
    >
      🐱
    </div>
  {/if}

  {#if !entered}
    <SplashOverlay
      enabled={profile.effects.splash.enabled}
      style={profile.effects.splash.style}
      text={profile.effects.splash.text}
      subtitle={profile.effects.splash.subtitle}
      countdownSec={profile.effects.splash.countdownSec}
      nsfwGate={profile.meta.nsfwGate}
      passcode={profile.meta.passcode}
      passcodeHint={profile.meta.passcodeHint}
      onEnter={() => { entered = true; }}
    />
  {/if}

  <!-- Independent background video play/pause button when video bg active -->
  {#if profile.effects.background.type === 'video' && profile.effects.background.mediaUrl && !videoFailed}
    <div class="bio-corner top-right">
      <button
        type="button"
        class="bio-pill-chip video-toggle"
        aria-pressed={videoPlaying}
        onclick={() => { videoPlaying = !videoPlaying; }}
      >
        <span>{videoPlaying ? '⏸ Пауза фона' : '▶ Видеофон'}</span>
      </button>
    </div>
  {/if}

  <!-- Optional Corner Views / Likes Counter -->
  {#if (profile.analytics.showViewsBadge || profile.analytics.enableLikes) && viewsCorner !== 'inline' && viewsCorner !== 'card-bottom-left' && viewsCorner !== 'card-bottom-right' && viewsCorner !== 'hidden'}
    <div class="bio-corner {viewsCorner}">
      <div class="bio-pill-chip">
        {#if profile.analytics.showViewsBadge}
          <span>👁 {views.toLocaleString('en-US')}</span>
        {/if}
        {#if profile.analytics.enableLikes}
          <button
            type="button"
            class="like-btn"
            class:liked={likedLocal}
            onclick={() => { if (!likedLocal) { likedLocal = true; onLike?.(); } }}
            aria-label="Поставить лайк"
          >
            ♥ {likes + (likedLocal && isPreview ? 1 : 0)}
          </button>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Independent Corner Volume Button (outside transformed card/scale shell so fixed stays on viewport) -->
  {#if profile.audio.enabled && profile.audio.tracks.length > 0 && profile.audio.showCornerVolume && profile.audio.playerStyle !== 'volume-only' && profile.audio.playerStyle !== 'hidden'}
    <div class="corner-vol-dock" class:is-preview={isPreview}>
      <button type="button" class="corner-vol-btn" onclick={() => { audioMuted = !audioMuted; }} aria-label={audioMuted ? 'Включить звук' : 'Выключить звук'}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {#if audioMuted}
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.8 8.8 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a9 9 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
          {:else}
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          {/if}
        </svg>
      </button>
      <input
        type="range"
        class="corner-vol-range"
        min="0"
        max="1"
        step="0.02"
        value={audioMuted ? 0 : audioVolume}
        aria-label="Громкость музыки"
        oninput={(e) => { audioVolume = Number((e.target as HTMLInputElement).value); audioMuted = audioVolume === 0; }}
      />
    </div>
  {/if}

  <!-- Optional Corner Audio Player -->
  {#if profile.audio.enabled && profile.audio.tracks.length > 0 && audioCorner !== 'inline' && audioCorner !== 'detached' && audioCorner !== 'hidden'}
    <div class="bio-corner {audioCorner}">
      <AudioWidget {profile} {entered} {videoEl} bind:volume={audioVolume} bind:muted={audioMuted} />
    </div>
  {/if}

  {#if cardVisible}
    <main class="bio-stage">
      {#if isSplit}
        <div class="bio-split-grid">
          <div class="bio-split-scene" aria-hidden="true"></div>
          <div class="bio-split-content">
            <div class="bio-scale-shell bio-animate-target">
              {@render mainCardContent()}
            </div>
          </div>
        </div>
      {:else if profile.layout.pageMode === 'sections'}
        <div class="bio-sections-wrap" class:is-snap={profile.layout.sectionMode.snap}>
          {#if profile.layout.sectionMode.dotsSide !== 'hidden'}
            <nav class="sec-dots side-{profile.layout.sectionMode.dotsSide}" aria-label="Секции профиля">
              <button type="button" class:active={activeSection === 0} aria-label="Профиль" onclick={() => { activeSection = 0; document.getElementById('bio-sec-0')?.scrollIntoView({ behavior: 'smooth' }); }}></button>
              <button type="button" class:active={activeSection === 1} aria-label="Блоки и ссылки" onclick={() => { activeSection = 1; document.getElementById('bio-sec-1')?.scrollIntoView({ behavior: 'smooth' }); }}></button>
            </nav>
          {/if}
          <section id="bio-sec-0" class="bio-sec">
            <div class="bio-scale-shell bio-animate-target" style={profile.layout.sectionMode.wide ? '--bio-card-w:840px' : undefined}>
              {@render mainCardContent(true)}
            </div>
            {#if profile.layout.sectionMode.scrollHint}
              <a href="#bio-sec-1" class="sec-hint" onclick={() => { activeSection = 1; }}>{profile.layout.sectionMode.scrollHint} ↓</a>
            {/if}
          </section>
          <section id="bio-sec-1" class="bio-sec">
            <div class="bio-scale-shell" style={profile.layout.sectionMode.wide ? '--bio-card-w:860px' : undefined}>
              <div class="bio-card" style="background:{computed.cardSurfaceCss}">
                <div class="bio-card-inner">
                  <LinksSection {profile} onTrackClick={onLinkClick} onNotify={showToast} />
                  <BlocksSection blocks={profile.blocks} bentoGrid={true} />
                </div>
              </div>
            </div>
          </section>
        </div>
      {:else if profile.layout.pageMode === 'terminal'}
        <div class="bio-scale-shell bio-animate-target">
          <TerminalView {profile} {views} {likes} />
        </div>
      {:else}
        <div class="bio-scale-shell bio-animate-target">
          {@render mainCardContent()}
          {#if audioCorner === 'detached' && profile.audio.enabled && profile.audio.tracks.length > 0}
            <div class="detached-audio-wrap">
              <AudioWidget {profile} {entered} {videoEl} bind:volume={audioVolume} bind:muted={audioMuted} />
            </div>
          {/if}
        </div>
      {/if}

      {#if profile.meta.showBrandingFooter}
        <footer class="bio-footer-note">Powered by bio</footer>
      {/if}
    </main>
  {/if}

  {#if toastText}
    <div class="bio-toast" role="status">{toastText}</div>
  {/if}
</div>

{#snippet identityBlock()}
  {#if profile.avatar.bannerUrl}
    <div class="bio-banner" class:has-cutout={profile.avatar.bannerAvatarCutout}>
      <img src={profile.avatar.bannerUrl} alt="" />
    </div>
  {/if}

  <header class="bio-header">
    <ProfileAvatar {profile} />
    <div class="id-text">
      <div class="id-title-row">
        {#if profile.effects.usernameEffect === 'wave'}
          <h1 class="bio-name {nameFxClass}">
            {#each (profile.identity.displayName || profile.identity.username).split('') as ch, idx}
              <span class="bio-wave-ch" style="--i:{idx}">{ch === ' ' ? '\u00A0' : ch}</span>
            {/each}
          </h1>
        {:else}
          <h1 class="bio-name {nameFxClass}" class:extra-glow={profile.effects.extraNameGlow}>
            {renderedName}
            {#if profile.effects.usernameEffect === 'typewriter' && caretGlyph}
              <span class="bio-caret">{caretGlyph}</span>
            {/if}
          </h1>
        {/if}

        {#if profile.identity.verified.enabled}
          <span class="verified-mark" style="color:{profile.identity.verified.color}" title="Подтверждён">✔</span>
        {/if}

        {#if profile.badges.placement === 'next-to-name' && visibleBadges.length > 0}
          {@render badgesRow()}
        {/if}
      </div>

      <div class="id-sub-meta">
        {#if profile.identity.showUsername}
          <span>@{profile.identity.username}</span>
        {/if}
        {#if profile.identity.pronounsLeft || profile.identity.pronounsRight}
          <span>· {[profile.identity.pronounsLeft, profile.identity.pronounsRight].filter(Boolean).join('/')}</span>
        {/if}
        {#if profile.identity.location}
          <span>· 📍 {profile.identity.location}</span>
        {/if}
        {#if profile.identity.showUid}
          <span>· UID #{profile.identity.uid}</span>
        {/if}
        {#if profile.identity.showJoinDate && profile.identity.joinDate}
          <span>· С {profile.identity.joinDate}</span>
        {/if}
      </div>

      {#if profile.identity.status}
        <div class="id-status">● {profile.identity.status}</div>
      {/if}
    </div>
  </header>

  {#if profile.badges.placement === 'below-name' && visibleBadges.length > 0}
    {@render badgesRow()}
  {/if}

  {#if profile.identity.bio}
    {#if profile.effects.bioEffect === 'wave'}
      <p class="bio-copy {bioFxClass}">
        {#each profile.identity.bio.split('') as ch, idx}
          <span class="bio-wave-ch" style="--i:{idx}">{ch === ' ' ? '\u00A0' : ch}</span>
        {/each}
      </p>
    {:else if profile.effects.bioEffect === 'typewriter' || profile.effects.bioEffect === 'scramble'}
      <p class="bio-copy {bioFxClass}">
        {renderedBio}{#if profile.effects.bioEffect === 'typewriter' && caretGlyph}<span class="bio-caret">{caretGlyph}</span>{/if}
      </p>
    {:else}
      <p class="bio-copy {bioFxClass}">{@html renderBioMarkup(profile.identity.bio)}</p>
    {/if}
  {/if}

  {#if profile.identity.tags.length > 0}
    <div class="ptags align-{profile.identity.tagAlign}">
      {#each profile.identity.tags as tag}
        <span class="ptag">{tag}</span>
      {/each}
    </div>
  {/if}
{/snippet}

{#snippet badgesRow()}
  <div
    class="badges-wrap box-{profile.badges.boxStyle}"
    class:is-glow={profile.badges.glow}
    style="transform: scale(var(--bio-badge-scale, 1));"
  >
    {#each visibleBadges as badge (badge.id)}
      {@const col = profile.badges.monochrome ? profile.theme.iconColor : badge.color}
      <span class="badge-pill" title={badge.label} style="color:{col}">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d={BADGE_ICONS[badge.icon] ?? BADGE_ICONS.star} />
        </svg>
        <span class="badge-label">{badge.label}</span>
      </span>
    {/each}
  </div>
{/snippet}

{#snippet mainCardContent(heroOnly = false)}
  {#if isFloat}
    <div bind:this={cardEl} class="bio-float-stack">
      <section class="bio-island" style="background:{computed.cardSurfaceCss}">
        <div class="bio-card-inner">{@render identityBlock()}</div>
      </section>
      {#if !heroOnly && profile.links.items.some((i) => i.visible)}
        <section class="bio-island" style="background:{computed.cardSurfaceCss}">
          <LinksSection {profile} onTrackClick={onLinkClick} onNotify={showToast} />
        </section>
      {/if}
      {#if !heroOnly && profile.blocks.some((b) => b.visible)}
        <section class="bio-island" style="background:{computed.cardSurfaceCss}">
          <BlocksSection blocks={profile.blocks} />
        </section>
      {/if}
    </div>
  {:else}
    <article
      bind:this={cardEl}
      class="bio-card"
      class:has-card-views={(profile.analytics.showViewsBadge || profile.analytics.enableLikes) && (viewsCorner === 'card-bottom-left' || viewsCorner === 'card-bottom-right')}
      style="background:{computed.cardSurfaceCss}"
    >
      <div class="bio-card-inner">
        {@render identityBlock()}

        {#if !heroOnly}
          {#if profile.layout.blocksBeforeLinks}
            <BlocksSection blocks={profile.blocks} bentoGrid={isBento} />
            <LinksSection {profile} onTrackClick={onLinkClick} onNotify={showToast} />
          {:else}
            <LinksSection {profile} onTrackClick={onLinkClick} onNotify={showToast} />
            <BlocksSection blocks={profile.blocks} bentoGrid={isBento} />
          {/if}
          {#if audioCorner === 'inline' && profile.audio.enabled && profile.audio.tracks.length > 0}
            <div class="inline-audio"><AudioWidget {profile} {entered} {videoEl} bind:volume={audioVolume} bind:muted={audioMuted} /></div>
          {/if}
        {/if}

        {#if viewsCorner === 'inline' && (profile.analytics.showViewsBadge || profile.analytics.enableLikes)}
          <div class="inline-stats">
            {#if profile.analytics.showViewsBadge}<span>👁 {views.toLocaleString('en-US')}</span>{/if}
            {#if profile.analytics.enableLikes}
              <button type="button" class="like-btn" class:liked={likedLocal} onclick={() => { if (!likedLocal) { likedLocal = true; onLike?.(); } }}>
                ♥ {likes + (likedLocal && isPreview ? 1 : 0)}
              </button>
            {/if}
          </div>
        {/if}
      </div>

      {#if (profile.analytics.showViewsBadge || profile.analytics.enableLikes) && (viewsCorner === 'card-bottom-left' || viewsCorner === 'card-bottom-right')}
        <div class="card-corner-views {viewsCorner}">
          {#if profile.analytics.showViewsBadge}<span>👁 {views.toLocaleString('en-US')}</span>{/if}
          {#if profile.analytics.enableLikes}
            <button type="button" class="like-btn" class:liked={likedLocal} onclick={() => { if (!likedLocal) { likedLocal = true; onLike?.(); } }}>
              ♥ {likes + (likedLocal && isPreview ? 1 : 0)}
            </button>
          {/if}
        </div>
      {/if}
    </article>
  {/if}
{/snippet}

<style>
  .id-text { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
  .id-title-row { display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; }
  .bio-layout-compact .id-title-row,
  .bio-layout-horizon .id-title-row,
  .bio-layout-dock-bottom-left .id-title-row { justify-content: flex-start; }

  .verified-mark { font-size: 1rem; font-weight: 800; }
  .id-sub-meta {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 5px;
    font-size: 0.82rem;
    color: var(--bio-slot-location, var(--bio-text-muted));
  }
  .bio-layout-compact .id-sub-meta,
  .bio-layout-horizon .id-sub-meta,
  .bio-layout-dock-bottom-left .id-sub-meta { justify-content: flex-start; }

  .id-status { font-size: 0.8rem; color: var(--bio-accent); font-weight: 500; }

  .ptags { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
  .ptags.align-left { justify-content: flex-start; }
  .ptags.align-right { justify-content: flex-end; }
  .ptag {
    font-size: 0.76rem;
    padding: 3px 10px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--bio-accent) 16%, transparent);
    border: 1px solid color-mix(in srgb, var(--bio-accent) 30%, transparent);
  }

  .badges-wrap { display: inline-flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
  .badges-wrap.box-one-box {
    padding: 5px 10px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--bio-text) 7%, transparent);
    border: 1px solid color-mix(in srgb, var(--bio-text) 14%, transparent);
  }
  .badge-pill { display: inline-flex; align-items: center; gap: 4px; font-size: 0.75rem; font-weight: 600; }
  .badges-wrap.box-each-box .badge-pill {
    padding: 4px 8px;
    border-radius: 8px;
    background: color-mix(in srgb, var(--bio-text) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--bio-text) 14%, transparent);
  }
  .badge-pill svg { width: 14px; height: 14px; fill: currentColor; }
  .badges-wrap.is-glow .badge-pill svg { filter: drop-shadow(0 0 6px var(--bio-badge-glow)); }
  .badge-label { color: var(--bio-text); font-size: 0.72rem; }

  .detached-audio-wrap, .inline-audio { display: flex; justify-content: center; margin-top: 15px; width: 100%; }
  .inline-stats { display: flex; justify-content: center; gap: 14px; font-size: 0.82rem; color: var(--bio-text-muted); }
  .card-corner-views {
    position: absolute;
    bottom: 12px;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-size: 0.86rem;
    font-weight: 550;
    color: var(--bio-text);
  }
  .card-corner-views.card-bottom-left { left: 16px; }
  .card-corner-views.card-bottom-right { right: 16px; }

  .corner-vol-dock {
    position: fixed;
    top: max(15px, env(safe-area-inset-top));
    left: max(15px, env(safe-area-inset-left));
    z-index: 25;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 56px;
    width: 56px;
    padding: 12px;
    overflow: hidden;
    border-radius: 15px;
    background: rgba(27, 27, 27, 0.22);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 2px solid rgba(255, 255, 255, 0.08);
    transition: width 0.25s ease;
  }
  .corner-vol-dock.is-preview { position: absolute; }
  .corner-vol-dock:hover,
  .corner-vol-dock:focus-within { width: 164px; }
  .corner-vol-btn {
    width: 28px;
    height: 28px;
    flex: none;
    border: none;
    background: transparent;
    padding: 0;
    cursor: pointer;
    display: grid;
    place-items: center;
    color: var(--bio-text);
  }
  .corner-vol-btn svg { width: 24px; height: 24px; fill: currentColor; }
  .corner-vol-range { width: 92px; accent-color: var(--bio-text); }
  .like-btn { background: transparent; border: none; padding: 0; cursor: pointer; font-weight: 600; }
  .like-btn.liked { color: #fb7185; }

  .video-toggle { cursor: pointer; font-weight: 600; }

  .bio-sections-wrap { width: 100%; }
  .bio-sec { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; position: relative; }
  .sec-dots { position: fixed; top: 50%; transform: translateY(-50%); z-index: 30; display: flex; flex-direction: column; gap: 10px; }
  .sec-dots.side-right { right: 18px; }
  .sec-dots.side-left { left: 18px; }
  .sec-dots button { width: 10px; height: 10px; border-radius: 50%; border: none; background: rgba(255, 255, 255, 0.35); cursor: pointer; padding: 0; }
  .sec-dots button.active { background: var(--bio-accent); transform: scale(1.25); }
  .sec-hint { color: var(--bio-text-muted); text-decoration: none; font-size: 0.86rem; }

  .oneko-cat {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 9997;
    pointer-events: none;
    font-size: 22px;
    line-height: 1;
    filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.45));
  }

  .bio-toast {
    position: fixed;
    bottom: 22px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9600;
    padding: 9px 16px;
    border-radius: 999px;
    background: rgba(15, 15, 24, 0.9);
    border: 1px solid var(--bio-accent);
    color: #fff;
    font-size: 0.86rem;
  }

  .bio-footer-note {
    font-size: 0.76rem;
    color: var(--bio-text-subtle);
    margin-top: 8px;
  }
</style>
