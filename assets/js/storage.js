const PREFIX = "carissa-enoch:";

export const Storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn("Storage read failed:", key, error);
      return fallback;
    }
  },

  set(key, value) {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  },

  remove(key) {
    localStorage.removeItem(PREFIX + key);
  },

  download(filename, content, type = "text/plain") {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  },

  keys() {
    return Object.keys(localStorage)
      .filter((key) => key.startsWith(PREFIX))
      .map((key) => key.replace(PREFIX, ""));
  },

  backup() {
    const data = {};
    for (const key of this.keys()) {
      data[key] = this.get(key);
    }
    return {
      app: "Carissa Enoch Study",
      exportedAt: new Date().toISOString(),
      data
    };
  },

  restore(backup) {
    if (!backup || backup.app !== "Carissa Enoch Study" || !backup.data) {
      throw new Error("This is not a valid Carissa Enoch Study backup file.");
    }
    Object.entries(backup.data).forEach(([key, value]) => this.set(key, value));
  }
};
