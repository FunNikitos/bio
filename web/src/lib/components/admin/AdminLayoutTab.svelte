<script lang="ts">
  import type { ProfileConfigV1 } from '../../schema/profile';

  interface Props {
    draft: ProfileConfigV1;
    advanced: boolean;
    onMutate: () => void;
  }

  let { draft = $bindable(), advanced, onMutate }: Props = $props();
</script>

<div class="adm-group">
  <h3>Режим страницы и раскладка</h3>
  <div class="adm-grid3">
    <label>Режим страницы (Page Mode)
      <select bind:value={draft.layout.pageMode} onchange={onMutate}>
        <option value="card">Card (основной)</option>
        <option value="sections">Sections (секции)</option>
        <option value="terminal">Terminal (CLI-режим)</option>
      </select>
    </label>
    <label>Раскладка (Layout)
      <select bind:value={draft.layout.cardLayout} onchange={onMutate}>
        <option value="classic">Classic</option>
        <option value="compact">Compact (горизонтальный)</option>
        <option value="stacked">Stacked</option>
        <option value="float">Float (островки)</option>
        <option value="bento">Bento Grid (2 колонки)</option>
        <option value="cinematic-split">Cinematic Split</option>
        <option value="dock-bottom-left">Dock Bottom-Left (952)</option>
        <option value="horizon">Horizon (ID-карта)</option>
        <option value="transparent">Transparent (Cardless)</option>
      </select>
    </label>
    <label>Выравнивание
      <select bind:value={draft.layout.alignment} onchange={onMutate}>
        <option value="center">По центру</option>
        <option value="left">Слева</option>
        <option value="right">Справа</option>
      </select>
    </label>
  </div>

  {#if draft.layout.pageMode === 'sections'}
    <div class="adm-grid3">
      <label>Индикатор точек
        <select bind:value={draft.layout.sectionMode.dotsSide} onchange={onMutate}>
          <option value="right">Справа</option>
          <option value="left">Слева</option>
          <option value="hidden">Скрыть</option>
        </select>
      </label>
      <label>Подсказка скролла
        <input type="text" maxlength="50" bind:value={draft.layout.sectionMode.scrollHint} oninput={onMutate} />
      </label>
      <div class="adm-checks">
        <label class="chk"><input type="checkbox" bind:checked={draft.layout.sectionMode.wide} onchange={onMutate} /> Широкие секции</label>
      </div>
    </div>
  {:else if draft.layout.pageMode === 'terminal'}
    <div class="adm-grid3">
      <label>Имя промпта
        <input type="text" maxlength="24" bind:value={draft.layout.terminalMode.promptName} oninput={onMutate} />
      </label>
      <label>Цвет терминала
        <select bind:value={draft.layout.terminalMode.theme} onchange={onMutate}>
          <option value="accent">Accent</option>
          <option value="green">Green</option>
          <option value="amber">Amber</option>
          <option value="white">White</option>
        </select>
      </label>
      <label>Скорость: {draft.layout.terminalMode.typingSpeed}
        <input type="range" min="1" max="10" step="1" bind:value={draft.layout.terminalMode.typingSpeed} oninput={onMutate} />
      </label>
    </div>
  {/if}
</div>

<div class="adm-group">
  <h3>Карточка, стекло и границы</h3>
  <div class="adm-grid2">
    <label>Стиль карточки
      <select bind:value={draft.layout.cardStyle} onchange={onMutate}>
        <option value="classic">Classic</option>
        <option value="frosted">Frosted Glass</option>
        <option value="aurora">Aurora Glow</option>
        <option value="outlined">Outlined</option>
        <option value="transparent">Transparent</option>
      </select>
    </label>
    <label>Заливка поверхности
      <select bind:value={draft.layout.cardSurfacePattern} onchange={onMutate}>
        <option value="solid">Solid</option>
        <option value="gradient">Gradient</option>
        <option value="aurora">Aurora</option>
        <option value="grid">Grid</option>
        <option value="dots">Dots</option>
        <option value="glow">Glow</option>
      </select>
    </label>
  </div>

  <div class="adm-grid2">
    <label>Прозрачность карточки: {draft.layout.cardOpacity}%
      <input type="range" min="0" max="100" step="1" bind:value={draft.layout.cardOpacity} oninput={onMutate} />
    </label>
    <label>Размытие стекла (Blur): {draft.layout.cardBlur}px
      <input type="range" min="0" max="50" step="1" bind:value={draft.layout.cardBlur} oninput={onMutate} />
    </label>
    <label>Скругление углов: {draft.layout.cardRadius}px
      <input type="range" min="0" max="40" step="1" bind:value={draft.layout.cardRadius} oninput={onMutate} />
    </label>
    <label>Ширина карточки: {draft.layout.cardWidth}px
      <input type="range" min="340" max="920" step="10" bind:value={draft.layout.cardWidth} oninput={onMutate} />
    </label>
  </div>

  {#if advanced}
    <div class="adm-grid3">
      <label>Масштаб (Page scale): {draft.layout.pageScale}%
        <select bind:value={draft.layout.pageScale} onchange={onMutate}>
          <option value={100}>100% (Standard)</option>
          <option value={115}>115% (Vaults Default)</option>
          <option value={125}>125% (Bigger)</option>
          <option value={138}>138% (Medium)</option>
          <option value={150}>150% (Large)</option>
        </select>
      </label>
      <label>Высота (0=Auto): {draft.layout.cardHeight}px
        <input type="range" min="0" max="900" step="20" bind:value={draft.layout.cardHeight} oninput={onMutate} />
      </label>
      <label>Затухание контента: {draft.layout.cardContentFade}%
        <input type="range" min="40" max="100" step="5" bind:value={draft.layout.cardContentFade} oninput={onMutate} />
      </label>
    </div>

    <div class="adm-grid3">
      <label>Стиль рамки
        <select bind:value={draft.layout.borderStyle} onchange={onMutate}>
          <option value="none">None</option>
          <option value="subtle">Subtle</option>
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
          <option value="glow">Glow</option>
        </select>
      </label>
      <label>Толщина рамки: {draft.layout.borderWidth}px
        <input type="range" min="0" max="8" step="1" bind:value={draft.layout.borderWidth} oninput={onMutate} />
      </label>
      <label>Анимация рамки
        <select bind:value={draft.layout.borderAnimated} onchange={onMutate}>
          <option value="none">Нет</option>
          <option value="two-corners">Two Corners</option>
          <option value="single-line">Single Line</option>
          <option value="rainbow">Rainbow</option>
        </select>
      </label>
    </div>
  {/if}
</div>

<div class="adm-group">
  <h3>3D-наклон, анимация входа и угловые виджеты</h3>
  <div class="adm-grid3">
    <label>Анимация появления
      <select bind:value={draft.layout.entranceAnimation} onchange={onMutate}>
        <option value="none">None</option>
        <option value="rise">Rise</option>
        <option value="fade">Fade</option>
        <option value="zoom">Zoom</option>
        <option value="blur">Blur</option>
        <option value="drop">Drop</option>
        <option value="flip">Flip</option>
        <option value="slide">Slide</option>
        <option value="swing">Swing</option>
        <option value="bounce">Bounce</option>
        <option value="spin">Spin</option>
        <option value="unfold">Unfold</option>
        <option value="cascade">Cascade</option>
      </select>
    </label>
    <label>Наведение на карточку
      <select bind:value={draft.layout.cardHoverEffect} onchange={onMutate}>
        <option value="none">None</option>
        <option value="lift">Lift</option>
        <option value="scale">Scale</option>
        <option value="glow">Glow</option>
      </select>
    </label>
    <label>Задержка карточки: {draft.layout.cardDelaySec}с
      <input type="range" min="0" max="6" step="0.5" bind:value={draft.layout.cardDelaySec} oninput={onMutate} />
    </label>
  </div>

  <div class="adm-grid3">
    <label class="chk"><input type="checkbox" bind:checked={draft.layout.tiltEnabled} onchange={onMutate} /> 3D Tilt (наклон)</label>
    <label>Режим наклона
      <select bind:value={draft.layout.tiltMode} onchange={onMutate}>
        <option value="screen">Screen Tilt</option>
        <option value="parallax">Classic Parallax</option>
      </select>
    </label>
    <label>Сила наклона: {draft.layout.tiltStrength}
      <input type="range" min="1" max="10" step="1" bind:value={draft.layout.tiltStrength} oninput={onMutate} />
    </label>
  </div>

  <div class="adm-grid2">
    <label>Позиция счётчика просмотров/лайков
      <select bind:value={draft.layout.cornerWidgets.views} onchange={onMutate}>
        <option value="bottom-left">Нижний левый угол экрана</option>
        <option value="bottom-right">Нижний правый угол экрана</option>
        <option value="top-left">Верхний левый угол экрана</option>
        <option value="top-right">Верхний правый угол экрана</option>
        <option value="card-bottom-left">Низ карточки слева (как guns.lol)</option>
        <option value="card-bottom-right">Низ карточки справа</option>
        <option value="inline">Внутри карточки по центру</option>
        <option value="hidden">Скрыт</option>
      </select>
    </label>
    <label>Позиция плеера
      <select bind:value={draft.layout.cornerWidgets.audio} onchange={onMutate}>
        <option value="detached">Отдельная плашка снизу</option>
        <option value="inline">Внутри карточки</option>
        <option value="bottom-left">Нижний левый угол</option>
        <option value="bottom-right">Нижний правый угол</option>
        <option value="top-left">Верхний левый угол</option>
        <option value="top-right">Верхний правый угол</option>
        <option value="hidden">Скрыт</option>
      </select>
    </label>
  </div>
  <div class="adm-checks">
    <label class="chk"><input type="checkbox" bind:checked={draft.layout.blocksBeforeLinks} onchange={onMutate} /> Показывать блоки (Discord и др.) перед ссылками</label>
  </div>
</div>
