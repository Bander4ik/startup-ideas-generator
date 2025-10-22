import express from 'express';
import db from '../db.js';
import { generateStartupIdea } from '../groq.js';

const router = express.Router();

// Генерація нової ідеї
router.post('/generate', async (req, res) => {
  try {
    const { topic } = req.body;
    const userId = req.userId;

    if (!topic) {
      return res.status(400).json({ error: 'Тема обов\'язкова' });
    }

    // Отримання попередніх ідей користувача для уникнення повторів
    const previousIdeas = db.getRecentIdeaTitles(userId, 20);

    // Генерація ідеї
    const ideaContent = await generateStartupIdea(topic, previousIdeas);

    // Витягування назви з контенту
    const titleMatch = ideaContent.match(/\*\*Назва ідеї:\*\*\s*\n(.+)/);
    const title = titleMatch ? titleMatch[1].trim() : topic;

    // Збереження ідеї
    const result = db.createIdea(userId, title, ideaContent, topic);

    res.json({
      id: result.lastInsertRowid,
      title,
      content: ideaContent,
      topic,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Generate idea error:', error);
    res.status(500).json({ error: 'Помилка генерації ідеї' });
  }
});

// Отримання всіх ідей користувача
router.get('/', (req, res) => {
  try {
    const userId = req.userId;
    const { saved_only } = req.query;

    const ideas = db.getIdeasByUser(userId, saved_only === 'true');

    res.json(ideas);
  } catch (error) {
    console.error('Get ideas error:', error);
    res.status(500).json({ error: 'Помилка отримання ідей' });
  }
});

// Отримання конкретної ідеї
router.get('/:id', (req, res) => {
  try {
    const userId = req.userId;
    const ideaId = req.params.id;

    const idea = db.getIdeaById(parseInt(ideaId), userId);

    if (!idea) {
      return res.status(404).json({ error: 'Ідею не знайдено' });
    }

    // Автоматично позначаємо як прочитану
    if (!idea.is_read) {
      db.updateIdea(parseInt(ideaId), userId, { is_read: true });
      idea.is_read = true;
    }

    res.json(idea);
  } catch (error) {
    console.error('Get idea error:', error);
    res.status(500).json({ error: 'Помилка отримання ідеї' });
  }
});

// Оновлення ідеї (збереження, оцінка)
router.patch('/:id', (req, res) => {
  try {
    const userId = req.userId;
    const ideaId = req.params.id;
    const { is_saved, rating } = req.body;

    const updates = {};

    if (typeof is_saved !== 'undefined') {
      updates.is_saved = is_saved;
    }

    if (typeof rating !== 'undefined') {
      updates.rating = rating;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Немає даних для оновлення' });
    }

    const result = db.updateIdea(parseInt(ideaId), userId, updates);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Ідею не знайдено' });
    }

    const updatedIdea = db.getIdeaById(parseInt(ideaId), userId);

    res.json(updatedIdea);
  } catch (error) {
    console.error('Update idea error:', error);
    res.status(500).json({ error: 'Помилка оновлення ідеї' });
  }
});

// Видалення ідеї
router.delete('/:id', (req, res) => {
  try {
    const userId = req.userId;
    const ideaId = req.params.id;

    const result = db.deleteIdea(parseInt(ideaId), userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Ідею не знайдено' });
    }

    res.json({ message: 'Ідею успішно видалено' });
  } catch (error) {
    console.error('Delete idea error:', error);
    res.status(500).json({ error: 'Помилка видалення ідеї' });
  }
});

// Додавання фідбеку
router.post('/:id/feedback', (req, res) => {
  try {
    const userId = req.userId;
    const ideaId = req.params.id;
    const { feedback_type, comment } = req.body;

    if (!feedback_type) {
      return res.status(400).json({ error: 'Тип фідбеку обов\'язковий' });
    }

    db.createFeedback(userId, parseInt(ideaId), feedback_type, comment || null);

    res.json({ message: 'Фідбек збережено' });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ error: 'Помилка збереження фідбеку' });
  }
});

export default router;
