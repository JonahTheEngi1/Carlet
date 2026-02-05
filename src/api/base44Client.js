// Mock Base44 client replacement for local/dev use.
// Drop this file at src/api/base44Client.js to remove runtime dependency on @base44/sdk.
// It stores state in localStorage under "carlet_mock_db" and exposes the same methods used by the app.

const STORAGE_KEY = "carlet_mock_db_v1";

function nowIso() {
  return new Date().toISOString();
}

function readDB() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = {
      users: [
        {
          id: "u1",
          email: "admin@example.com",
          full_name: "Local Admin",
          role: "admin",
          is_platform_admin: true,
          location_id: "loc1"
        }
      ],
      locations: [
        {
          id: "loc1",
          name: "Local Shop",
          timezone: "UTC",
          stages: [
            { id: "s1", name: "Check In", color: "#f59e0b" },
            { id: "s2", name: "Inspection", color: "#06b6d4" },
            { id: "s3", name: "Repair", color: "#10b981" },
            { id: "s4", name: "Check Out", color: "#6366f1" }
          ]
        }
      ],
      cars: [],
      parts: [],
      notes: [],
      files: [] // { id, name, dataUrl, created_date }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    const fallback = {};
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    return fallback;
  }
}

function writeDB(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function nextId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function matchesFilter(item, filter) {
  if (!filter) return true;
  return Object.keys(filter).every(key => {
    const val = filter[key];
    if (Array.isArray(val)) return val.includes(item[key]);
    return item[key] === val;
  });
}

function makeEntityHelpers(entityName) {
  return {
    filter: (filter = {}, sort) =>
      new Promise((resolve) => {
        const db = readDB();
        const list = (db[entityName] || []).filter(i => matchesFilter(i, filter));
        if (typeof sort === "string" && sort.startsWith("-")) {
          const field = sort.slice(1);
          list.sort((a, b) => (a[field] < b[field] ? 1 : -1));
        }
        resolve(list);
      }),
    list: () =>
      new Promise((resolve) => {
        const db = readDB();
        resolve(db[entityName] || []);
      }),
    create: (data) =>
      new Promise((resolve) => {
        const db = readDB();
        const item = { ...data, id: nextId(entityName), created_date: nowIso(), updated_date: nowIso() };
        db[entityName] = db[entityName] || [];
        db[entityName].push(item);
        writeDB(db);
        resolve(item);
      }),
    update: (id, newData) =>
      new Promise((resolve, reject) => {
        const db = readDB();
        db[entityName] = db[entityName] || [];
        const idx = db[entityName].findIndex(i => i.id === id);
        if (idx === -1) {
          reject(new Error(`${entityName} ${id} not found`));
          return;
        }
        const updated = { ...db[entityName][idx], ...newData, updated_date: nowIso() };
        db[entityName][idx] = updated;
        writeDB(db);
        resolve(updated);
      }),
    getById: (id) =>
      new Promise((resolve) => {
        const db = readDB();
        const found = (db[entityName] || []).find(i => i.id === id);
        resolve(found || null);
      })
  };
}

const VIN_YEAR_MAP = {
  A: 2010, B: 2011, C: 2012, D: 2013, E: 2014, F: 2015, G: 2016, H: 2017,
  J: 2018, K: 2019, L: 2020, M: 2021, N: 2022, P: 2023, R: 2024, S: 2025,
  T: 2026, V: 2027, W: 2028, X: 2029, Y: 2030, 1: 2001, 2: 2002, 3: 2003,
  4: 2004, 5: 2005, 6: 2006, 7: 2007, 8: 2008, 9: 2009
};

const base44 = {
  auth: {
    me: async () => {
      const db = readDB();
      return db.users && db.users[0] ? db.users[0] : null;
    },
    logout: async () => true
  },

  appLogs: {
    logUserInApp: async (pageName) => {
      console.log("[mock base44] logUserInApp:", pageName);
      return Promise.resolve();
    }
  },

  entities: {
    Car: makeEntityHelpers("cars"),
    Location: {
      ...makeEntityHelpers("locations"),
      list: () => makeEntityHelpers("locations").list()
    },
    Part: makeEntityHelpers("parts"),
    Note: makeEntityHelpers("notes")
  },

  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        if (!file) return { file_url: "" };
        function toDataUrl(fileObj) {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(fileObj);
          });
        }
        const dataUrl = await toDataUrl(file);
        const db = readDB();
        db.files = db.files || [];
        const fileRecord = {
          id: nextId("file"),
          name: file.name || "upload",
          dataUrl,
          created_date: nowIso()
        };
        db.files.push(fileRecord);
        writeDB(db);
        return { file_url: dataUrl };
      },

      InvokeLLM: async ({ prompt }) => {
        try {
          const m = prompt && prompt.match(/Decode this VIN:\s*([A-Za-z0-9]{17})/i);
          if (m) {
            const vin = m[1].toUpperCase();
            const yearCode = vin[9];
            const year = VIN_YEAR_MAP[yearCode] || null;
            return {
              year: year || null,
              make: "",
              model: "",
              trim: ""
            };
          }
        } catch (e) {}
        return { year: null, make: "", model: "", trim: "" };
      }
    }
  }
};

export { base44 };