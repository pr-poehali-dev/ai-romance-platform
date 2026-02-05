-- Таблица пользователей
CREATE TABLE IF NOT EXISTS t_p13393071_ai_romance_platform.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

-- Таблица подписок
CREATE TABLE IF NOT EXISTS t_p13393071_ai_romance_platform.subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p13393071_ai_romance_platform.users(id),
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('single', 'all')),
    character_id INTEGER,
    start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица сообщений
CREATE TABLE IF NOT EXISTS t_p13393071_ai_romance_platform.messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p13393071_ai_romance_platform.users(id),
    character_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'ai')),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON t_p13393071_ai_romance_platform.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON t_p13393071_ai_romance_platform.subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON t_p13393071_ai_romance_platform.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_character_id ON t_p13393071_ai_romance_platform.messages(character_id);