# 🚀 Деплой на Render

## Крок 1: Підготовка GitHub

1. Створи репозиторій на GitHub (якщо ще не створив)
2. Закоміть весь код:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/твій-username/твій-repo.git
git push -u origin main
```

## Крок 2: Реєстрація на Render

1. Йди на https://render.com
2. Зареєструйся через GitHub
3. Дозволь доступ до репозиторію

## Крок 3: Створення Backend

1. **New** → **Web Service**
2. Підключи свій GitHub репозиторій
3. Налаштування:
   - **Name:** `startup-ideas-api` (або будь-яка назва)
   - **Region:** Frankfurt
   - **Branch:** main
   - **Root Directory:** залиш порожнім
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

4. **Environment Variables** (додай):
   - `NODE_ENV` = `production`
   - `PORT` = `3001`
   - `GROQ_API_KEY` = `твій-ключ-groq`
   - `JWT_SECRET` = `будь-який-довгий-рандомний-рядок`

5. Натисни **Create Web Service**

## Крок 4: Створення Frontend

1. **New** → **Static Site**
2. Підключи той самий репозиторій
3. Налаштування:
   - **Name:** `startup-ideas-app`
   - **Region:** Frankfurt
   - **Branch:** main
   - **Root Directory:** `client`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

4. **Environment Variables** (додай):
   - `VITE_API_URL` = `https://startup-ideas-api.onrender.com` (URL твого backend)

5. Натисни **Create Static Site**

## Крок 5: Налаштування API проксі

У `client/vite.config.js` додай:

```javascript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
```

## Крок 6: Оновлення CORS на Backend

У `server/index.js` оновлюй CORS:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://startup-ideas-app.onrender.com', // твій frontend URL
    'https://твій-кастомний-домен.com' // якщо є
  ],
  credentials: true
}));
```

## Крок 7: Перевірка

1. Зачекай 5-10 хвилин поки все збудується
2. Відкрий URL фронтенду (наприклад: `https://startup-ideas-app.onrender.com`)
3. Перевір чи працює генерація ідей

## ⚠️ Важливо!

- **Перший запуск:** Backend може засинати після 15 хв неактивності (free plan)
- **Холодний старт:** Перший запит після засинання займе 20-50 секунд
- **Логи:** Дивись логи в Render Dashboard якщо щось не працює

## 🔧 Troubleshooting

### Помилка CORS:
- Перевір що додав правильний frontend URL в CORS
- Перевір що `VITE_API_URL` вказує на правильний backend

### Помилка 404:
- Перевір що `dist` папка створюється при build
- Перевір що `Publish Directory` = `dist`

### Backend не стартує:
- Перевір логи в Render Dashboard
- Перевір що всі Environment Variables додані
- Перевір що `npm start` працює локально

## 🎉 Готово!

Тепер твій сайт доступний онлайн!

**Frontend:** https://твоя-назва.onrender.com
**Backend:** https://твоя-назва-api.onrender.com

---

**Потрібна допомога?** Пиши в чат! 🚀
