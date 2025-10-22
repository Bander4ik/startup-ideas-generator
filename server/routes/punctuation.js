import express from 'express';
import { addPunctuation } from '../groq.js';

const router = express.Router();

// Додавання розділових знаків до тексту
router.post('/add', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Текст не може бути порожнім' });
    }

    const punctuatedText = await addPunctuation(text);
    res.json({ text: punctuatedText });
  } catch (error) {
    console.error('Punctuation error:', error);
    res.status(500).json({ error: 'Помилка обробки тексту' });
  }
});

export default router;
