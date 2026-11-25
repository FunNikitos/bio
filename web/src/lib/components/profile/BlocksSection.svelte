<script lang="ts">
  import type { ContentBlock } from '../../schema/profile';

  interface Props {
    blocks: ContentBlock[];
    bentoGrid?: boolean;
  }

  let { blocks, bentoGrid = false }: Props = $props();
  let now = $state(new Date());
  let openFaq = $state<Record<string, boolean>>({});

  $effect(() => {
    const hasClock = blocks.some((b) => b.visible && b.type === 'clock');
    if (!hasClock) return;
    const id = window.setInterval(() => { now = new Date(); }, 15000);
    return () => clearInterval(id);
  });

  function formatClock(tz: string, hour12: boolean): { time: string; offsetText: string } {
    try {
      const time = new Intl.DateTimeFormat('ru-RU', {
        timeZone: tz || 'UTC',
        hour: '2-digit',
        minute: '2-digit',
        hour12
      }).format(now);
      const ownerDate = new Date(now.toLocaleString('en-US', { timeZone: tz || 'UTC' }));
      const diffHours = Math.round((ownerDate.getTime() - now.getTime()) / 3600000);
      const offsetText = diffHours === 0 ? 'как у вас' : `${diffHours > 0 ? '+' : ''}${diffHours} ч от вашего`;
      return { time, offsetText };
    } catch {
      return { time: now.toLocaleTimeString(), offsetText: tz };
    }
  }
</script>

