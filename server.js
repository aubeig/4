const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' })); // Увеличим лимит для загрузки аватарок в base64

// --- ПОДКЛЮЧЕНИЕ К БАЗЕ ДАННЫХ ---
// На Render эта переменная будет доступна автоматически.
// Для локального теста создайте файл .env и запишите туда DATABASE_URL='...'
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false // Это нужно для подключения к Render DB
    }
});

// Функция для создания таблиц, если их нет
const initializeDatabase = async () => {
    const client = await pool.connect();
    try {
        // Таблица пользователей
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(255) PRIMARY KEY,
                nickname VARCHAR(50) NOT NULL,
                about TEXT,
                avatar TEXT, -- Будем хранить аватар в формате base64
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        // Таблица чатов
        await client.query(`
            CREATE TABLE IF NOT EXISTS chats (
                user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
                chat_data JSONB,
                PRIMARY KEY (user_id)
            );
        `);
        console.log('Database tables are ready.');
    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        client.release();
    }
};

// --- ЭНДПОИНТЫ API ---

// 1. Регистрация нового пользователя
app.post('/api/register', async (req, res) => {
    const { nickname, about, avatar } = req.body;

    if (!nickname) {
        return res.status(400).json({ error: 'Nickname is required.' });
    }

    const newUserId = `syrok-user-${Date.now()}`; // Генерируем уникальный ID
    
    try {
        // Вставляем пользователя
        const userQuery = 'INSERT INTO users(id, nickname, about, avatar) VALUES($1, $2, $3, $4) RETURNING *';
        const userResult = await pool.query(userQuery, [newUserId, nickname, about, avatar]);
        const newUser = userResult.rows[0];

        // Создаем для него стандартный набор чатов
        const initialChats = {
            'default': {
                id: 'default',
                title: 'Основной чат',
                messages: [{ role: 'assistant', content: `Привет, ${nickname}! Я Мини-Сырок, чем могу помочь?` }],
                createdAt: new Date().toISOString()
            }
        };
        const chatsQuery = 'INSERT INTO chats(user_id, chat_data) VALUES($1, $2)';
        await pool.query(chatsQuery, [newUserId, JSON.stringify(initialChats)]);

        console.log(`User registered: ${newUser.nickname} (ID: ${newUser.id})`);
        res.status(201).json({ user: newUser, chats: initialChats });

    } catch (err) {
        console.error('Error during registration:', err);
        res.status(500).json({ error: 'Server error during registration.' });
    }
});

// 2. Вход по ID (проверка сессии)
app.get('/api/user/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const userQuery = 'SELECT * FROM users WHERE id = $1';
        const userResult = await pool.query(userQuery, [userId]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const chatsQuery = 'SELECT chat_data FROM chats WHERE user_id = $1';
        const chatsResult = await pool.query(chatsQuery, [userId]);
        
        const user = userResult.rows[0];
        const chats = chatsResult.rows.length > 0 ? chatsResult.rows[0].chat_data : {};
        
        console.log(`User session loaded for: ${user.nickname}`);
        res.json({ user, chats });

    } catch (err) {
        console.error('Error loading user session:', err);
        res.status(500).json({ error: 'Server error while loading session.' });
    }
});

// 3. Сохранение чатов
app.post('/api/chats', async (req, res) => {
    const { userId, chats } = req.body;
    if (!userId || !chats) {
        return res.status(400).json({ error: 'userId and chats are required.' });
    }
    
    try {
        // Используем ON CONFLICT для обновления, если запись уже существует
        const query = `
            INSERT INTO chats (user_id, chat_data) 
            VALUES ($1, $2)
            ON CONFLICT (user_id) 
            DO UPDATE SET chat_data = $2;
        `;
        await pool.query(query, [userId, JSON.stringify(chats)]);
        
        console.log(`Chats saved for user ID: ${userId}`);
        res.json({ success: true, message: 'Chats saved successfully' });

    } catch(err) {
        console.error('Error saving chats:', err);
        res.status(500).json({ error: 'Server error while saving chats.' });
    }
});


// Запуск сервера
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    initializeDatabase();
}); 2
