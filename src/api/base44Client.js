// Frontend adapter to the local backend API at /api/*
// Provides a minimal surface compatible with the existing app code:
// - base44.auth.me(), auth.logout()
// - base44.entities.{Car,Location,Part,Note}.filter/list/create/update
// - base44.integrations.Core.UploadFile({ file }) -> returns { file_url }
// - base44.integrations.Core.InvokeLLM({ prompt }) -> returns decoded data
// - base44.appLogs.logUserInApp(pageName)

async function request(path, opts = {}) {
  const res = await fetch(path, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

const base44 = {
  auth: {
    me: async () => request('/api/auth/me'),
    logout: async () => request('/api/auth/logout', { method: 'POST' })
  },

  appLogs: {
    logUserInApp: async (pageName) => request('/api/app-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageName })
    })
  },

  entities: {
    Car: {
      filter: async (filter = {}, sort) => {
        // map some filters to query params (we support location_id and is_archived)
        const params = new URLSearchParams();
        if (filter.location_id) params.set('location_id', filter.location_id);
        if (filter.is_archived !== undefined) params.set('is_archived', filter.is_archived);
        const url = '/api/cars' + (params.toString() ? `?${params.toString()}` : '');
        return request(url);
      },
      list: async () => request('/api/cars'),
      create: async (data) => request('/api/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }),
      update: async (id, data) => request(`/api/cars/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }),
    },
    Location: {
      list: async () => request('/api/locations'),
      filter: async (filter = {}) => {
        // basic filter emulate by fetching all and filtering client-side
        const all = await request('/api/locations');
        return all.filter(loc => {
          return Object.keys(filter).every(k => loc[k] === filter[k]);
        });
      }
    },
    Part: {
      filter: async (filter = {}) => {
        const params = new URLSearchParams();
        if (filter.car_id) params.set('car_id', filter.car_id);
        const url = '/api/parts' + (params.toString() ? `?${params.toString()}` : '');
        return request(url);
      },
      list: async () => request('/api/parts'),
      create: async (data) => request('/api/parts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
      }),
      update: async (id, data) => request(`/api/parts/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
      }),
    },
    Note: {
      filter: async (filter = {}, sort) => {
        const params = new URLSearchParams();
        if (filter.car_id) params.set('car_id', filter.car_id);
        const url = '/api/notes' + (params.toString() ? `?${params.toString()}` : '');
        return request(url);
      },
      create: async (data) => request('/api/notes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
      }),
    }
  },

  integrations: {
    Core: {
      // file: a File object
      UploadFile: async ({ file }) => {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: form });
        if (!res.ok) throw new Error('upload failed');
        return res.json(); // { file_url }
      },
      InvokeLLM: async ({ prompt }) => {
        const res = await fetch('/api/invoke-llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
        if (!res.ok) throw new Error('invoke failed');
        return res.json();
      }
    }
  }
};

export { base44 };