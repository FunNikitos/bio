<script lang="ts">
  import type { ProfileConfigV1 } from '../../schema/profile';

  interface Props {
    profile: ProfileConfigV1;
    pulseLevel?: number;
  }

  let { profile, pulseLevel = 0 }: Props = $props();
  let expanded = $state(false);

  const av = $derived(profile.avatar);
  const initials = $derived(
    (profile.identity.displayName || profile.identity.username || 'B').trim().slice(0, 2).toUpperCase()
  );
</script>

{#if av.visible}
  <div class="bio-avatar-wrap" style={pulseLevel > 0 ? `--pulse:${pulseLevel}` : undefined}>
    {#if av.decoration !== 'none'}
      <div class="av-deco av-deco-{av.decoration}" aria-hidden="true">
        {#if av.decoration === 'custom' && av.customDecorationUrl}
          <img src={av.customDecorationUrl} alt="" />
        {:else if av.decoration === 'aurora-halo'}
          <span class="deco-ring"></span>
        {:else if av.decoration === 'angel-wings'}
          <span class="deco-wing left"></span><span class="deco-wing right"></span>
        {:else if av.decoration === 'kitty-ears'}
          <span class="deco-ear left"></span><span class="deco-ear right"></span>
        {:else if av.decoration === 'neon-headphones'}
          <span class="deco-phones"></span>
        {:else if av.decoration === 'sakura-crown'}
          <span class="deco-sakura">✿ ✿ ✿</span>
        {:else if av.decoration === 'frost-crown'}
          <span class="deco-frost">❄ ✦ ❄</span>
        {/if}
      </div>
    {/if}

    <button
      type="button"
      class="av-frame bio-av-{av.shape} bio-ring-{av.frameStyle}"
      class:is-clickable={av.expandOnClick && Boolean(av.url)}
      aria-label={av.expandOnClick ? 'Увеличить аватар' : 'Аватар профиля'}
      oncontextmenu={(e) => { if (av.protectImage) e.preventDefault(); }}
      onclick={() => { if (av.expandOnClick && av.url) expanded = true; }}
    >
      {#if av.url}
        <img
          src={av.url}
          alt={profile.identity.displayName || profile.identity.username}
          class="bio-avatar-img"
          draggable={!av.protectImage}
        />
      {:else}
        <span class="bio-avatar-fallback">{initials}</span>
      {/if}
    </button>
  </div>
{/if}

{#if expanded && av.url}
  <div class="av-lightbox" role="dialog" aria-modal="true" aria-label="Увеличенный аватар">
    <button type="button" class="av-lightbox-bg" aria-label="Закрыть" onclick={() => { expanded = false; }}></button>
    <img src={av.url} alt={profile.identity.displayName} class="av-lightbox-img" />
    <button type="button" class="av-lightbox-close" onclick={() => { expanded = false; }}>✕</button>
  </div>
{/if}

<style>
  .av-frame {
    width: 100%;
    height: 100%;
    padding: 0;
    background: transparent;
    border: none;
    position: relative;
    z-index: 2;
    cursor: default;
  }
  .av-frame.is-clickable {
    cursor: zoom-in;
  }
  .av-deco {
    position: absolute;
    inset: -12px;
    pointer-events: none;
    z-index: 3;
    display: grid;
    place-items: center;
  }
  .av-deco.av-deco-custom {
    inset: unset;
    width: 116%;
    height: 116%;
    left: -8%;
    top: -7%;
  }
  .av-deco img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .deco-ring {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2px dashed color-mix(in srgb, var(--bio-accent) 70%, transparent);
    animation: spinSlow 14s linear infinite;
  }
  .deco-ear {
    position: absolute;
    top: -2px;
    width: 24px;
    height: 24px;
    background: linear-gradient(135deg, var(--bio-accent), var(--bio-grad));
    clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  }
  .deco-ear.left { left: 14%; transform: rotate(-18deg); }
  .deco-ear.right { right: 14%; transform: rotate(18deg); }
  .deco-wing {
    position: absolute;
    top: 22%;
    width: 28px;
    height: 46px;
    border: 2px solid rgba(255, 255, 255, 0.7);
    border-radius: 60% 20% 60% 20%;
    filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.45));
  }
  .deco-wing.left { left: -14px; transform: rotate(-14deg); }
  .deco-wing.right { right: -14px; transform: scaleX(-1) rotate(-14deg); }
  .deco-phones {
    position: absolute;
    inset: 2px;
    border-top: 4px solid var(--bio-accent);
    border-radius: 50% 50% 0 0;
    filter: drop-shadow(0 0 8px var(--bio-accent));
  }
  .deco-sakura,
  .deco-frost {
    position: absolute;
    top: -6px;
    font-size: 15px;
    letter-spacing: 3px;
    text-shadow: 0 0 10px var(--bio-accent);
  }
  .deco-sakura { color: #f9a8d4; }
  .deco-frost { color: #bae6fd; }

  .av-lightbox {
    position: fixed;
    inset: 0;
    z-index: 9500;
    display: grid;
    place-items: center;
    padding: 24px;
  }
  .av-lightbox-bg {
    position: absolute;
    inset: 0;
    border: none;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    cursor: zoom-out;
  }
  .av-lightbox-img {
    position: relative;
    z-index: 2;
    max-width: min(90vw, 460px);
    max-height: 82vh;
    border-radius: 20px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
  }
  .av-lightbox-close {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 3;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: rgba(20, 20, 28, 0.85);
    cursor: pointer;
  }
  @keyframes spinSlow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
