import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db.js';
import { authMiddleware } from './auth.js';
import authRoutes from './routes/auth.js';
import ideasRoutes from './routes/ideas.js';
import chatRoutes from './routes/chat.js';
import punctuationRoutes from './routes/punctuation.js';
import { generateStartupIdea } from './groq.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://startup-ideas-app.onrender.com', // Оновиш на свій URL після деплою
        process.env.FRONTEND_URL
      ].filter(Boolean)
    : ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Ініціалізація бази даних
initDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ideas', authMiddleware, ideasRoutes);
app.use('/api/chat', authMiddleware, chatRoutes);
app.use('/api/punctuation', punctuationRoutes);

// Гостьовий режим - генерація без авторизації
app.post('/api/guest/generate', async (req, res) => {
  try {
    const { topic } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Тема обов\'язкова' });
    }

    // Генерація ідеї без збереження
    const ideaContent = await generateStartupIdea(topic, []);
    
    // Витягування назви з контенту
    const titleMatch = ideaContent.match(/\*\*Назва ідеї:\*\*\s*\n(.+)/);
    const title = titleMatch ? titleMatch[1].trim() : topic;

    res.json({
      id: null,
      title,
      content: ideaContent,
      topic,
      created_at: new Date().toISOString(),
      isGuest: true
    });
  } catch (error) {
    console.error('Guest generate error:', error);
    res.status(500).json({ error: 'Помилка генерації ідеї' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
