<script lang="ts">
  import type { ContentBlock, ProfileConfigV1 } from '../../schema/profile';
  import { SOCIAL_PLATFORMS } from '../../schema/icons';

  interface Props {
    draft: ProfileConfigV1;
    advanced: boolean;
    onUpload: (file: File, apply: (url: string) => void) => void;
    onMutate: () => void;
  }

  let { draft = $bindable(), advanced, onUpload, onMutate }: Props = $props();

  function addLink(platformId = 'website') {
    const p = SOCIAL_PLATFORMS.find((x) => x.id === platformId) ?? SOCIAL_PLATFORMS[0];
    draft.links.items = [
      ...draft.links.items,
      {
        id: `lnk-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        platform: p.id,
        label: p.label,
        subtitle: '',
        url: '',
        mode: 'link',
        customIconUrl: '',
        glowColor: p.color,
        pinned: false,
        is18Plus: false,
        visible: true
      }
    ];
    onMutate();
  }

  function moveLink(idx: number, dir: -1 | 1) {
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= draft.links.items.length) return;
    const copy = [...draft.links.items];
    [copy[idx], copy[nextIdx]] = [copy[nextIdx], copy[idx]];
    draft.links.items = copy;
    onMutate();
  }

  function addTrack() {
    draft.audio.tracks = [
      ...draft.audio.tracks,
      {
        id: `trk-${Date.now()}`,
        title: 'Новый трек',
        artist: draft.identity.displayName || 'Artist',
        url: '',
        coverUrl: '',
        lrcText: ''
      }
    ];
    draft.audio.enabled = true;
    onMutate();
  }

  function addBlock(kind: ContentBlock['type']) {
    const id = `blk-${Date.now()}`;
    let block: ContentBlock;
    switch (kind) {
      case 'clock':
        block = { id, visible: true, type: 'clock', title: 'Местное время', timezone: 'Europe/Moscow', label: 'Моё время', hour12: false };
        break;
      case 'setup':
        block = {
          id, visible: true, type: 'setup', title: 'Моё железо (Setup)', photoUrl: '',
          items: [{ id: `s-${Date.now()}`, category: 'PC / Specs', name: 'RTX / Ryzen', details: 'Рабочая станция', url: '' }]
        };
        break;
      case 'games':
        block = {
          id, visible: true, type: 'games', title: 'Игры',
          items: [{ id: `g-${Date.now()}`, name: 'CS2', handle: '@player' }]
        };
        break;
      case 'discord':
        block = {
          id, visible: true, type: 'discord', displayName: draft.identity.displayName, username: draft.identity.username,
          status: 'online', activity: 'Разрабатываю bio', guildTag: 'BIO', avatarUrl: draft.avatar.url, bannerColor: '#5865f2', showBadges: true
        };
        break;
      case 'gallery':
        block = { id, visible: true, type: 'gallery', title: 'Галерея', columns: 2, items: [] };
        break;
      case 'faq':
        block = { id, visible: true, type: 'faq', title: 'FAQ', items: [{ id: `f-${Date.now()}`, question: 'На чём сделан сайт?', answer: 'Open-source конструктор bio.' }] };
        break;
      case 'quote':
        block = { id, visible: true, type: 'quote', text: 'Сделано для себя и открыто для всех.', author: draft.identity.displayName };
        break;
      case 'callout':
        block = { id, visible: true, type: 'callout', title: 'Объявление', text: 'Открыт к проектам и идеям.', tone: 'accent' };
        break;
      case 'divider':
        block = { id, visible: true, type: 'divider', style: 'gradient' };
        break;
      default:
        block = { id, visible: true, type: 'text', title: 'О себе', body: 'Небольшой текстовый блок.', align: 'left' };
        break;
    }
    draft.blocks = [...draft.blocks, block];
    onMutate();
  }
</script>

<div class="adm-group">
  <div class="adm-head-row">
    <h3>Ссылки и соцсети</h3>
    <button type="button" class="adm-btn" onclick={() => addLink('website')}>+ Ссылка</button>
  </div>

  <div class="adm-grid3">
    <label>Вид ссылок
      <select bind:value={draft.links.linkStyle} onchange={onMutate}>
        <option value="icons">Только иконки</option>
        <option value="pills">Pills</option>
        <option value="minimal">Minimal</option>
        <option value="outline">Outline</option>
        <option value="cards">Cards</option>
      </select>
    </label>
    <label>Стиль иконки
      <select bind:value={draft.links.iconStyle} onchange={onMutate}>
        <option value="plain">Plain</option>
        <option value="soft">Soft</option>
        <option value="circle">Circle</option>
        <option value="outline">Outline</option>
      </select>
    </label>
    <label>Размер иконок: {draft.links.iconSizePx}px
      <input type="range" min="24" max="56" step="2" bind:value={draft.links.iconSizePx} oninput={onMutate} />
    </label>
  </div>

  <div class="adm-checks">
    <label class="chk"><input type="checkbox" bind:checked={draft.links.monochromeIcons} onchange={onMutate} /> Монохромные</label>
    <label class="chk"><input type="checkbox" bind:checked={draft.links.glowIcons} onchange={onMutate} /> Свечение иконок</label>
    <label class="chk"><input type="checkbox" bind:checked={draft.links.randomizeOrder} onchange={onMutate} /> Случайный порядок</label>
  </div>

  <div class="link-editor-list">
    {#each draft.links.items as item, idx (item.id)}
      <div class="link-item-card">
        <div class="link-item-top">
          <input type="checkbox" bind:checked={item.visible} onchange={onMutate} title="Видимость" />
          <select bind:value={item.platform} onchange={onMutate}>
            {#each SOCIAL_PLATFORMS as p}
              <option value={p.id}>{p.label}</option>
            {/each}
          </select>
          <select bind:value={item.mode} onchange={onMutate}>
            <option value="link">Открыть ссылку</option>
            <option value="copy">Копировать текст</option>
          </select>
          <button type="button" class="adm-mini" onclick={() => moveLink(idx, -1)}>↑</button>
          <button type="button" class="adm-mini" onclick={() => moveLink(idx, 1)}>↓</button>
          <button type="button" class="adm-del" onclick={() => { draft.links.items = draft.links.items.filter((_, i) => i !== idx); onMutate(); }}>✕</button>
        </div>
        <div class="adm-grid2">
          <input type="text" placeholder="Название" bind:value={item.label} oninput={onMutate} />
          <input type="text" placeholder={item.mode === 'copy' ? 'Текст для копирования' : 'https://...'} bind:value={item.url} oninput={onMutate} />
        </div>
        {#if advanced}
          <div class="adm-grid2">
            <input type="text" placeholder="Подпись (для cards/minimal)" bind:value={item.subtitle} oninput={onMutate} />
            <div class="adm-checks">
              <label class="chk"><input type="checkbox" bind:checked={item.pinned} onchange={onMutate} /> Закрепить</label>
              <label class="chk"><input type="checkbox" bind:checked={item.is18Plus} onchange={onMutate} /> 18+</label>
              <input type="color" bind:value={item.glowColor} oninput={onMutate} title="Цвет свечения" />
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<div class="adm-group">
  <div class="adm-head-row">
    <h3>Аудиоплеер и лирика</h3>
    <button type="button" class="adm-btn" onclick={addTrack}>+ Трек</button>
  </div>
  <div class="adm-checks">
    <label class="chk"><input type="checkbox" bind:checked={draft.audio.enabled} onchange={onMutate} /> Включить аудио</label>
    <label class="chk"><input type="checkbox" bind:checked={draft.audio.autoplayOnEnter} onchange={onMutate} /> Автостарт после входа</label>
    <label class="chk"><input type="checkbox" bind:checked={draft.audio.shuffle} onchange={onMutate} /> Перемешивать</label>
    <label class="chk"><input type="checkbox" bind:checked={draft.audio.syncVideoWithAudio} onchange={onMutate} /> Синхронизировать видео с музыкой</label>
    <label class="chk"><input type="checkbox" bind:checked={draft.audio.showLyrics} onchange={onMutate} /> Караоке-лирика (.lrc)</label>
    <label class="chk"><input type="checkbox" bind:checked={draft.audio.beatShake} onchange={onMutate} /> Пульс под бит</label>
  </div>

  <div class="adm-grid3">
    <label>Стиль плеера
      <select bind:value={draft.audio.playerStyle} onchange={onMutate}>
        <option value="detached">Полный плеер</option>
        <option value="volume-only">Только громкость/пауза</option>
        <option value="hidden">Скрытый фон</option>
      </select>
    </label>
    <label>Визуализатор
      <select bind:value={draft.audio.visualizer} onchange={onMutate}>
        <option value="off">Выкл</option>
        <option value="bars">Живые столбики</option>
        <option value="waveform">Звуковая волна</option>
        <option value="ring">Кольцо / импульс</option>
      </select>
    </label>
    <label>Громкость по умолчанию: {draft.audio.defaultVolume}%
      <input type="range" min="5" max="100" step="1" bind:value={draft.audio.defaultVolume} oninput={onMutate} />
    </label>
  </div>

  {#each draft.audio.tracks as track, idx (track.id)}
    <div class="link-item-card">
      <div class="adm-grid2">
        <input type="text" placeholder="Название трека" bind:value={track.title} oninput={onMutate} />
        <input type="text" placeholder="Исполнитель" bind:value={track.artist} oninput={onMutate} />
      </div>
      <div class="adm-row">
        <label class="adm-upload">
          Файл аудио
          <input type="file" accept="audio/*" onchange={(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) onUpload(f, (url) => { track.url = url; onMutate(); }); }} />
        </label>
        <input type="text" placeholder="URL трека (.mp3/.m4a/.ogg)" bind:value={track.url} oninput={onMutate} />
        <button type="button" class="adm-del" onclick={() => { draft.audio.tracks = draft.audio.tracks.filter((_, i) => i !== idx); onMutate(); }}>✕</button>
      </div>
      {#if advanced}
        <div class="adm-row">
          <label class="adm-upload">
            Обложка
            <input type="file" accept="image/*" onchange={(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) onUpload(f, (url) => { track.coverUrl = url; onMutate(); }); }} />
          </label>
          <input type="text" placeholder="URL обложки" bind:value={track.coverUrl} oninput={onMutate} />
        </div>
        <textarea rows="2" placeholder="Синхронизированная лирика формата [00:12.50] Текст строки" bind:value={track.lrcText} oninput={onMutate}></textarea>
      {/if}
    </div>
  {/each}
</div>

<div class="adm-group">
  <div class="adm-head-row">
    <h3>Модульные блоки (виджеты и контент)</h3>
  </div>
  <div class="block-add-bar">
    <button type="button" class="adm-btn" onclick={() => addBlock('clock')}>+ Часы</button>
    <button type="button" class="adm-btn" onclick={() => addBlock('discord')}>+ Discord</button>
    <button type="button" class="adm-btn" onclick={() => addBlock('setup')}>+ Setup / Железо</button>
    <button type="button" class="adm-btn" onclick={() => addBlock('games')}>+ Игры</button>
    <button type="button" class="adm-btn" onclick={() => addBlock('faq')}>+ FAQ</button>
    <button type="button" class="adm-btn" onclick={() => addBlock('quote')}>+ Цитата</button>
    <button type="button" class="adm-btn" onclick={() => addBlock('callout')}>+ Плашка</button>
    <button type="button" class="adm-btn" onclick={() => addBlock('text')}>+ Текст</button>
    <button type="button" class="adm-btn" onclick={() => addBlock('divider')}>+ Разделитель</button>
  </div>

  {#each draft.blocks as blk, idx (blk.id)}
    <div class="link-item-card">
      <div class="link-item-top">
        <input type="checkbox" bind:checked={blk.visible} onchange={onMutate} />
        <strong>{blk.type.toUpperCase()}</strong>
        <button type="button" class="adm-del" onclick={() => { draft.blocks = draft.blocks.filter((_, i) => i !== idx); onMutate(); }}>✕</button>
      </div>
      {#if blk.type === 'clock'}
        <div class="adm-grid3">
          <input type="text" placeholder="Заголовок" bind:value={blk.title} oninput={onMutate} />
          <input type="text" placeholder="IANA (Europe/Moscow)" bind:value={blk.timezone} oninput={onMutate} />
          <label class="chk"><input type="checkbox" bind:checked={blk.hour12} onchange={onMutate} /> 12-ч формат</label>
        </div>
      {:else if blk.type === 'discord'}
        <div class="adm-grid2">
          <input type="text" placeholder="Имя в Discord" bind:value={blk.displayName} oninput={onMutate} />
          <input type="text" placeholder="Username" bind:value={blk.username} oninput={onMutate} />
          <input type="text" placeholder="Активность" bind:value={blk.activity} oninput={onMutate} />
          <input type="text" placeholder="Тег сервера (BIO)" bind:value={blk.guildTag} oninput={onMutate} />
        </div>
      {:else if blk.type === 'quote'}
        <input type="text" placeholder="Текст цитаты" bind:value={blk.text} oninput={onMutate} />
        <input type="text" placeholder="Автор" bind:value={blk.author} oninput={onMutate} />
      {:else if blk.type === 'callout'}
        <input type="text" placeholder="Заголовок" bind:value={blk.title} oninput={onMutate} />
        <textarea rows="2" bind:value={blk.text} oninput={onMutate}></textarea>
      {:else if blk.type === 'text'}
        <input type="text" placeholder="Заголовок" bind:value={blk.title} oninput={onMutate} />
        <textarea rows="2" bind:value={blk.body} oninput={onMutate}></textarea>
      {:else if blk.type === 'setup'}
        <input type="text" placeholder="Заголовок" bind:value={blk.title} oninput={onMutate} />
        {#each blk.items as sItem (sItem.id)}
          <div class="adm-grid3">
            <select bind:value={sItem.category} onchange={onMutate}>
              <option value="PC / Specs">PC / Specs</option>
              <option value="Monitor">Monitor</option>
              <option value="Keyboard">Keyboard</option>
              <option value="Mouse">Mouse</option>
              <option value="Headset">Headset</option>
              <option value="Microphone">Microphone</option>
              <option value="Controller">Controller</option>
              <option value="Chair">Chair</option>
              <option value="Other">Other</option>
            </select>
            <input type="text" placeholder="Модель" bind:value={sItem.name} oninput={onMutate} />
            <input type="text" placeholder="Детали" bind:value={sItem.details} oninput={onMutate} />
          </div>
        {/each}
        <button type="button" class="adm-mini" onclick={() => { blk.items = [...blk.items, { id: `si-${Date.now()}`, category: 'Other', name: 'Устройство', details: '', url: '' }]; onMutate(); }}>+ Позиция</button>
      {:else if blk.type === 'games'}
        <input type="text" placeholder="Заголовок" bind:value={blk.title} oninput={onMutate} />
        {#each blk.items as gItem (gItem.id)}
          <div class="adm-grid2">
            <input type="text" placeholder="Игра" bind:value={gItem.name} oninput={onMutate} />
            <input type="text" placeholder="Ник в игре" bind:value={gItem.handle} oninput={onMutate} />
          </div>
        {/each}
        <button type="button" class="adm-mini" onclick={() => { blk.items = [...blk.items, { id: `gi-${Date.now()}`, name: 'Игра', handle: '' }]; onMutate(); }}>+ Игра</button>
      {:else if blk.type === 'faq'}
        <input type="text" placeholder="Заголовок" bind:value={blk.title} oninput={onMutate} />
        {#each blk.items as fItem (fItem.id)}
          <input type="text" placeholder="Вопрос" bind:value={fItem.question} oninput={onMutate} />
          <input type="text" placeholder="Ответ" bind:value={fItem.answer} oninput={onMutate} />
        {/each}
        <button type="button" class="adm-mini" onclick={() => { blk.items = [...blk.items, { id: `fi-${Date.now()}`, question: 'Вопрос', answer: 'Ответ' }]; onMutate(); }}>+ Вопрос</button>
      {/if}
    </div>
  {/each}
</div>
