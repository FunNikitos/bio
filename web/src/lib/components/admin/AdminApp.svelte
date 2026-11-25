<script lang="ts">
  import { api } from '../../engine/apiClient';
  import { cloneProfile, createDefaultProfile, normalizeProfile, type ProfileConfigV1 } from '../../schema/profile';
  import ProfileView from '../profile/ProfileView.svelte';
  import AdminProfileTab from './AdminProfileTab.svelte';
  import AdminLayoutTab from './AdminLayoutTab.svelte';
  import AdminEffectsTab from './AdminEffectsTab.svelte';
  import AdminThemeTab from './AdminThemeTab.svelte';
  import AdminLinksAudioTab from './AdminLinksAudioTab.svelte';
  import AdminSettingsTab from './AdminSettingsTab.svelte';

  type TabId = 'profile' | 'layout' | 'effects' | 'theme' | 'links' | 'settings';

  let loading = $state(true);
  let authenticated = $state(false);
  let needsSetup = $state(false);
  let setupCode = $state('');
  let passwordInput = $state('');
  let authError = $state('');

  let draft = $state<ProfileConfigV1>(createDefaultProfile());
  let published = $state<ProfileConfigV1 | null>(null);
  let analytics = $state<{ views: number; likes: number; clicksByLink: Record<string, number> }>({
    views: 0,
    likes: 0,
    clicksByLink: {}
  });

  let undoStack = $state<ProfileConfigV1[]>([]);
  let redoStack = $state<ProfileConfigV1[]>([]);
  let activeTab = $state<TabId>('profile');
  let advanced = $state(true);
  let previewDevice = $state<'desktop' | 'phone'>('desktop');
  let searchQuery = $state('');
  let statusMsg = $state('');
  let dirty = $state(false);

  const TABS: Array<{ id: TabId; label: string; keywords: string }> = [
    { id: 'profile', label: 'Профиль и бейджи', keywords: 'имя аватар баннер бейджи теги bio uid статус' },
    { id: 'layout', label: 'Макет и карточка', keywords: 'раскладка стекло размытие радиус 3d наклон вход углы терминал секции' },
    { id: 'effects', label: 'Фон, частицы и курсор', keywords: 'фон видео градиент частицы снег дождь сакура splash шлейф курсор звук' },
    { id: 'theme', label: 'Темы, цвета и текст', keywords: 'скины пресеты палитра цвета шрифты имя печатная машинка glitch wave' },
    { id: 'links', label: 'Ссылки, аудио и блоки', keywords: 'ссылки соцсети музыка плеер лирика часы setup игры discord faq' },
    { id: 'settings', label: 'Аналитика, SEO и бэкап', keywords: 'просмотры трекер seo пароль импорт экспорт json' }
  ];

  async function loadState() {
    loading = true;
    try {
      const state = await api.getAdminState();
      authenticated = state.authenticated;
      needsSetup = state.needsSetup;
      if (state.authenticated && state.draft) {
        draft = normalizeProfile(state.draft);
        published = state.published ? normalizeProfile(state.published) : null;
        analytics = state.analytics ?? analytics;
        dirty = Boolean(state.hasUnpublishedChanges);
      }
    } catch (err) {
      statusMsg = err instanceof Error ? err.message : 'Ошибка загрузки';
    } finally {
      loading = false;
    }
  }

  $effect(() => { void loadState(); });

  function notify(msg: string) {
    statusMsg = msg;
    window.setTimeout(() => { if (statusMsg === msg) statusMsg = ''; }, 3500);
  }

  function recordHistory(snapshot: ProfileConfigV1) {
    undoStack = [...undoStack.slice(-23), cloneProfile(snapshot)];
    redoStack = [];
    dirty = true;
  }

  function handleMutate() {
    dirty = true;
  }

  function applyPreset(next: ProfileConfigV1) {
    recordHistory(draft);
    draft = next;
  }

  function undo() {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    undoStack = undoStack.slice(0, -1);
    redoStack = [...redoStack, cloneProfile(draft)];
    draft = prev;
    dirty = true;
  }

  function redo() {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    redoStack = redoStack.slice(0, -1);
    undoStack = [...undoStack, cloneProfile(draft)];
    draft = next;
    dirty = true;
  }

  async function handleAuth(e: Event) {
    e.preventDefault();
    authError = '';
    try {
      if (needsSetup) {
        await api.setupOwner(setupCode, passwordInput);
      } else {
        await api.login(passwordInput);
      }
      passwordInput = '';
      await loadState();
    } catch (err) {
      authError = err instanceof Error ? err.message : 'Ошибка входа';
    }
  }

  async function saveDraft() {
    try {
      const res = await api.saveDraft(draft);
      draft = normalizeProfile(res.draft);
      notify('Черновик сохранён');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Не удалось сохранить');
    }
  }

  async function publishProfile() {
    try {
      await api.saveDraft(draft);
      const res = await api.publish();
      published = normalizeProfile(res.published);
      dirty = false;
      notify('Опубликовано на /');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Не удалось опубликовать');
    }
  }

  async function handleUpload(file: File, apply: (url: string) => void) {
    try {
      const res = await api.uploadFile(file);
      apply(res.url);
      notify(`Загружено: ${res.name}`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Ошибка загрузки файла');
    }
  }

  async function handleImportJson(text: string) {
    try {
      const parsed = JSON.parse(text);
      recordHistory(draft);
      const res = await api.importConfig(parsed);
      draft = normalizeProfile(res.draft);
      notify('Конфиг импортирован в черновик');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Некорректный JSON');
    }
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bio-${draft.identity.username || 'profile'}.v1.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredTabs = $derived(
    searchQuery.trim()
      ? TABS.filter((t) => `${t.label} ${t.keywords}`.toLowerCase().includes(searchQuery.trim().toLowerCase()))
      : TABS
  );
</script>

{#if loading}
  <div class="auth-screen"><p>Загрузка редактора...</p></div>
{:else if !authenticated}
  <div class="auth-screen">
    <form class="auth-card" onsubmit={handleAuth}>
      <h1>{needsSetup ? 'Первичная настройка bio' : 'Вход в редактор /admin'}</h1>
      <p class="auth-sub">
        {needsSetup
          ? 'Введите одноразовый код из терминала сервера и задайте пароль владельца.'
          : 'Введите пароль владельца этого сервера.'}
      </p>
      {#if needsSetup}
        <label>Код установки из терминала
          <input type="text" required bind:value={setupCode} placeholder="Например: BIO-..." />
        </label>
      {/if}
      <label>Пароль владельца
        <input type="password" required minlength="6" bind:value={passwordInput} placeholder="Минимум 6 символов" />
      </label>
      {#if authError}
        <p class="auth-err">{authError}</p>
      {/if}
      <button type="submit" class="primary-btn">{needsSetup ? 'Создать владельца' : 'Войти'}</button>
      <a href="/" class="back-link">← На публичную страницу</a>
    </form>
  </div>
{:else}
  <div class="studio">
    <header class="studio-top">
      <div class="top-left">
        <strong>bio · /admin</strong>
        <span class="state-pill" class:is-dirty={dirty}>{dirty ? 'Есть неопубликованные правки' : published ? 'Опубликовано' : 'Черновик'}</span>
        {#if statusMsg}<span class="top-status">{statusMsg}</span>{/if}
      </div>
      <div class="top-actions">
        <button type="button" class="ghost-btn" onclick={undo} disabled={undoStack.length === 0}>↶ Отменить</button>
        <button type="button" class="ghost-btn" onclick={redo} disabled={redoStack.length === 0}>↷ Повторить</button>
        <button type="button" class="ghost-btn" onclick={() => { advanced = !advanced; }}>{advanced ? 'Режим: Расширенный' : 'Режим: Простой'}</button>
        <button type="button" class="ghost-btn" onclick={saveDraft}>Сохранить черновик</button>
        <button type="button" class="primary-btn" onclick={publishProfile}>Опубликовать</button>
        <a href="/" target="_blank" rel="noopener" class="ghost-btn">Открыть / ↗</a>
        <button type="button" class="ghost-btn" onclick={async () => { await api.logout(); await loadState(); }}>Выйти</button>
      </div>
    </header>

    <div class="studio-body">
      <aside class="studio-sidebar">
        <div class="search-bar">
          <input type="search" placeholder="Поиск настройки (шрифт, блеск, tilt...)" bind:value={searchQuery} />
        </div>
        <nav class="tab-nav">
          {#each filteredTabs as tab (tab.id)}
            <button
              type="button"
              class="tab-btn"
              class:active={activeTab === tab.id}
              onclick={() => { activeTab = tab.id; }}
            >{tab.label}</button>
          {/each}
        </nav>

        <div class="tab-panel">
          {#if activeTab === 'profile'}
            <AdminProfileTab bind:draft {advanced} onUpload={handleUpload} onMutate={handleMutate} />
          {:else if activeTab === 'layout'}
            <AdminLayoutTab bind:draft {advanced} onMutate={handleMutate} />
          {:else if activeTab === 'effects'}
            <AdminEffectsTab bind:draft {advanced} onUpload={handleUpload} onMutate={handleMutate} />
          {:else if activeTab === 'theme'}
            <AdminThemeTab bind:draft {advanced} onApplyPreset={applyPreset} onUpload={handleUpload} onMutate={handleMutate} />
          {:else if activeTab === 'links'}
            <AdminLinksAudioTab bind:draft {advanced} onUpload={handleUpload} onMutate={handleMutate} />
          {:else if activeTab === 'settings'}
            <AdminSettingsTab
              bind:draft
              {analytics}
              onMutate={handleMutate}
              onImportJson={handleImportJson}
              onExportJson={exportJson}
              onResetDefault={() => { recordHistory(draft); draft = createDefaultProfile(); }}
            />
          {/if}
        </div>
      </aside>

      <section class="studio-preview">
        <div class="preview-toolbar">
          <span>Живой предпросмотр черновика</span>
          <div class="device-switch">
            <button type="button" class:active={previewDevice === 'desktop'} onclick={() => { previewDevice = 'desktop'; }}>Desktop</button>
            <button type="button" class:active={previewDevice === 'phone'} onclick={() => { previewDevice = 'phone'; }}>Phone (390px)</button>
          </div>
        </div>
        <div class="preview-frame" class:is-phone={previewDevice === 'phone'}>
          <div class="preview-scroll">
            <ProfileView profile={draft} views={analytics.views} likes={analytics.likes} isPreview={true} />
          </div>
        </div>
      </section>
    </div>
  </div>
{/if}

<style>
  .auth-screen { min-height: 100vh; display: grid; place-items: center; background: #07070c; padding: 20px; }
  .auth-card { width: min(100%, 400px); background: #10101a; border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 20px; padding: 26px; display: flex; flex-direction: column; gap: 14px; }
  .auth-card h1 { margin: 0; font-size: 1.35rem; }
  .auth-sub { margin: 0; font-size: 0.88rem; color: #94a3b8; }
  .auth-card label { display: flex; flex-direction: column; gap: 6px; font-size: 0.85rem; }
  .auth-card input { padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.16); background: #07070c; }
  .auth-err { margin: 0; color: #fda4af; font-size: 0.86rem; }
  .back-link { text-align: center; color: #94a3b8; font-size: 0.85rem; text-decoration: none; }

  .studio { display: flex; flex-direction: column; height: 100vh; background: #08080e; color: #f8fafc; }
  .studio-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); background: #0d0d16; }
  .top-left, .top-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  .state-pill { font-size: 0.76rem; padding: 3px 10px; border-radius: 999px; background: rgba(34, 197, 94, 0.16); color: #86efac; }
  .state-pill.is-dirty { background: rgba(245, 158, 11, 0.18); color: #fcd34d; }
  .top-status { font-size: 0.82rem; color: #c4b5fd; }

  .primary-btn { background: #8b5cf6; color: #fff; border: none; border-radius: 10px; padding: 8px 14px; font-weight: 600; cursor: pointer; }
  .ghost-btn { background: rgba(255, 255, 255, 0.06); color: #e2e8f0; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 10px; padding: 7px 12px; text-decoration: none; font-size: 0.84rem; cursor: pointer; }
  .ghost-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  .studio-body { flex: 1; display: grid; grid-template-columns: minmax(420px, 540px) 1fr; min-height: 0; }
  @media (max-width: 1020px) { .studio-body { grid-template-columns: 1fr; height: auto; } .studio { height: auto; } }

  .studio-sidebar { display: flex; flex-direction: column; border-right: 1px solid rgba(255, 255, 255, 0.1); min-height: 0; background: #0b0b12; }
  .search-bar { padding: 10px 14px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
  .search-bar input { width: 100%; padding: 8px 12px; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.14); background: #131320; font-size: 0.86rem; }
  .tab-nav { display: flex; flex-wrap: wrap; gap: 6px; padding: 10px 14px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
  .tab-btn { padding: 6px 11px; border-radius: 9px; border: 1px solid rgba(255, 255, 255, 0.1); background: transparent; font-size: 0.8rem; cursor: pointer; }
  .tab-btn.active { background: #8b5cf6; border-color: transparent; color: #fff; font-weight: 600; }

  .tab-panel { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 16px; }
  .studio-preview { display: flex; flex-direction: column; min-height: 0; background: #050509; padding: 12px; gap: 10px; }
  .preview-toolbar { display: flex; align-items: center; justify-content: space-between; font-size: 0.84rem; color: #94a3b8; }
  .device-switch { display: flex; gap: 6px; }
  .device-switch button { padding: 5px 10px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.14); background: transparent; cursor: pointer; font-size: 0.78rem; }
  .device-switch button.active { background: #8b5cf6; border-color: transparent; color: #fff; }
  .preview-frame { flex: 1; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.12); overflow: hidden; margin: 0 auto; width: 100%; transition: width 0.2s ease; }
  .preview-frame.is-phone { width: 392px; max-width: 100%; }
  .preview-scroll { width: 100%; height: 100%; overflow-y: auto; transform: translateZ(0); }

  /* Shared form classes inside tab components */
  :global(.adm-group) { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 14px; display: flex; flex-direction: column; gap: 11px; }
  :global(.adm-group h3) { margin: 0; font-size: 0.96rem; color: #e2e8f0; }
  :global(.adm-group label) { display: flex; flex-direction: column; gap: 5px; font-size: 0.8rem; color: #cbd5e1; }
  :global(.adm-group input[type="text"]),
  :global(.adm-group input[type="number"]),
  :global(.adm-group select),
  :global(.adm-group textarea) { width: 100%; padding: 7px 10px; border-radius: 9px; border: 1px solid rgba(255, 255, 255, 0.14); background: #131320; font-size: 0.84rem; }
  :global(.adm-group input[type="range"]) { width: 100%; accent-color: #8b5cf6; }
  :global(.adm-group input[type="color"]) { width: 100%; height: 32px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.18); background: transparent; padding: 2px; cursor: pointer; }
  :global(.adm-grid2) { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  :global(.adm-grid3) { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
  :global(.adm-grid4) { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
  :global(.adm-checks) { display: flex; flex-wrap: wrap; gap: 10px; }
  :global(.adm-group label.chk) { flex-direction: row; align-items: center; gap: 6px; cursor: pointer; }
  :global(.adm-row) { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  :global(.adm-head-row) { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  :global(.adm-btn), :global(.adm-upload) { padding: 6px 12px; border-radius: 9px; border: 1px solid rgba(139, 92, 246, 0.45); background: rgba(139, 92, 246, 0.16); color: #ddd6fe; font-size: 0.8rem; cursor: pointer; white-space: nowrap; }
  :global(.adm-upload input[type="file"]) { display: none; }
  :global(.adm-del) { padding: 4px 9px; border-radius: 8px; border: 1px solid rgba(244, 63, 94, 0.4); background: rgba(244, 63, 94, 0.14); color: #fda4af; cursor: pointer; }
  :global(.adm-mini) { padding: 4px 8px; border-radius: 7px; border: 1px solid rgba(255, 255, 255, 0.14); background: rgba(255, 255, 255, 0.06); cursor: pointer; font-size: 0.78rem; }
  :global(.tag-row) { display: flex; gap: 8px; }
  :global(.tag-pills) { display: flex; flex-wrap: wrap; gap: 6px; }
  :global(.tag-chip) { padding: 4px 10px; border-radius: 999px; background: rgba(139, 92, 246, 0.2); border: 1px solid rgba(139, 92, 246, 0.4); cursor: pointer; font-size: 0.78rem; }
  :global(.skins-grid) { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  :global(.skin-card) { text-align: left; padding: 10px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.03); display: flex; flex-direction: column; gap: 3px; cursor: pointer; }
  :global(.skin-card.active) { border-color: #8b5cf6; background: rgba(139, 92, 246, 0.16); }
  :global(.skin-card span) { font-size: 0.76rem; color: #94a3b8; }
  :global(.skin-card small) { font-size: 0.7rem; color: #a78bfa; }
  :global(.swatch-row) { display: flex; flex-wrap: wrap; gap: 7px; }
  :global(.swatch-dot) { width: 22px; height: 22px; border-radius: 50%; border: 1px solid rgba(255, 255, 255, 0.3); cursor: pointer; padding: 0; }
  :global(.grad-presets) { display: flex; flex-wrap: wrap; gap: 6px; }
  :global(.grad-btn) { padding: 5px 10px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.2); font-size: 0.75rem; cursor: pointer; color: #fff; }
  :global(.link-editor-list), :global(.badge-list) { display: flex; flex-direction: column; gap: 8px; }
  :global(.link-item-card) { padding: 10px; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(0, 0, 0, 0.25); display: flex; flex-direction: column; gap: 8px; }
  :global(.link-item-top), :global(.badge-row) { display: flex; align-items: center; gap: 6px; }
  :global(.block-add-bar) { display: flex; flex-wrap: wrap; gap: 6px; }
  :global(.stats-grid) { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
  :global(.stat-box) { padding: 10px; border-radius: 10px; background: rgba(255, 255, 255, 0.04); display: flex; flex-direction: column; gap: 3px; }
  :global(.stat-box span) { font-size: 0.74rem; color: #94a3b8; }
  :global(.stat-box strong) { font-size: 1.25rem; color: #c4b5fd; }
  :global(.adm-hint) { margin: 0; font-size: 0.8rem; color: #94a3b8; }
</style>
