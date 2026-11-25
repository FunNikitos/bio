<script lang="ts">
  import { api } from './lib/engine/apiClient';
  import { createDefaultProfile, normalizeProfile, type ProfileConfigV1 } from './lib/schema/profile';
  import ProfileView from './lib/components/profile/ProfileView.svelte';
  import AdminApp from './lib/components/admin/AdminApp.svelte';

  const isAdmin = $derived(typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'));
  const previewDraft = $derived(
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === 'draft'
  );

  let profile = $state<ProfileConfigV1>(createDefaultProfile());
  let views = $state(0);
  let likes = $state(0);
  let loaded = $state(false);
  let errorMsg = $state('');

  $effect(() => {
    if (isAdmin) return;
    let active = true;
    (async () => {
      try {
        const res = await api.getPublicProfile(previewDraft);
        if (!active) return;
        profile = normalizeProfile(res.profile);
        views = res.analytics.views;
        likes = res.analytics.likes;
        loaded = true;
        if (!previewDraft && profile.analytics.trackViews) {
          void api.recordView().then((v) => { if (active) views = v.views; }).catch(() => {});
        }
      } catch (err) {
        if (!active) return;
        errorMsg = err instanceof Error ? err.message : 'Ошибка загрузки профиля';
        loaded = true;
      }
    })();
    return () => { active = false; };
  });
</script>

{#if isAdmin}
  <AdminApp />
{:else if !loaded}
  <div class="pub-loading">Загрузка...</div>
{:else if errorMsg}
  <div class="pub-loading">{errorMsg}</div>
{:else}
  <ProfileView
    {profile}
    {views}
    {likes}
    isPreview={previewDraft}
    onLike={() => {
      if (!previewDraft && profile.analytics.enableLikes) {
        void api.recordLike().then((r) => { likes = r.likes; }).catch(() => {});
      }
    }}
    onLinkClick={(linkId) => {
      if (!previewDraft && profile.analytics.trackClicks) {
        void api.recordClick(linkId).catch(() => {});
      }
    }}
  />
{/if}

<style>
  .pub-loading {
    min-height: 100vh;
    display: grid;
    place-items: center;
    background: #07070c;
    color: #94a3b8;
  }
</style>
