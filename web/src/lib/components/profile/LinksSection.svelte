<script lang="ts">
  import type { ProfileConfigV1, ProfileLinkItem } from '../../schema/profile';
  import { findPlatform } from '../../schema/icons';

  interface Props {
    profile: ProfileConfigV1;
    onTrackClick?: (linkId: string) => void;
    onNotify?: (msg: string) => void;
  }

  let { profile, onTrackClick, onNotify }: Props = $props();
  let confirmLink = $state<ProfileLinkItem | null>(null);

  const visibleLinks = $derived.by(() => {
    const items = profile.links.items.filter((i) => i.visible);
    if (!profile.links.randomizeOrder) return items;
    const pinned = items.filter((i) => i.pinned);
    const rest = items.filter((i) => !i.pinned);
    return [...pinned, ...rest];
  });

  async function activateLink(item: ProfileLinkItem, event: MouseEvent) {
    onTrackClick?.(item.id);
    if (item.mode === 'copy') {
      event.preventDefault();
      try {
        await navigator.clipboard.writeText(item.url);
        onNotify?.(`Скопировано: ${item.label}`);
      } catch {
        onNotify?.(item.url);
      }
      return;
    }
    if (item.is18Plus) {
      event.preventDefault();
      confirmLink = item;
    }
  }
</script>