{#if blocks.some((b) => b.visible)}
  <div class="blocks-wrap" class:is-bento={bentoGrid}>
    {#each blocks.filter((b) => b.visible) as block (block.id)}
      {#if block.type === 'divider'}
        <div class="blk-divider style-{block.style}" aria-hidden="true"></div>
      {:else}
        <section class="blk-card">
          {#if block.type === 'clock'}
            {@const info = formatClock(block.timezone, block.hour12)}
            <div class="blk-clock">
              <div>
                <div class="blk-title">{block.title || block.label}</div>
                <div class="blk-muted">{block.timezone} · {info.offsetText}</div>
              </div>
              <div class="clock-time">{info.time}</div>
            </div>
          {:else if block.type === 'discord'}
            <div class="blk-discord" style="--dc-banner:{block.bannerColor || '#5865f2'}">
              <div class="dc-head">
                {#if block.avatarUrl}
                  <img src={block.avatarUrl} alt="" class="dc-av" />
                {:else}
                  <div class="dc-av fallback">{(block.displayName || block.username || 'D').slice(0, 1).toUpperCase()}</div>
                {/if}
                <div class="dc-meta">
                  <div class="dc-name">
                    {block.displayName || block.username}
                    {#if block.guildTag}
                      <span class="dc-tag">{block.guildTag}</span>
                    {/if}
                  </div>
                  <div class="blk-muted">@{block.username} · {block.status}</div>
                  {#if block.activity}
                    <div class="dc-act">{block.activity}</div>
                  {/if}
                </div>
              </div>
            </div>
          {:else if block.type === 'setup'}
            <div class="blk-title">{block.title}</div>
            {#if block.photoUrl}
              <img src={block.photoUrl} alt={block.title} class="blk-photo" />
            {/if}
            <ul class="blk-list">
              {#each block.items as item (item.id)}
                <li>
                  <span class="cat-badge">{item.category}</span>
                  <div class="item-body">
                    {#if item.url}
                      <a href={item.url} target="_blank" rel="noopener noreferrer">{item.name}</a>
                    {:else}
                      <strong>{item.name}</strong>
                    {/if}
                    {#if item.details}<span class="blk-muted"> — {item.details}</span>{/if}
                  </div>
                </li>
              {/each}
            </ul>
          {:else if block.type === 'games'}
            <div class="blk-title">{block.title}</div>
            <div class="games-row">
              {#each block.items as g (g.id)}
                <span class="game-pill"><strong>{g.name}</strong>{#if g.handle}<span> · {g.handle}</span>{/if}</span>
              {/each}
            </div>
          {:else if block.type === 'gallery'}
            <div class="blk-title">{block.title}</div>
            <div class="gal-grid cols-{block.columns}">
              {#each block.items as g (g.id)}
                <figure class="gal-item">
                  {#if g.url}<img src={g.url} alt={g.title || 'Фото'} />{/if}
                  {#if g.title}<figcaption>{g.title}</figcaption>{/if}
                </figure>
              {/each}
            </div>
          {:else if block.type === 'faq'}
            <div class="blk-title">{block.title}</div>
            <div class="faq-list">
              {#each block.items as f (f.id)}
                <div class="faq-row">
                  <button type="button" class="faq-q" onclick={() => { openFaq[f.id] = !openFaq[f.id]; }}>
                    <span>{f.question}</span><span>{openFaq[f.id] ? '−' : '+'}</span>
                  </button>
                  {#if openFaq[f.id]}
                    <p class="faq-a">{f.answer}</p>
                  {/if}
                </div>
              {/each}
            </div>
          {:else if block.type === 'quote'}
            <blockquote class="blk-quote">
              «{block.text}»
              {#if block.author}<footer>— {block.author}</footer>{/if}
            </blockquote>
          {:else if block.type === 'callout'}
            <div class="blk-callout tone-{block.tone}">
              {#if block.title}<div class="blk-title">{block.title}</div>{/if}
              <p>{block.text}</p>
            </div>
          {:else if block.type === 'text'}
            <div style="text-align:{block.align};">
              {#if block.title}<div class="blk-title">{block.title}</div>{/if}
              <p class="blk-text-body">{block.body}</p>
            </div>
          {/if}
        </section>
      {/if}
    {/each}
  </div>
{/if}

<style>
  .blocks-wrap {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }
  .blocks-wrap.is-bento {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  @media (max-width: 720px) {
    .blocks-wrap.is-bento { grid-template-columns: 1fr; }
  }
  .blk-card {
    padding: 14px 16px;
    border-radius: calc(var(--bio-card-radius, 20px) * 0.72);
    background: color-mix(in srgb, var(--bio-text) 6%, transparent);
    border: 1px solid color-mix(in srgb, var(--bio-text) 12%, transparent);
    text-align: left;
  }
  .blk-title { font-weight: 700; font-size: 0.92rem; margin-bottom: 6px; }
  .blk-muted { font-size: 0.8rem; color: var(--bio-text-muted); }
  .blk-clock { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .clock-time { font-size: 1.45rem; font-weight: 800; font-variant-numeric: tabular-nums; color: var(--bio-accent); }

  .dc-head { display: flex; align-items: center; gap: 12px; }
  .dc-av { width: 46px; height: 46px; border-radius: 50%; object-fit: cover; flex: none; }
  .dc-av.fallback { display: grid; place-items: center; background: var(--dc-banner); font-weight: 700; color: #fff; }
  .dc-name { font-weight: 700; font-size: 0.95rem; display: flex; align-items: center; gap: 6px; }
  .dc-tag { font-size: 0.7rem; padding: 1px 7px; border-radius: 6px; background: color-mix(in srgb, var(--bio-accent) 25%, transparent); }
  .dc-act { font-size: 0.82rem; margin-top: 2px; }

  .blk-photo { width: 100%; max-height: 180px; object-fit: cover; border-radius: 10px; margin-bottom: 8px; }
  .blk-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
  .blk-list li { display: flex; align-items: baseline; gap: 8px; font-size: 0.86rem; }
  .cat-badge {
    font-size: 0.7rem;
    padding: 2px 7px;
    border-radius: 6px;
    background: color-mix(in srgb, var(--bio-accent) 20%, transparent);
    white-space: nowrap;
  }
  .item-body a { color: var(--bio-accent); }

  .games-row { display: flex; flex-wrap: wrap; gap: 7px; }
  .game-pill {
    font-size: 0.82rem;
    padding: 5px 10px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--bio-text) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--bio-text) 12%, transparent);
  }
  .gal-grid { display: grid; gap: 8px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .gal-grid.cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .gal-item { margin: 0; }
  .gal-item img { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; border-radius: 8px; display: block; }
  .gal-item figcaption { font-size: 0.76rem; color: var(--bio-text-muted); margin-top: 4px; }

  .faq-list { display: flex; flex-direction: column; gap: 6px; }
  .faq-q {
    width: 100%;
    display: flex;
    justify-content: space-between;
    background: transparent;
    border: none;
    padding: 6px 0;
    font-weight: 600;
    cursor: pointer;
    text-align: left;
  }
  .faq-a { margin: 2px 0 6px; font-size: 0.86rem; color: var(--bio-text-muted); }
  .blk-quote { margin: 0; font-style: italic; font-size: 0.94rem; }
  .blk-quote footer { margin-top: 6px; font-style: normal; font-size: 0.8rem; color: var(--bio-text-muted); }
  .blk-callout { padding: 10px 12px; border-left: 3px solid var(--bio-accent); border-radius: 6px; }
  .blk-callout.tone-warn { border-left-color: #f59e0b; }
  .blk-callout p, .blk-text-body { margin: 0; font-size: 0.88rem; line-height: 1.5; white-space: pre-wrap; }

  .blk-divider { height: 1px; width: 100%; background: color-mix(in srgb, var(--bio-text) 20%, transparent); margin: 4px 0; }
  .blk-divider.style-gradient { background: linear-gradient(90deg, transparent, var(--bio-accent), transparent); }
  .blk-divider.style-dashed { background: transparent; border-top: 1px dashed color-mix(in srgb, var(--bio-text) 25%, transparent); }
  .blk-divider.style-glow { background: var(--bio-accent); box-shadow: 0 0 10px var(--bio-accent); }
</style>
