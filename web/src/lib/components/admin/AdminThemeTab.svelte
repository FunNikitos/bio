<script lang="ts">
  import { cloneProfile, type ProfileConfigV1 } from '../../schema/profile';
  import { BUILTIN_FONTS, COLOR_SWATCHES, create952RomashProfile, SKIN_PRESETS } from '../../schema/presets';

  interface Props {
    draft: ProfileConfigV1;
    advanced: boolean;
    onApplyPreset: (next: ProfileConfigV1) => void;
    onUpload: (file: File, apply: (url: string) => void) => void;
    onMutate: () => void;
  }

  let { draft = $bindable(), advanced, onApplyPreset, onUpload, onMutate }: Props = $props();
  let newPhrase = $state('');

  function addPhrase() {
    const clean = newPhrase.trim();
    if (!clean) return;
    draft.effects.typewriter.phrases = [...draft.effects.typewriter.phrases, clean];
    newPhrase = '';
    onMutate();
  }
</script>

<div class="adm-group">
  <h3>Готовые скины / пресеты (1 клик)</h3>
  <div class="skins-grid">
    {#each SKIN_PRESETS as preset (preset.id)}
      <button
        type="button"
        class="skin-card"
        class:active={draft.theme.presetId === preset.id}
        onclick={() => onApplyPreset(preset.apply(cloneProfile(draft)))}
      >
        <strong>{preset.name}</strong>
        <span>{preset.subtitle}</span>
        <small>{preset.sourceHint}</small>
      </button>
    {/each}
  </div>
  <div class="adm-row" style="margin-top:6px;">
    <button type="button" class="adm-btn" onclick={() => onApplyPreset(create952RomashProfile())}>
      Загрузить полный профиль 952 × romash_10 (портрет, видео, музыка)
    </button>
  </div>
</div>

<div class="adm-group">
  <h3>Палитра (с авто-оттенками через color-mix)</h3>
  <div class="adm-grid4">
    <label>Акцент <input type="color" bind:value={draft.theme.accent} oninput={onMutate} /></label>
    <label>Текст <input type="color" bind:value={draft.theme.text} oninput={onMutate} /></label>
    <label>Карточка <input type="color" bind:value={draft.theme.cardColor} oninput={onMutate} /></label>
    <label>Градиент <input type="color" bind:value={draft.theme.gradientColor} oninput={onMutate} /></label>
    <label>Фон <input type="color" bind:value={draft.theme.background} oninput={onMutate} /></label>
    <label>Иконки <input type="color" bind:value={draft.theme.iconColor} oninput={onMutate} /></label>
    <label>Эффект 1 <input type="color" bind:value={draft.theme.fx1} oninput={onMutate} /></label>
    <label>Эффект 2 <input type="color" bind:value={draft.theme.fx2} oninput={onMutate} /></label>
  </div>

  <div class="swatch-row">
    {#each COLOR_SWATCHES as sw}
      <button
        type="button"
        class="swatch-dot"
        style="background:{sw}"
        title="Акцент {sw}"
        onclick={() => { draft.theme.accent = sw; onMutate(); }}
      ></button>
    {/each}
  </div>
  <div class="adm-row" style="margin-top:6px;">
    <button type="button" class="adm-btn" onclick={() => onApplyPreset(create952RomashProfile())}>
      Загрузить полный профиль 952 × romash_10 (портрет, видео, музыка)
    </button>
  </div>
</div>

<div class="adm-group">
  <h3>Шрифты и типографика</h3>
  <div class="adm-grid2">
    <label>Основной шрифт
      <select bind:value={draft.theme.fontFamily} onchange={onMutate}>
        {#each BUILTIN_FONTS as f}
          <option value={f.id}>{f.label}</option>
        {/each}
        {#if draft.theme.customFontUrl}
          <option value="custom">Свой шрифт ({draft.theme.customFontName || 'Custom'})</option>
        {/if}
      </select>
    </label>
    <label>Масштаб шрифта: {draft.theme.fontSizeScale}x
      <input type="range" min="0.75" max="1.5" step="0.05" bind:value={draft.theme.fontSizeScale} oninput={onMutate} />
    </label>
  </div>

  <div class="adm-grid3">
    <label>Размер ника: {draft.theme.usernameSize}px
      <input type="range" min="18" max="96" step="1" bind:value={draft.theme.usernameSize} oninput={onMutate} />
    </label>
    <label>Жирность ника
      <select bind:value={draft.theme.usernameWeight} onchange={onMutate}>
        <option value={400}>Regular (400)</option>
        <option value={600}>Semibold (600)</option>
        <option value={700}>Bold (700)</option>
        <option value={800}>ExtraBold (800)</option>
        <option value={900}>Black (900)</option>
      </select>
    </label>
    <label>Размер био
      <select bind:value={draft.theme.bioSize} onchange={onMutate}>
        <option value="small">Small</option>
        <option value="medium">Medium</option>
        <option value="large">Large</option>
      </select>
    </label>
  </div>

  {#if advanced}
    <div class="adm-row">
      <label class="adm-upload">
        Загрузить шрифт (.woff2/.ttf/.otf)
        <input type="file" accept=".woff2,.woff,.ttf,.otf" onchange={(e) => {
          const f = (e.target as HTMLInputElement).files?.[0];
          if (f) onUpload(f, (url) => {
            draft.theme.customFontUrl = url;
            draft.theme.customFontName = f.name.replace(/\.[^.]+$/, '') || 'CustomFont';
            draft.theme.fontFamily = 'custom';
            onMutate();
          });
        }} />
      </label>
      <input type="text" placeholder="Имя шрифта..." bind:value={draft.theme.customFontName} oninput={onMutate} />
    </div>
  {/if}
</div>

<div class="adm-group">
  <h3>Эффекты текста (имя и био)</h3>
  <div class="adm-grid2">
    <label>Эффект имени
      <select bind:value={draft.effects.usernameEffect} onchange={onMutate}>
        <option value="none">Нет</option>
        <option value="glow">Glow</option>
        <option value="neon">Neon</option>
        <option value="rainbow">Rainbow</option>
        <option value="gradient">Gradient</option>
        <option value="flow">Flowing Gradient</option>
        <option value="shine">Shine</option>
        <option value="glitch">Glitch</option>
        <option value="wave">Wave (по буквам)</option>
        <option value="sparkle">Sparkle (CSS)</option>
        <option value="typewriter">Typewriter</option>
        <option value="scramble">Scramble / Decrypt</option>
        <option value="fuzzy">Fuzzy</option>
        <option value="outline">Outline</option>
        <option value="shadow3d">3D Shadow</option>
        <option value="heartbeat">Heartbeat</option>
      </select>
    </label>
    <label>Эффект описания (Bio)
      <select bind:value={draft.effects.bioEffect} onchange={onMutate}>
        <option value="none">Нет</option>
        <option value="glow">Glow</option>
        <option value="gradient">Gradient</option>
        <option value="rainbow">Rainbow</option>
        <option value="shine">Shine</option>
        <option value="glitch">Glitch</option>
        <option value="wave">Wave</option>
        <option value="typewriter">Typewriter</option>
        <option value="scramble">Scramble</option>
      </select>
    </label>
  </div>

  <div class="adm-grid2">
    <label>Цвет текстового эффекта 1 <input type="color" bind:value={draft.effects.effectColor1} oninput={onMutate} /></label>
    <label>Цвет текстового эффекта 2 <input type="color" bind:value={draft.effects.effectColor2} oninput={onMutate} /></label>
  </div>

  {#if draft.effects.bioEffect === 'typewriter' || draft.effects.usernameEffect === 'typewriter'}
    <div class="typewriter-box">
      <div class="adm-grid3">
        <label>Скорость печати: {draft.effects.typewriter.typeSpeed}
          <input type="range" min="1" max="10" step="1" bind:value={draft.effects.typewriter.typeSpeed} oninput={onMutate} />
        </label>
        <label>Скорость удаления: {draft.effects.typewriter.deleteSpeed}
          <input type="range" min="1" max="10" step="1" bind:value={draft.effects.typewriter.deleteSpeed} oninput={onMutate} />
        </label>
        <label>Каретка
          <select bind:value={draft.effects.typewriter.caret} onchange={onMutate}>
            <option value="bar">Bar |</option>
            <option value="block">Block █</option>
            <option value="underscore">Underscore _</option>
            <option value="none">Скрыть</option>
          </select>
        </label>
      </div>
      <div class="tag-row">
        <input type="text" placeholder="Новая фраза для печатной машинки..." bind:value={newPhrase} onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addPhrase())} />
        <button type="button" class="adm-btn" onclick={addPhrase}>+ Фраза</button>
      </div>
      <div class="tag-pills">
        {#each draft.effects.typewriter.phrases as ph, idx}
          <button type="button" class="tag-chip" onclick={() => { draft.effects.typewriter.phrases = draft.effects.typewriter.phrases.filter((_, i) => i !== idx); onMutate(); }}>{ph} ×</button>
        {/each}
      </div>
    </div>
  {/if}
</div>
