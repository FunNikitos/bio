<script lang="ts">
  import type { ProfileConfigV1 } from '../../schema/profile';
  import { GRADIENT_PRESETS } from '../../schema/presets';

  interface Props {
    draft: ProfileConfigV1;
    advanced: boolean;
    onUpload: (file: File, apply: (url: string) => void) => void;
    onMutate: () => void;
  }

  let { draft = $bindable(), advanced, onUpload, onMutate }: Props = $props();
</script>

<div class="adm-group">
  <h3>4-слойный фон и частицы</h3>
  <div class="adm-grid3">
    <label>Тип фона
      <select bind:value={draft.effects.background.type} onchange={onMutate}>
        <option value="solid">Solid Color</option>
        <option value="linear">Linear Gradient</option>
        <option value="radial">Radial Gradient</option>
        <option value="image">Image / GIF</option>
        <option value="video">Video Loop (MP4/WebM)</option>
      </select>
    </label>
    <label>Цвет 1
      <input type="color" bind:value={draft.effects.background.color1} oninput={onMutate} />
    </label>
    <label>Цвет 2
      <input type="color" bind:value={draft.effects.background.color2} oninput={onMutate} />
    </label>
  </div>

  {#if draft.effects.background.type === 'linear'}
    <label>Угол градиента: {draft.effects.background.gradientAngle}°
      <input type="range" min="0" max="360" step="5" bind:value={draft.effects.background.gradientAngle} oninput={onMutate} />
    </label>
    <div class="grad-presets">
      {#each GRADIENT_PRESETS as g}
        <button
          type="button"
          class="grad-btn"
          style="background: linear-gradient({g.angle}deg, {g.color1}, {g.color2})"
          onclick={() => {
            draft.effects.background.color1 = g.color1;
            draft.effects.background.color2 = g.color2;
            draft.effects.background.gradientAngle = g.angle;
            onMutate();
          }}
        >{g.name}</button>
      {/each}
    </div>
  {/if}

  {#if draft.effects.background.type === 'image' || draft.effects.background.type === 'video'}
    <div class="adm-row">
      <label class="adm-upload">
        Загрузить медиа фона
        <input type="file" accept="image/*,video/mp4,video/webm" onchange={(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) onUpload(f, (url) => { draft.effects.background.mediaUrl = url; onMutate(); }); }} />
      </label>
      <input type="text" placeholder="URL фона (image/mp4)..." bind:value={draft.effects.background.mediaUrl} oninput={onMutate} />
    </div>
    {#if draft.effects.background.type === 'video'}
      <div class="adm-row">
        <label class="adm-upload">
          Загрузить постер
          <input type="file" accept="image/*" onchange={(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) onUpload(f, (url) => { draft.effects.background.posterUrl = url; onMutate(); }); }} />
        </label>
        <input type="text" placeholder="URL постера при ошибке/паузе видео..." bind:value={draft.effects.background.posterUrl} oninput={onMutate} />
      </div>
    {/if}
  {/if}

  <div class="adm-grid3">
    <label>CSS-фильтр фона
      <select bind:value={draft.effects.background.filter} onchange={onMutate}>
        <option value="none">Нет</option>
        <option value="dots">Dot Screen</option>
        <option value="grain">Film Grain</option>
        <option value="vignette">Vignette</option>
        <option value="blur">Blurred</option>
        <option value="night">Night</option>
        <option value="old-tv">Old TV (Scanlines)</option>
      </select>
    </label>
    <label>Эффект частиц (Canvas)
      <select bind:value={draft.effects.background.particleEffect} onchange={onMutate}>
        <option value="none">Нет</option>
        <option value="stars">Stars</option>
        <option value="snow">Snow</option>
        <option value="rain">Rain</option>
        <option value="diagonal-rain">Diagonal Rain</option>
        <option value="embers">Embers</option>
        <option value="fireflies">Fireflies</option>
        <option value="sakura">Sakura Petals</option>
        <option value="matrix">Matrix Rain</option>
        <option value="bubbles">Bubbles</option>
        <option value="confetti">Confetti</option>
        <option value="geometric">Geometric Mesh</option>
      </select>
    </label>
    <label>Затемнение (Dim): {draft.effects.background.dim}%
      <input type="range" min="0" max="90" step="1" bind:value={draft.effects.background.dim} oninput={onMutate} />
    </label>
  </div>

  {#if advanced}
    <div class="adm-grid3">
      <label>Размытие медиа: {draft.effects.background.mediaBlur}px
        <input type="range" min="0" max="40" step="1" bind:value={draft.effects.background.mediaBlur} oninput={onMutate} />
      </label>
      <label>Подложка (Wash): {draft.effects.background.washStrength}%
        <input type="range" min="0" max="100" step="5" bind:value={draft.effects.background.washStrength} oninput={onMutate} />
      </label>
      <label>Интенсивность частиц: {draft.effects.background.particleIntensity}x
        <input type="range" min="0.2" max="2.5" step="0.1" bind:value={draft.effects.background.particleIntensity} oninput={onMutate} />
      </label>
    </div>
    <div class="adm-grid3">
      <label>Цвет подложки (Wash)
        <input type="color" bind:value={draft.effects.background.colorWash} oninput={onMutate} />
      </label>
      <label>Прозрачность видео: {draft.effects.background.videoOpacity}%
        <input type="range" min="10" max="100" step="5" bind:value={draft.effects.background.videoOpacity} oninput={onMutate} />
      </label>
      <label class="chk"><input type="checkbox" bind:checked={draft.effects.background.videoMuted} onchange={onMutate} /> Видео без звука</label>
    </div>
  {/if}
</div>

<div class="adm-group">
  <h3>Экран входа (Splash)</h3>
  <label class="chk"><input type="checkbox" bind:checked={draft.effects.splash.enabled} onchange={onMutate} /> Включить экран «Click to enter»</label>
  {#if draft.effects.splash.enabled}
    <div class="adm-grid3">
      <label>Стиль шторки
        <select bind:value={draft.effects.splash.style} onchange={onMutate}>
          <option value="blur-curtain">Blur Curtain</option>
          <option value="radial-dark">Radial Dark</option>
          <option value="slit-curtain">Vertical Slit Curtain</option>
        </select>
      </label>
      <label>Текст приглашения
        <input type="text" maxlength="60" bind:value={draft.effects.splash.text} oninput={onMutate} />
      </label>
      <label>Задержка таймера (сек): {draft.effects.splash.countdownSec}
        <input type="range" min="0" max="10" step="1" bind:value={draft.effects.splash.countdownSec} oninput={onMutate} />
      </label>
    </div>
  {/if}
</div>

<div class="adm-group">
  <h3>Курсор и звуки клика</h3>
  <div class="adm-grid3">
    <label>Шлейф курсора
      <select bind:value={draft.effects.cursor.trail} onchange={onMutate}>
        <option value="none">Нет</option>
        <option value="sparkles">Sparkles</option>
        <option value="dots">Dots</option>
        <option value="embers">Embers</option>
        <option value="rainbow">Rainbow</option>
        <option value="bubbles">Bubbles</option>
        <option value="hearts">Hearts</option>
        <option value="smoke">Smoke</option>
        <option value="ring">Ring</option>
        <option value="ghost">Ghost</option>
        <option value="oneko-cat">Oneko Pixel Cat</option>
      </select>
    </label>
    <label>Цвет шлейфа
      <input type="color" bind:value={draft.effects.cursor.trailColor} oninput={onMutate} />
    </label>
    <label>Скорость шлейфа
      <select bind:value={draft.effects.cursor.trailSpeed} onchange={onMutate}>
        <option value="slow">Slow</option>
        <option value="normal">Normal</option>
        <option value="fast">Fast</option>
      </select>
    </label>
  </div>

  <div class="adm-grid3">
    <label>Звук клика (Web Audio)
      <select bind:value={draft.effects.cursor.clickSound} onchange={onMutate}>
        <option value="none">Выкл</option>
        <option value="tap">Tap</option>
        <option value="click">Click</option>
        <option value="pop">Pop</option>
        <option value="bubble">Bubble</option>
        <option value="blip">Blip</option>
        <option value="coin">Coin</option>
      </select>
    </label>
    <label>Громкость клика: {draft.effects.cursor.clickVolume}%
      <input type="range" min="0" max="100" step="5" bind:value={draft.effects.cursor.clickVolume} oninput={onMutate} />
    </label>
    <label>URL кастомного курсора (.png/.cur)
      <input type="text" placeholder="URL или загрузка..." bind:value={draft.effects.cursor.customUrl} oninput={onMutate} />
    </label>
  </div>
</div>
