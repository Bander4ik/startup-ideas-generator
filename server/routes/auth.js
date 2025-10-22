import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { generateToken } from '../auth.js';

const router = express.Router();

// Реєстрація
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Всі поля обов\'язкові' });
    }

    // Перевірка чи користувач вже існує
    const existingUser = db.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Користувач з таким email вже існує' });
    }

    // Хешування паролю
    const hashedPassword = await bcrypt.hash(password, 10);

    // Створення користувача
    const result = db.createUser(email, hashedPassword, name);

    const token = generateToken(result.lastInsertRowid);

    res.status(201).json({
      message: 'Користувача успішно зареєстровано',
      token,
      user: {
        id: result.lastInsertRowid,
        email,
        name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Помилка реєстрації' });
  }
});

// Вхід
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email та пароль обов\'язкові' });
    }

    // Пошук користувача
    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Невірний email або пароль' });
    }

    // Перевірка паролю
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Невірний email або пароль' });
    }

    const token = generateToken(user.id);

    res.json({
      message: 'Успішний вхід',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Помилка входу' });
  }
});

export default router;
