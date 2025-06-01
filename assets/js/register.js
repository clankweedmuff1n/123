document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = form.querySelector('#name').value.trim();
            const email = form.querySelector('#email').value.trim();
            const password = form.querySelector('#password').value.trim();

            if (name && email && password.length >= 6) {
                try {
                    const hashedPassword = await hashPassword(password);
                    const result = db.exec('SELECT id FROM users WHERE email = ?', [email]);
                    if (result[0]?.values.length > 0) {
                        showModal('Пользователь с таким email уже существует.');
                        return;
                    }
                    db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                        [name, email, hashedPassword, 'user']);
                    saveDatabase();
                    showModal('Регистрация успешна! Теперь вы можете войти.');
                    form.reset();
                    setTimeout(() => window.location.href = 'login.html', 1000);
                } catch (err) {
                    showModal('Ошибка при регистрации.');
                }
            } else {
                showModal('Заполните все поля. Пароль должен быть не короче 6 символов.');
            }
        });
    }
});