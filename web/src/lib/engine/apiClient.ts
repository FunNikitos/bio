import type { ProfileConfigV1 } from '../schema/profile';

export interface PublicStateResponse {
  profile: ProfileConfigV1;
  analytics: {
    views: number;
    likes: number;
    clicksByLink: Record<string, number>;
  };
  isPreview?: boolean;
}

export interface AdminStateResponse {
  authenticated: boolean;
  needsSetup: boolean;
  draft?: ProfileConfigV1;
  published?: ProfileConfigV1 | null;
  hasUnpublishedChanges?: boolean;
  analytics?: {
    views: number;
    likes: number;
    clicksByLink: Record<string, number>;
  };
}

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'same-origin',
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(init?.headers ?? {})
    },
    ...init
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getPublicProfile(previewDraft = false): Promise<PublicStateResponse> {
    const q = previewDraft ? '?preview=draft' : '';
    return jsonFetch(`/api/public/profile${q}`);
  },
  recordView(): Promise<{ views: number }> {
    return jsonFetch('/api/public/view', { method: 'POST', body: '{}' });
  },
  recordLike(): Promise<{ likes: number }> {
    return jsonFetch('/api/public/like', { method: 'POST', body: '{}' });
  },
  recordClick(linkId: string): Promise<{ clicks: number }> {
    return jsonFetch('/api/public/click', { method: 'POST', body: JSON.stringify({ linkId }) });
  },
  getAdminState(): Promise<AdminStateResponse> {
    return jsonFetch('/api/admin/state');
  },
  setupOwner(setupCode: string, password: string): Promise<{ ok: boolean }> {
    return jsonFetch('/api/admin/setup', { method: 'POST', body: JSON.stringify({ setupCode, password }) });
  },
  login(password: string): Promise<{ ok: boolean }> {
    return jsonFetch('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) });
  },
  logout(): Promise<{ ok: boolean }> {
    return jsonFetch('/api/admin/logout', { method: 'POST', body: '{}' });
  },
  saveDraft(draft: ProfileConfigV1): Promise<{ ok: boolean; draft: ProfileConfigV1 }> {
    return jsonFetch('/api/admin/draft', { method: 'PUT', body: JSON.stringify(draft) });
  },
  publish(): Promise<{ ok: boolean; published: ProfileConfigV1 }> {
    return jsonFetch('/api/admin/publish', { method: 'POST', body: '{}' });
  },
  importConfig(config: unknown): Promise<{ ok: boolean; draft: ProfileConfigV1 }> {
    return jsonFetch('/api/admin/import', { method: 'POST', body: JSON.stringify(config) });
  },
  async uploadFile(file: File): Promise<{ url: string; name: string; size: number }> {
    const form = new FormData();
    form.append('file', file);
    return jsonFetch('/api/admin/upload', { method: 'POST', body: form });
  }
};
