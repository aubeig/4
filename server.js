// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
app.use(bodyParser.json());

// Конфигурация PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const BOT_TOKEN = process.env.BOT_TOKEN;
const API_KEY = process.env.API_KEY; // Ваш ключ OpenRouter

// Инициализация базы данных
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      telegram_id BIGINT UNIQUE NOT NULL,
      username VARCHAR(255),
      first_name VARCHAR(255),
      last_name VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(64) PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days'
    );
    
    CREATE TABLE IF NOT EXISTS chats (
      id VARCHAR(50) PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      title VARCHAR(255) NOT NULL,
      messages JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

// API Endpoints

// Проверка здоровья сервера
app.get('/health-check', (req, res) => {
  res.status(200).send('OK');
});

// Запрос кода авторизации
app.post('/request-auth', async (req, res) => {
  // Реализация из предыдущего кода
});

// Проверка кода авторизации
app.post('/verify-auth', async (req, res) => {
  // Реализация из предыдущего кода
});

// Проверка сессии
app.post('/validate-session', async (req, res) => {
  // Реализация из предыдущего кода
});

// Получение чатов пользователя
app.post('/get-chats', async (req, res) => {
  // Реализация из предыдущего кода
});

// Сохранение чатов
app.post('/save-chats', async (req, res) => {
  // Реализация из предыдущего кода
});

// Получение ответа от ИИ
app.post('/get-ai-response', async (req, res) => {
  // Реализация из предыдущего кода
});

// Выход из системы
app.post('/logout', async (req, res) => {
  // Реализация из предыдущего кода
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
