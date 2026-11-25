<script lang="ts">
  import type { ProfileConfigV1 } from '../../schema/profile';

  interface Props {
    draft: ProfileConfigV1;
    advanced: boolean;
    onUpload: (file: File, apply: (url: string) => void) => void;
    onMutate: () => void;
  }

  let { draft = $bindable(), advanced, onUpload, onMutate }: Props = $props();
  let newTag = $state('');

  function addTag() {
    const clean = newTag.trim();
    if (!clean || draft.identity.tags.length >= 12) return;
    draft.identity.tags = [...draft.identity.tags, clean.slice(0, 30)];
    newTag = '';
    onMutate();
  }

  function removeTag(idx: number) {
    draft.identity.tags = draft.identity.tags.filter((_, i) => i !== idx);
    onMutate();
  }

  function addBadge() {
    draft.badges.items = [
      ...draft.badges.items,
      { id: `b-${Date.now()}`, label: 'New Badge', icon: 'star', color: draft.theme.accent, visible: true }
    ];
    onMutate();
  }
</script>

<div class="adm-group">
  <h3>Личность и описание</h3>
  <div class="adm-grid2">
    <label>Имя (Display name)
      <input type="text" maxlength="48" bind:value={draft.identity.displayName} oninput={onMutate} />
    </label>
    <label>@username
      <input type="text" maxlength="32" bind:value={draft.identity.username} oninput={onMutate} />
    </label>
  </div>

  <label>Bio (поддерживает **жирный**, *курсив*, __подчёркнутый__, `код`, ||спойлер||, [ссылка](https://...))
    <textarea rows="3" maxlength="600" bind:value={draft.identity.bio} oninput={onMutate}></textarea>
  </label>

  <div class="adm-grid2">
    <label>Местоположение
      <input type="text" maxlength="60" bind:value={draft.identity.location} oninput={onMutate} />
    </label>
    <label>Статус
      <input type="text" maxlength="80" bind:value={draft.identity.status} oninput={onMutate} />
    </label>
  </div>

  {#if advanced}
    <div class="adm-grid3">
      <label>Местоимение 1
        <input type="text" maxlength="20" placeholder="he" bind:value={draft.identity.pronounsLeft} oninput={onMutate} />
      </label>
      <label>Местоимение 2
        <input type="text" maxlength="20" placeholder="him" bind:value={draft.identity.pronounsRight} oninput={onMutate} />
      </label>
      <label>UID
        <input type="number" min="1" bind:value={draft.identity.uid} oninput={onMutate} />
      </label>
    </div>

    <div class="adm-checks">
      <label class="chk"><input type="checkbox" bind:checked={draft.identity.showUsername} onchange={onMutate} /> Показывать @username</label>
      <label class="chk"><input type="checkbox" bind:checked={draft.identity.showUid} onchange={onMutate} /> Показывать UID</label>
      <label class="chk"><input type="checkbox" bind:checked={draft.identity.showJoinDate} onchange={onMutate} /> Дата регистрации</label>
      <label class="chk"><input type="checkbox" bind:checked={draft.identity.verified.enabled} onchange={onMutate} /> Галочка верификации</label>
    </div>
  {/if}

  <div class="tag-editor">
    <div class="tag-row">
      <input type="text" placeholder="Добавить тег (например, Rust)" bind:value={newTag} onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} />
      <button type="button" class="adm-btn" onclick={addTag}>+ Тег</button>
    </div>
    <div class="tag-pills">
      {#each draft.identity.tags as t, idx}
        <button type="button" class="tag-chip" onclick={() => removeTag(idx)}>{t} ×</button>
      {/each}
    </div>
  </div>
</div>

<div class="adm-group">
  <h3>Аватар и баннер</h3>
  <div class="adm-row">
    <label class="adm-upload">
      Загрузить аватар
      <input type="file" accept="image/*" onchange={(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) onUpload(f, (url) => { draft.avatar.url = url; onMutate(); }); }} />
    </label>
    <input type="text" placeholder="или URL аватара..." bind:value={draft.avatar.url} oninput={onMutate} />
    <label class="chk"><input type="checkbox" bind:checked={draft.avatar.visible} onchange={onMutate} /> Показать</label>
  </div>

  <div class="adm-grid3">
    <label>Форма
      <select bind:value={draft.avatar.shape} onchange={onMutate}>
        <option value="circle">Circle</option>
        <option value="rounded">Rounded</option>
        <option value="square">Square</option>
        <option value="hexagon">Hexagon</option>
      </select>
    </label>
    <label>Рамка
      <select bind:value={draft.avatar.frameStyle} onchange={onMutate}>
        <option value="none">None</option>
        <option value="thin">Thin</option>
        <option value="accent">Accent</option>
        <option value="gradient">Gradient</option>
        <option value="glow">Glow</option>
      </select>
    </label>
    <label>Украшение (Avatar deco)
      <select bind:value={draft.avatar.decoration} onchange={onMutate}>
        <option value="none">Нет</option>
        <option value="aurora-halo">Aurora Halo</option>
        <option value="angel-wings">Angel Wings</option>
        <option value="kitty-ears">Kitty Ears</option>
        <option value="neon-headphones">Neon Headphones</option>
        <option value="sakura-crown">Sakura Crown</option>
        <option value="frost-crown">Frost Crown</option>
        <option value="custom">Своя картинка</option>
      </select>
    </label>
  </div>

  <div class="adm-grid2">
    <label>Размер аватара: {draft.avatar.size}px
      <input type="range" min="64" max="200" step="4" bind:value={draft.avatar.size} oninput={onMutate} />
    </label>
    {#if advanced}
      <label>Размытие аватара: {draft.avatar.blur}px
        <input type="range" min="0" max="10" step="1" bind:value={draft.avatar.blur} oninput={onMutate} />
      </label>
    {/if}
  </div>

  {#if advanced}
    <div class="adm-row">
      <label class="adm-upload">
        Загрузить баннер
        <input type="file" accept="image/*" onchange={(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) onUpload(f, (url) => { draft.avatar.bannerUrl = url; onMutate(); }); }} />
      </label>
      <input type="text" placeholder="URL баннера карточки..." bind:value={draft.avatar.bannerUrl} oninput={onMutate} />
    </div>
    <div class="adm-grid2">
      <label>Затухание баннера: {draft.avatar.bannerFade}%
        <input type="range" min="0" max="100" step="5" bind:value={draft.avatar.bannerFade} oninput={onMutate} />
      </label>
      <div class="adm-checks">
        <label class="chk"><input type="checkbox" bind:checked={draft.avatar.bannerAvatarCutout} onchange={onMutate} /> Вырез под аватар (mask-image)</label>
        <label class="chk"><input type="checkbox" bind:checked={draft.avatar.expandOnClick} onchange={onMutate} /> Увеличивать по клику</label>
        <label class="chk"><input type="checkbox" bind:checked={draft.avatar.protectImage} onchange={onMutate} /> Защита от ПКМ</label>
      </div>
    </div>
  {/if}
</div>

<div class="adm-group">
  <div class="adm-head-row">
    <h3>Значки (Badges)</h3>
    <button type="button" class="adm-btn" onclick={addBadge}>+ Бейдж</button>
  </div>
  <div class="adm-grid3">
    <label>Позиция
      <select bind:value={draft.badges.placement} onchange={onMutate}>
        <option value="next-to-name">Рядом с именем</option>
        <option value="below-name">Под именем</option>
      </select>
    </label>
    <label>Оформление
      <select bind:value={draft.badges.boxStyle} onchange={onMutate}>
        <option value="none">Без рамки</option>
        <option value="one-box">Общая пилюля</option>
        <option value="each-box">Каждый в плашке</option>
      </select>
    </label>
    <label>Масштаб: {draft.badges.sizePct}%
      <input type="range" min="60" max="200" step="10" bind:value={draft.badges.sizePct} oninput={onMutate} />
    </label>
  </div>
  <div class="adm-checks">
    <label class="chk"><input type="checkbox" bind:checked={draft.badges.glow} onchange={onMutate} /> Свечение бейджей</label>
    <label class="chk"><input type="checkbox" bind:checked={draft.badges.monochrome} onchange={onMutate} /> Монохромные бейджи</label>
  </div>
  <div class="badge-list">
    {#each draft.badges.items as b, idx (b.id)}
      <div class="badge-row">
        <input type="checkbox" bind:checked={b.visible} onchange={onMutate} />
        <input type="text" bind:value={b.label} oninput={onMutate} />
        <select bind:value={b.icon} onchange={onMutate}>
          <option value="crown">Crown</option>
          <option value="code">Code</option>
          <option value="sparkles">Sparkles</option>
          <option value="shield">Shield</option>
          <option value="heart">Heart</option>
          <option value="star">Star</option>
        </select>
        <input type="color" bind:value={b.color} oninput={onMutate} />
        <button type="button" class="adm-del" onclick={() => { draft.badges.items = draft.badges.items.filter((_, i) => i !== idx); onMutate(); }}>✕</button>
      </div>
    {/each}
  </div>
</div>