{#if visibleLinks.length > 0}
  <div
    class="bio-links style-{profile.links.linkStyle} align-{profile.links.align}"
  >
    {#each visibleLinks as item (item.id)}
      {@const platform = findPlatform(item.platform)}
      {@const iconColor = profile.links.monochromeIcons ? profile.theme.iconColor : platform.color}
      {@const glow = profile.links.glowIcons ? item.glowColor || iconColor : 'transparent'}
      <a
        href={item.mode === 'copy' ? '#copy' : item.url || '#'}
        target={item.mode === 'link' ? '_blank' : undefined}
        rel={item.mode === 'link' ? 'noopener noreferrer' : undefined}
        class="bio-link-item ico-{profile.links.iconStyle}"
        style="--item-color:{iconColor}; --item-glow:{glow};"
        title={item.label}
        onclick={(e) => activateLink(item, e)}
      >
        <span class="link-icon-box">
          {#if item.customIconUrl}
            <img src={item.customIconUrl} alt="" class="custom-icon" />
          {:else}
            <svg viewBox={platform.viewBox ?? '0 0 24 24'} aria-hidden="true">
              <path d={platform.path} />
            </svg>
          {/if}
        </span>

        {#if profile.links.linkStyle !== 'icons'}
          <span class="link-text">
            <span class="link-title">{item.label || platform.label}</span>
            {#if item.subtitle && (profile.links.linkStyle === 'cards' || profile.links.linkStyle === 'minimal')}
              <span class="link-sub">{item.subtitle}</span>
            {/if}
          </span>
          {#if item.mode === 'copy'}
            <span class="link-chip">Копировать</span>
          {:else if item.is18Plus}
            <span class="link-chip warn">18+</span>
          {/if}
        {/if}
      </a>
    {/each}
  </div>
{/if}

{#if confirmLink}
  <div class="link-18-modal" role="dialog" aria-modal="true" aria-label="Предупреждение о переходе">
    <div class="link-18-card">
      <h3>Внешняя ссылка 18+</h3>
      <p>Вы переходите по ссылке «{confirmLink.label}» ({confirmLink.url}). Продолжить?</p>
      <div class="link-18-actions">
        <button type="button" class="btn-cancel" onclick={() => { confirmLink = null; }}>Отмена</button>
        <a
          href={confirmLink.url}
          target="_blank"
          rel="noopener noreferrer"
          class="btn-go"
          onclick={() => { confirmLink = null; }}
        >Открыть</a>
      </div>
    </div>
  </div>
{/if}

<style>
  .bio-links {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    width: 100%;
  }
  .bio-links.align-center { justify-content: center; }
  .bio-links.align-left { justify-content: flex-start; }
  .bio-links.align-right { justify-content: flex-end; }

  .bio-links.style-minimal,
  .bio-links.style-outline,
  .bio-links.style-cards {
    flex-direction: column;
  }

  .bio-link-item {
    display: inline-flex;
    align-items: center;
    gap: 11px;
    text-decoration: none;
    color: var(--bio-slot-linkTitle, var(--bio-text));
    transition: transform 0.16s ease, border-color 0.18s ease, background 0.18s ease;
    cursor: pointer;
  }
  .bio-link-item:hover {
    transform: translateY(-2px);
  }

  .link-icon-box {
    width: var(--bio-icon-size, 38px);
    height: var(--bio-icon-size, 38px);
    flex: none;
    display: grid;
    place-items: center;
    border-radius: 12px;
    color: var(--item-color);
    filter: drop-shadow(0 0 8px var(--item-glow));
  }
  .link-icon-box svg {
    width: 58%;
    height: 58%;
    fill: currentColor;
  }
  .custom-icon {
    width: 70%;
    height: 70%;
    object-fit: contain;
    border-radius: 6px;
  }

  .ico-soft .link-icon-box {
    background: color-mix(in srgb, var(--bio-text) 10%, transparent);
  }
  .ico-circle .link-icon-box {
    border-radius: 50%;
    background: color-mix(in srgb, var(--bio-text) 11%, transparent);
    border: 1px solid color-mix(in srgb, var(--bio-text) 18%, transparent);
  }
  .ico-outline .link-icon-box {
    border: 1px solid color-mix(in srgb, var(--item-color) 45%, transparent);
  }

  .style-pills .bio-link-item {
    padding: 6px 14px 6px 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--bio-text) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--bio-text) 14%, transparent);
  }
  .style-minimal .bio-link-item,
  .style-outline .bio-link-item,
  .style-cards .bio-link-item {
    width: 100%;
    padding: 10px 14px;
    border-radius: 14px;
    background: color-mix(in srgb, var(--bio-text) 6%, transparent);
    border: 1px solid color-mix(in srgb, var(--bio-text) 14%, transparent);
  }
  .style-outline .bio-link-item {
    background: transparent;
    border-color: color-mix(in srgb, var(--bio-accent) 48%, transparent);
  }
  .style-cards .bio-link-item {
    padding: 12px 16px;
    background: color-mix(in srgb, var(--bio-card-color) 65%, rgba(255, 255, 255, 0.06));
  }

  .link-text {
    display: flex;
    flex-direction: column;
    text-align: left;
    min-width: 0;
    flex: 1;
  }
  .link-title {
    font-weight: 600;
    font-size: 0.94rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .link-sub {
    font-size: 0.78rem;
    color: var(--bio-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .link-chip {
    font-size: 0.72rem;
    padding: 3px 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--bio-accent) 22%, transparent);
    color: var(--bio-text);
  }
  .link-chip.warn {
    background: rgba(244, 63, 94, 0.24);
    color: #fda4af;
  }

  .link-18-modal {
    position: fixed;
    inset: 0;
    z-index: 9400;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(8px);
    display: grid;
    place-items: center;
    padding: 20px;
  }
  .link-18-card {
    background: #12121a;
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 18px;
    padding: 20px;
    max-width: 380px;
    width: 100%;
  }
  .link-18-card h3 { margin: 0 0 8px; font-size: 1.05rem; }
  .link-18-card p { margin: 0 0 16px; font-size: 0.9rem; opacity: 0.8; word-break: break-word; }
  .link-18-actions { display: flex; justify-content: flex-end; gap: 10px; }
  .btn-cancel,
  .btn-go {
    padding: 8px 14px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: transparent;
    text-decoration: none;
    cursor: pointer;
  }
  .btn-go {
    background: var(--bio-accent);
    border-color: transparent;
    color: #fff;
  }
</style>
