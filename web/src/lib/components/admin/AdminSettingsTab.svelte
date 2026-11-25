<script lang="ts">
  import type { ProfileConfigV1 } from '../../schema/profile';

  interface Props {
    draft: ProfileConfigV1;
    analytics: { views: number; likes: number; clicksByLink: Record<string, number> };
    onMutate: () => void;
    onImportJson: (jsonText: string) => void;
    onExportJson: () => void;
    onResetDefault: () => void;
  }

  let { draft = $bindable(), analytics, onMutate, onImportJson, onExportJson, onResetDefault }: Props = $props();
  let importText = $state('');
</script>

<div class="adm-group">
  <h3>Опциональный счётчик просмотров и кликов (first-party)</h3>
  <p class="adm-hint">Работает локально на вашем сервере без сторонних трекеров, Turnstile и передачи данных вовне. При желании отключается одним тумблером.</p>
  <div class="adm-checks">
    <label class="chk"><input type="checkbox" bind:checked={draft.analytics.trackViews} onchange={onMutate} /> Считать просмотры профиля</label>
    <label class="chk"><input type="checkbox" bind:checked={draft.analytics.showViewsBadge} onchange={onMutate} /> Показывать счётчик просмотров на странице</label>
    <label class="chk"><input type="checkbox" bind:checked={draft.analytics.trackClicks} onchange={onMutate} /> Считать клики по ссылкам</label>
    <label class="chk"><input type="checkbox" bind:checked={draft.analytics.enableLikes} onchange={onMutate} /> Разрешить лайки страницы</label>
  </div>

  <div class="stats-grid">
    <div class="stat-box"><span>Просмотры</span><strong>{analytics.views}</strong></div>
    <div class="stat-box"><span>Лайки</span><strong>{analytics.likes}</strong></div>
    <div class="stat-box"><span>Ссылок с кликами</span><strong>{Object.keys(analytics.clicksByLink).length}</strong></div>
  </div>
</div>

<div class="adm-group">
  <h3>SEO, вкладка браузера и приватность</h3>
  <div class="adm-grid2">
    <label>Заголовок вкладки браузера
      <input type="text" maxlength="60" bind:value={draft.meta.tabTitle} oninput={onMutate} />
    </label>
    <label>SEO / OpenGraph заголовок
      <input type="text" maxlength="100" bind:value={draft.meta.seoTitle} oninput={onMutate} />
    </label>
  </div>
  <label>SEO описание
    <textarea rows="2" maxlength="260" bind:value={draft.meta.seoDescription} oninput={onMutate}></textarea>
  </label>
  <div class="adm-grid2">
    <label>Код доступа на профиль (пусто = открыт всем)
      <input type="text" maxlength="64" bind:value={draft.meta.passcode} oninput={onMutate} />
    </label>
    <label>Подсказка к коду
      <input type="text" maxlength="120" bind:value={draft.meta.passcodeHint} oninput={onMutate} />
    </label>
  </div>
  <div class="adm-checks">
    <label class="chk"><input type="checkbox" bind:checked={draft.meta.animatedTabTitle} onchange={onMutate} /> Анимировать заголовок вкладки</label>
    <label class="chk"><input type="checkbox" bind:checked={draft.meta.nsfwGate} onchange={onMutate} /> Предупреждение 18+</label>
    <label class="chk"><input type="checkbox" bind:checked={draft.meta.showBrandingFooter} onchange={onMutate} /> Показывать подпись «Powered by bio» (по умолчанию выкл.)</label>
  </div>
</div>

<div class="adm-group">
  <h3>Резервная копия и редактирование конфига (profile.v1)</h3>
  <p class="adm-hint">Формат с номером версии можно скачать, передать ИИ для тонкой донастройки и импортировать обратно перед публикацией.</p>
  <div class="adm-row">
    <button type="button" class="adm-btn" onclick={onExportJson}>Скачать profile.v1.json</button>
    <label class="adm-upload">
      Загрузить JSON из файла
      <input type="file" accept="application/json,.json" onchange={async (e) => {
        const f = (e.target as HTMLInputElement).files?.[0];
        if (!f) return;
        onImportJson(await f.text());
      }} />
    </label>
    <button type="button" class="adm-del" onclick={onResetDefault}>Сбросить к стандарту</button>
  </div>
  <textarea rows="4" placeholder="Или вставьте JSON profile.v1 сюда..." bind:value={importText}></textarea>
  <button type="button" class="adm-btn" onclick={() => { if (importText.trim()) { onImportJson(importText); importText = ''; } }}>Импортировать JSON в черновик</button>
</div>
