const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'fitness_tradition',
    password: 'postgres',
    port: 5432,
});

// Middleware для обработки ошибок
app.use((err, req, res, next) => {
    console.error('Ошибка сервера:', err.message, err.stack);
    res.status(500).json({ error: 'Внутренняя ошибка сервера', details: err.message });
});






app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
        }
        const result = await pool.query(
            'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [name, email, password, 'user'] // В реальном проекте хешируй пароль
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка /api/register POST:', err.message, err.stack);
        res.status(500).json({ error: 'Ошибка сервера', details: err.message });
    }
});

// Логин
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email и пароль обязательны' });
        }
        const result = await pool.query('SELECT id, name, email, role FROM users WHERE email = $1 AND password = $2', [email, password]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка /api/login POST:', err.message, err.stack);
        res.status(500).json({ error: 'Ошибка сервера', details: err.message });
    }
});

app.get('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка /api/users/:id:', err.message, err.stack);
        res.status(500).json({ error: 'Ошибка сервера', details: err.message });
    }
});

app.get('/api/memberships', async (req, res) => {
    try {
        const { user_id } = req.query;
        const result = await pool.query('SELECT id, user_id, name, email, phone, address, membership_type, purchase_date, end_date FROM memberships WHERE user_id = $1', [user_id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Абонемент не найден' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка /api/memberships:', err.message, err.stack);
        res.status(500).json({ error: 'Ошибка сервера', details: err.message });
    }
});

app.post('/api/memberships', async (req, res) => {
    try {
        const { user_id, membership_type, purchase_date, end_date } = req.body;
        if (!user_id || !membership_type || !purchase_date || !end_date) {
            return res.status(400).json({ error: 'Все поля обязательны: user_id, membership_type, purchase_date, end_date' });
        }
        if (!['basic', 'premium', 'vip'].includes(membership_type)) {
            return res.status(400).json({ error: 'Недопустимый тип абонемента: basic, premium или vip' });
        }

        // Проверяем пользователя
        const userResult = await pool.query('SELECT name, email FROM users WHERE id = $1', [user_id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        const { name, email } = userResult.rows[0];
        const phone = 'не указан';
        const address = 'не указан';

        // Проверяем, есть ли абонемент
        const existing = await pool.query('SELECT id FROM memberships WHERE user_id = $1', [user_id]);
        if (existing.rows.length > 0) {
            // Обновляем существующий
            const result = await pool.query(
                'UPDATE memberships SET name = $1, email = $2, phone = $3, address = $4, membership_type = $5, purchase_date = $6, end_date = $7 WHERE user_id = $8 RETURNING *',
                [name, email, phone, address, membership_type, purchase_date, end_date, user_id]
            );
            res.json(result.rows[0]);
        } else {
            // Создаём новый
            const result = await pool.query(
                'INSERT INTO memberships (user_id, name, email, phone, address, membership_type, purchase_date, end_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
                [user_id, name, email, phone, address, membership_type, purchase_date, end_date]
            );
            res.json(result.rows[0]);
        }
    } catch (err) {
        console.error('Ошибка /api/memberships POST:', err.message, err.stack);
        res.status(500).json({ error: 'Ошибка сервера', details: err.message });
    }
});

app.get('/api/visits', async (req, res) => {
    try {
        const { user_id } = req.query;
        const result = await pool.query('SELECT id, user_id, visit_date FROM visits WHERE user_id = $1', [user_id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка /api/visits:', err.message, err.stack);
        res.status(500).json({ error: 'Ошибка сервера', details: err.message });
    }
});

app.get('/api/admin/search', async (req, res) => {
    try {
        const { query } = req.query;
        const searchQuery = query ? `%${query}%` : '%';
        const users = await pool.query(
            'SELECT id, name, email, role FROM users WHERE id::text ILIKE $1 OR name ILIKE $1 OR email ILIKE $1 OR role ILIKE $1',
            [searchQuery]
        );
        const memberships = await pool.query(
            'SELECT id, user_id, name, email, phone, address, membership_type, purchase_date, end_date FROM memberships WHERE id::text ILIKE $1 OR name ILIKE $1 OR email ILIKE $1 OR membership_type ILIKE $1',
            [searchQuery]
        );
        res.json({ users: users.rows, memberships: memberships.rows });
    } catch (err) {
        console.error('Ошибка /api/admin/search:', err.message, err.stack);
        res.status(500).json({ error: 'Ошибка сервера', details: err.message });
    }
});

app.delete('/api/admin/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        res.json({ message: 'Пользователь удалён' });
    } catch (err) {
        console.error('Ошибка /api/admin/users/:id DELETE:', err.message, err.stack);
        res.status(500).json({ error: 'Ошибка сервера', details: err.message });
    }
});

app.delete('/api/admin/memberships/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM memberships WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Абонемент не найден' });
        }
        res.json({ message: 'Абонемент удалён' });
    } catch (err) {
        console.error('Ошибка /api/admin/memberships/:id DELETE:', err.message, err.stack);
        res.status(500).json({ error: 'Ошибка сервера', details: err.message });
    }
});

