<script lang="ts">
  interface Props {
    enabled: boolean;
    style: 'blur-curtain' | 'radial-dark' | 'slit-curtain';
    text: string;
    subtitle: string;
    countdownSec: number;
    nsfwGate: boolean;
    passcode: string;
    passcodeHint: string;
    onEnter: () => void;
  }

  let {
    enabled,
    style,
    text,
    subtitle,
    countdownSec,
    nsfwGate,
    passcode,
    passcodeHint,
    onEnter
  }: Props = $props();

  let remaining = $state(0);
  let opening = $state(false);
  let passInput = $state('');
  let passError = $state('');
  let nsfwAccepted = $state(false);

  $effect(() => {
    remaining = Math.max(0, countdownSec);
    if (!enabled || countdownSec <= 0) return;
    const id = window.setInterval(() => {
      remaining = Math.max(0, remaining - 1);
      if (remaining <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  });

  function tryEnter() {
    if (remaining > 0) return;
    if (nsfwGate && !nsfwAccepted) return;
    if (passcode && passInput.trim() !== passcode) {
      passError = 'Неверный код доступа';
      return;
    }
    passError = '';
    opening = true;
    onEnter();
  }
</script>

{#if enabled || nsfwGate || passcode}
  <div
    class="bio-splash {style}"
    class:is-opening={opening}
    role="dialog"
    aria-modal="true"
    aria-label="Экран входа"
  >
    {#if style === 'slit-curtain'}
      <div class="slit-half slit-left" aria-hidden="true"></div>
      <div class="slit-half slit-right" aria-hidden="true"></div>
      <div class="slit-line" aria-hidden="true"></div>
    {/if}

    <div class="splash-inner">
      {#if nsfwGate && !nsfwAccepted}
        <p class="splash-badge">18+</p>
        <p class="splash-title">Предупреждение о контенте</p>
        <p class="splash-sub">Страница может содержать материалы для взрослой аудитории.</p>
        <button type="button" class="splash-btn" onclick={() => { nsfwAccepted = true; if (!enabled && !passcode) tryEnter(); }}>
          Продолжить (мне есть 18)
        </button>
      {:else}
        {#if passcode}
          <p class="splash-title">Доступ по коду</p>
          {#if passcodeHint}
            <p class="splash-sub">Подсказка: {passcodeHint}</p>
          {/if}
          <input
            type="password"
            class="splash-input"
            bind:value={passInput}
            placeholder="Введите код..."
            onkeydown={(e) => e.key === 'Enter' && tryEnter()}
          />
          {#if passError}
            <p class="splash-error">{passError}</p>
          {/if}
        {/if}

        <button
          type="button"
          class="splash-trigger"
          disabled={remaining > 0}
          onclick={tryEnter}
        >
          <span class="splash-main">{text || 'нажмите для входа'}</span>
          {#if subtitle}
            <span class="splash-sub">{subtitle}</span>
          {/if}
          {#if remaining > 0}
            <span class="splash-countdown">Подождите {remaining} с...</span>
          {/if}
        </button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .bio-splash {
    position: fixed;
    inset: 0;
    z-index: 9000;
    display: grid;
    place-items: center;
    padding: 24px;
    transition: opacity 0.28s ease;
  }
  .bio-splash.blur-curtain {
    background: rgba(6, 6, 12, 0.72);
    backdrop-filter: blur(22px);
    -webkit-backdrop-filter: blur(22px);
  }
  .bio-splash.radial-dark {
    background: radial-gradient(circle at 50% 45%, rgba(28, 22, 48, 0.92), #040407 78%);
  }
  .bio-splash.slit-curtain {
    background: transparent;
  }
  .slit-half {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 50%;
    background: #050509;
    transition: transform 0.42s cubic-bezier(0.77, 0, 0.18, 1);
  }
  .slit-left { left: 0; }
  .slit-right { right: 0; }
  .slit-line {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 2px;
    background: var(--bio-accent, #8b5cf6);
    opacity: 0.7;
    transition: opacity 0.25s ease;
  }
  .is-opening .slit-left { transform: translateX(-100%); }
  .is-opening .slit-right { transform: translateX(100%); }
  .is-opening .slit-line { opacity: 0; }
  .is-opening:not(.slit-curtain) { opacity: 0; pointer-events: none; }

  .splash-inner {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    text-align: center;
    max-width: 420px;
  }
  .splash-trigger {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 18px;
    padding: 18px 28px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    transition: transform 0.18s ease, border-color 0.18s ease;
  }
  .blur-curtain .splash-trigger {
    border-color: transparent;
  }
  .splash-trigger:hover:not(:disabled) {
    transform: scale(1.02);
    border-color: var(--bio-accent, #8b5cf6);
  }
  .splash-main {
    font-size: 1.2rem;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  .splash-title {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
  }
  .splash-sub {
    margin: 0;
    font-size: 0.88rem;
    opacity: 0.72;
  }
  .splash-countdown {
    font-size: 0.82rem;
    color: var(--bio-accent, #8b5cf6);
  }
  .splash-badge {
    margin: 0;
    padding: 4px 12px;
    border-radius: 999px;
    border: 1px solid #f43f5e;
    color: #fda4af;
    font-weight: 700;
    font-size: 0.85rem;
  }
  .splash-input {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    padding: 9px 14px;
    min-width: 220px;
  }
  .splash-btn {
    padding: 10px 18px;
    border-radius: 12px;
    border: none;
    background: var(--bio-accent, #8b5cf6);
    color: #fff;
    font-weight: 600;
    cursor: pointer;
  }
  .splash-error {
    margin: 0;
    color: #fda4af;
    font-size: 0.85rem;
  }
</style>
