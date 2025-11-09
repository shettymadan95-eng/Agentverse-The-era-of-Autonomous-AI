export const tools = {
  search: async (query) => {
    return `🔍 (Simulated Search) Results for "${query}" found.`;
  },

  todo: async (task) => {
    return `📝 Added "${task}" to your to-do list (simulated).`;
  },

  memory: async (note, fs, filePath) => {
    const data = JSON.parse(await fs.readFile(filePath, "utf-8"));
    data.notes.push({ note, time: new Date().toISOString() });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return `💾 Remembered: "${note}"`;
  }
};