app.get('/api/admin/contacts', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email, message, submitted_at, created_at FROM contacts WHERE status = $1', ['pending']);
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка /api/admin/contacts:', err.message, err.stack);
        res.status(500).json({ error: 'Ошибка сервера', details: err.message });
    }
});

app.post('/api/contacts', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }
        const now = new Date().toISOString();
        const result = await pool.query(
            'INSERT INTO contacts (name, email, message, submitted_at, status, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, email, message, now, 'pending', now]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка /api/contacts POST:', err.message, err.stack);
        res.status(500).json({ error: 'Ошибка сервера', details: err.message });
    }
});

app.put('/api/admin/contact/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('UPDATE contacts SET status = $1 WHERE id = $2 RETURNING *', ['completed', id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Заявка не найдена' });
        }
        res.json({ message: 'Заявка выполнена' });
    } catch (err) {
        console.error('Ошибка /api/admin/contact/:id/status:', err.message, err.stack);
        res.status(500).json({ error: 'Ошибка сервера', details: err.message });
    }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password } = req.body;
        const updates = [];
        const values = [];
        let index = 1;

        if (name) {
            updates.push(`name = $${index++}`);
            values.push(name);
        }
        if (email) {
            updates.push(`email = $${index++}`);
            values.push(email);
        }
        if (password) {
            updates.push(`password = $${index++}`);
            values.push(password); // В реальном проекте хешируй пароль
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Нет данных для обновления' });
        }

        values.push(id);
        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${index} RETURNING id, name, email, role`;
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка /api/users/:id PUT:', err.message, err.stack);
        res.status(500).json({ error: 'Ошибка сервера', details: err.message });
    }
});

app.put('/api/admin/memberships/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { membership_type } = req.body;
        console.log(`PUT /api/admin/memberships/${id} с membership_type:`, membership_type);

        if (!['basic', 'premium', 'vip'].includes(membership_type)) {
            return res.status(400).json({ error: 'Недопустимый тип абонемента' });
        }

        const result = await pool.query(
            'UPDATE memberships SET membership_type = $1 WHERE id = $2 RETURNING id, user_id, name, email, phone, address, membership_type, purchase_date, end_date',
            [membership_type, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Абонемент не найден' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка /api/admin/memberships/:id PUT:', err.message, err.stack);
        res.status(500).json({ error: 'Ошибка сервера', details: err.message });
    }
});

app.put('/api/admin/memberships/:id/days', async (req, res) => {
    try {
        const { id } = req.params;
        const { end_date } = req.body;
        console.log(`PUT /api/admin/memberships/${id}/days с end_date:`, end_date);

        if (!end_date || isNaN(new Date(end_date).getTime())) {
            return res.status(400).json({ error: 'Некорректная дата окончания' });
        }

        const result = await pool.query(
            'UPDATE memberships SET end_date = $1 WHERE id = $2 RETURNING id, user_id, name, email, phone, address, membership_type, purchase_date, end_date',
            [end_date, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Абонемент не найден' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка /api/admin/memberships/:id/days PUT:', err.message, err.stack);
        res.status(500).json({ error: 'Ошибка сервера', details: err.message });
    }
});

// Генерация тестовых данных
app.post('/api/admin/generate-test-data', async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            // Начало транзакции
            await client.query('BEGIN');

            // Очистка таблиц
            await client.query(`
                TRUNCATE TABLE visits, contacts, memberships, users RESTART IDENTITY CASCADE;
            `);

            // Генерация случайных данных
            const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
            const getRandomDate = () => {
                const start = new Date('2025-05-01');
                const end = new Date('2025-06-01');
                const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
                return date.toISOString();
            };
            const names = ['Алексей Иванов', 'Мария Петрова', 'Дмитрий Смирнов', 'Екатерина Волкова', 'Игорь Кузнецов', 'Анна Соколова', 'Сергей Морозов', 'Ольга Новикова', 'Павел Козлов', 'Юлия Лебедева'];
            const domains = ['gmail.com', 'yandex.ru', 'mail.ru'];
            const membershipTypes = ['basic', 'premium', 'vip'];

            // Создание фиксированных пользователей
            await client.query(`
                INSERT INTO users (name, email, password, role)
                VALUES
                    ('Пользователь', 'user@mail.ru', '123123', 'user'),
                    ('Администратор', 'admin@mail.ru', '123123', 'admin')
                    RETURNING id;
            `);

            // Создание 10 случайных пользователей
            const randomUsers = [];
            for (let i = 0; i < 10; i++) {
                const name = names[i];
                const email = `user${i + 1}@${domains[getRandomInt(0, 2)]}`;
                randomUsers.push({ name, email });
                await client.query(`
                    INSERT INTO users (name, email, password, role)
                    VALUES ($1, $2, '123123', 'user')
                `, [name, email]);
            }

            // Получение всех user_id
            const userIdsResult = await client.query('SELECT id FROM users');
            const userIds = userIdsResult.rows.map(row => row.id);

            // Создание абонементов для всех пользователей
            for (const userId of userIds) {
                const user = userIds.includes(1) && userId === 1 ? { name: 'Пользователь', email: 'user@mail.ru' } :
                    userIds.includes(2) && userId === 2 ? { name: 'Администратор', email: 'admin@mail.ru' } :
                        randomUsers.find(async u => u.email === (await client.query('SELECT email FROM users WHERE id = $1', [userId])).rows[0].email);
                const phone = `+7${getRandomInt(9000000000, 9999999999)}`;
                const address = `г. Москва, ул. Примерная, д. ${getRandomInt(1, 100)}`;
                const membershipType = membershipTypes[getRandomInt(0, 2)];
                const purchaseDate = '2025-05-01T00:00:00Z';
                const endDate = '2025-06-30T23:59:59Z';

                await client.query(`
                    INSERT INTO memberships (user_id, name, email, phone, address, membership_type, purchase_date, end_date)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [userId, user.name, user.email, phone, address, membershipType, purchaseDate, endDate]);
            }

            // Создание 5 заявок
            for (let i = 0; i < 5; i++) {
                const userId = userIds[getRandomInt(0, userIds.length - 1)];
                const user = await client.query('SELECT name, email FROM users WHERE id = $1', [userId]);
                await client.query(`
                    INSERT INTO contacts (name, email, message, submitted_at, status, created_at)
                    VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 'pending', CURRENT_TIMESTAMP)
                `, [user.rows[0].name, user.rows[0].email, `Заявка ${i + 1} от пользователя`]);
            }

            // Создание 10–20 посещений для каждого пользователя
            for (const userId of userIds) {
                const numVisits = getRandomInt(10, 20);
                for (let i = 0; i < numVisits; i++) {
                    await client.query(`
                        INSERT INTO visits (user_id, visit_date)
                        VALUES ($1, $2)
                    `, [userId, getRandomDate()]);
                }
            }

            // Подтверждение транзакции
            await client.query('COMMIT');
            res.status(200).json({ message: 'Тестовые данные успешно сгенерированы' });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Ошибка генерации тестовых данных:', err);
        res.status(500).json({ error: `Ошибка сервера: ${err.message}` });
    }
});

// Обработка несуществующих роутов
app.use((req, res) => {
    res.status(404).json({ error: 'Эндпоинт не найден' });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Сервер на http://localhost:${PORT}`);
});