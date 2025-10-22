import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = join(__dirname, '..', 'data');
const dbFile = join(dataDir, 'database.json');

// Структура бази даних
let db = {
  users: [],
  ideas: [],
  chatHistory: [],
  userFeedback: [],
  _counters: {
    users: 1,
    ideas: 1,
    chatHistory: 1,
    userFeedback: 1
  }
};

// Завантаження бази даних
function loadDatabase() {
  if (existsSync(dbFile)) {
    const data = readFileSync(dbFile, 'utf8');
    db = JSON.parse(data);
  }
}

// Збереження бази даних
function saveDatabase() {
  writeFileSync(dbFile, JSON.stringify(db, null, 2), 'utf8');
}

export function initDatabase() {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  loadDatabase();
  console.log('✅ Database initialized successfully');
}

// Helper функції для роботи з даними
export const dbHelpers = {
  // Users
  createUser(email, password, name) {
    const id = db._counters.users++;
    const user = {
      id,
      email,
      password,
      name,
      created_at: new Date().toISOString()
    };
    db.users.push(user);
    saveDatabase();
    return { lastInsertRowid: id };
  },
  
  findUserByEmail(email) {
    return db.users.find(u => u.email === email);
  },
  
  findUserById(id) {
    return db.users.find(u => u.id === id);
  },

  // Ideas
  createIdea(userId, title, content, topic) {
    const id = db._counters.ideas++;
    const idea = {
      id,
      user_id: userId,
      title,
      content,
      topic,
      rating: 0,
      is_saved: false,
      is_read: false,
      created_at: new Date().toISOString()
    };
    db.ideas.push(idea);
    saveDatabase();
    return { lastInsertRowid: id };
  },
  
  getIdeasByUser(userId, savedOnly = false) {
    let ideas = db.ideas.filter(i => i.user_id === userId);
    if (savedOnly) {
      ideas = ideas.filter(i => i.is_saved);
    }
    return ideas.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },
  
  getIdeaById(id, userId) {
    return db.ideas.find(i => i.id === id && i.user_id === userId);
  },
  
  updateIdea(id, userId, updates) {
    const index = db.ideas.findIndex(i => i.id === id && i.user_id === userId);
    if (index !== -1) {
      db.ideas[index] = { ...db.ideas[index], ...updates };
      saveDatabase();
      return { changes: 1 };
    }
    return { changes: 0 };
  },
  
  deleteIdea(id, userId) {
    const index = db.ideas.findIndex(i => i.id === id && i.user_id === userId);
    if (index !== -1) {
      db.ideas.splice(index, 1);
      // Видалити пов'язані чати
      db.chatHistory = db.chatHistory.filter(c => c.idea_id !== id);
      saveDatabase();
      return { changes: 1 };
    }
    return { changes: 0 };
  },
  
  getRecentIdeaTitles(userId, limit = 20) {
    return db.ideas
      .filter(i => i.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit)
      .map(i => ({ title: i.title }));
  },

  // Chat History
  createChatMessage(userId, ideaId, role, content) {
    const id = db._counters.chatHistory++;
    const message = {
      id,
      user_id: userId,
      idea_id: ideaId || null,
      role,
      content,
      created_at: new Date().toISOString()
    };
    db.chatHistory.push(message);
    saveDatabase();
    return { lastInsertRowid: id };
  },
  
  getChatHistory(userId, ideaId = null, limit = 10) {
    let messages = db.chatHistory.filter(c => c.user_id === userId);
    if (ideaId !== null) {
      messages = messages.filter(c => c.idea_id === ideaId);
    } else {
      messages = messages.filter(c => c.idea_id === null);
    }
    return messages
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit)
      .reverse();
  },
  
  getAllChatHistory(userId, ideaId = null) {
    let messages = db.chatHistory.filter(c => c.user_id === userId);
    if (ideaId !== null) {
      messages = messages.filter(c => c.idea_id === ideaId);
    } else {
      messages = messages.filter(c => c.idea_id === null);
    }
    return messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  },
  
  clearChatHistory(userId, ideaId = null) {
    if (ideaId !== null) {
      db.chatHistory = db.chatHistory.filter(c => !(c.user_id === userId && c.idea_id === ideaId));
    } else {
      db.chatHistory = db.chatHistory.filter(c => !(c.user_id === userId && c.idea_id === null));
    }
    saveDatabase();
  },

  // Feedback
  createFeedback(userId, ideaId, feedbackType, comment) {
    const id = db._counters.userFeedback++;
    const feedback = {
      id,
      user_id: userId,
      idea_id: ideaId,
      feedback_type: feedbackType,
      comment: comment || null,
      created_at: new Date().toISOString()
    };
    db.userFeedback.push(feedback);
    saveDatabase();
    return { lastInsertRowid: id };
  }
};

export default dbHelpers;
