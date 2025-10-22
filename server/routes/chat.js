import express from 'express';
import db from '../db.js';
import { chatWithContext } from '../groq.js';

const router = express.Router();

// Відправка повідомлення в чат
router.post('/', async (req, res) => {
  try {
    const { message, idea_id } = req.body;
    const userId = req.userId;

    if (!message) {
      return res.status(400).json({ error: 'Повідомлення обов\'язкове' });
    }

    let ideaContext = null;

    // Якщо є idea_id, отримуємо контекст ідеї
    if (idea_id) {
      const idea = db.getIdeaById(parseInt(idea_id), userId);
      if (idea) {
        ideaContext = idea.content;
      }
    }

    // Отримання історії чату для цієї ідеї (останні 10 повідомлень)
    const chatHistory = db.getChatHistory(userId, idea_id ? parseInt(idea_id) : null, 10);

    // Формування повідомлень для Groq API
    const messages = [
      ...chatHistory.reverse().map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // Збереження повідомлення користувача
    db.createChatMessage(userId, idea_id ? parseInt(idea_id) : null, 'user', message);

    // Отримання відповіді від AI
    const aiResponse = await chatWithContext(messages, ideaContext);

    // Збереження відповіді AI
    const result = db.createChatMessage(userId, idea_id ? parseInt(idea_id) : null, 'assistant', aiResponse);

    res.json({
      id: result.lastInsertRowid,
      role: 'assistant',
      content: aiResponse,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Помилка обробки повідомлення' });
  }
});

// Отримання історії чату
router.get('/history', (req, res) => {
  try {
    const userId = req.userId;
    const { idea_id } = req.query;

    const history = db.getAllChatHistory(userId, idea_id ? parseInt(idea_id) : null);

    res.json(history);
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Помилка отримання історії' });
  }
});

// Очищення історії чату
router.delete('/history', (req, res) => {
  try {
    const userId = req.userId;
    const { idea_id } = req.query;

    db.clearChatHistory(userId, idea_id ? parseInt(idea_id) : null);

    res.json({ message: 'Історію чату очищено' });
  } catch (error) {
    console.error('Clear chat history error:', error);
    res.status(500).json({ error: 'Помилка очищення історії' });
  }
});

export default router;
