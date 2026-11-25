<script lang="ts">
  import type { ProfileConfigV1 } from '../../schema/profile';

  interface Props {
    profile: ProfileConfigV1;
    views: number;
    likes: number;
  }

  let { profile, views, likes }: Props = $props();
  let cmdInput = $state('');
  let history = $state<Array<{ cmd: string; lines: string[] }>>([]);

  const prompt = $derived(`${profile.layout.terminalMode.promptName || profile.identity.username || 'guest'}@bio:~$`);

  const introLines = $derived([
    `Name: ${profile.identity.displayName} (@${profile.identity.username})`,
    profile.identity.bio ? `Bio: ${profile.identity.bio}` : '',
    profile.identity.location ? `Location: ${profile.identity.location}` : '',
    `Links: ${profile.links.items.filter((i) => i.visible).length} · Commands: help, about, socials, stats, clear`
  ].filter(Boolean));

  function runCommand() {
    const raw = cmdInput.trim();
    if (!raw) return;
    const cmd = raw.toLowerCase();
    cmdInput = '';

    if (cmd === 'clear') {
      history = [];
      return;
    }

    let lines: string[];
    if (cmd === 'help') {
      lines = ['Доступные команды: help, about, socials, stats, clear'];
    } else if (cmd === 'about') {
      lines = [
        `${profile.identity.displayName} (UID #${profile.identity.uid})`,
        profile.identity.bio || 'Описание не задано',
        profile.identity.tags.length ? `Tags: ${profile.identity.tags.join(', ')}` : ''
      ].filter(Boolean);
    } else if (cmd === 'socials') {
      const active = profile.links.items.filter((i) => i.visible);
      lines = active.length
        ? active.map((i) => `- ${i.label}: ${i.url} (${i.mode})`)
        : ['Ссылок пока нет.'];
    } else if (cmd === 'stats') {
      lines = [
        profile.analytics.showViewsBadge ? `Views: ${views}` : 'Views: скрыто',
        profile.analytics.enableLikes ? `Likes: ${likes}` : 'Likes: отключено'
      ];
    } else {
      lines = [`Команда не найдена: ${raw}. Введите help.`];
    }

    history = [...history, { cmd: raw, lines }];
  }
</script>

<div class="term-shell theme-{profile.layout.terminalMode.theme}">
  <div class="term-bar">
    <span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span>
    <span class="term-title">{prompt}</span>
  </div>
  <div class="term-body">
    <div class="term-line"><span class="ps1">{prompt}</span> whoami</div>
    {#each introLines as line}
      <div class="term-out">{line}</div>
    {/each}

    <div class="term-links">
      {#each profile.links.items.filter((i) => i.visible) as link (link.id)}
        <a
          href={link.mode === 'copy' ? '#copy' : link.url}
          target={link.mode === 'link' ? '_blank' : undefined}
          rel={link.mode === 'link' ? 'noopener noreferrer' : undefined}
        >[{link.label}]</a>
      {/each}
    </div>

    {#each history as entry}
      <div class="term-line"><span class="ps1">{prompt}</span> {entry.cmd}</div>
      {#each entry.lines as l}
        <div class="term-out">{l}</div>
      {/each}
    {/each}

    <form class="term-input-row" onsubmit={(e) => { e.preventDefault(); runCommand(); }}>
      <span class="ps1">{prompt}</span>
      <input
        type="text"
        bind:value={cmdInput}
        placeholder="введите help..."
        aria-label="Команда терминала"
      />
    </form>
  </div>
</div>

<style>
  .term-shell {
    width: 100%;
    border-radius: var(--bio-card-radius, 16px);
    background: rgba(6, 10, 8, 0.88);
    backdrop-filter: blur(14px);
    border: 1px solid rgba(255, 255, 255, 0.16);
    font-family: "JetBrains Mono", Consolas, monospace;
    overflow: hidden;
    text-align: left;
  }
  .term-shell.theme-green { --term-fg: #4ade80; }
  .term-shell.theme-amber { --term-fg: #fbbf24; }
  .term-shell.theme-white { --term-fg: #f8fafc; }
  .term-shell.theme-accent { --term-fg: var(--bio-accent, #8b5cf6); }

  .term-bar {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.05);
    border-bottom: 1px solid rgba(255, 255, 255, 0.09);
  }
  .dot { width: 10px; height: 10px; border-radius: 50%; }
  .dot.red { background: #ef4444; }
  .dot.yellow { background: #f59e0b; }
  .dot.green { background: #22c55e; }
  .term-title { margin-left: 6px; font-size: 0.78rem; color: var(--bio-text-muted); }

  .term-body {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 0.88rem;
    color: var(--term-fg);
  }
  .ps1 { font-weight: 700; opacity: 0.9; margin-right: 6px; }
  .term-out { color: var(--bio-text); opacity: 0.9; padding-left: 4px; }
  .term-links { display: flex; flex-wrap: wrap; gap: 10px; margin: 6px 0; }
  .term-links a { color: var(--term-fg); text-decoration: none; }
  .term-links a:hover { text-decoration: underline; }
  .term-input-row { display: flex; align-items: center; margin-top: 6px; }
  .term-input-row input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: var(--term-fg);
  }
</style>
