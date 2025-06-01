document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = form.querySelector('#email').value.trim();
            const password = form.querySelector('#password').value.trim();

            if (email && password) {
                try {
                    const hashedPassword = await hashPassword(password);
                    const result = db.exec('SELECT id, name, role FROM users WHERE email = ? AND password = ?', [email, hashedPassword]);
                    if (result[0]?.values.length > 0) {
                        const user = result[0].values[0];
                        localStorage.setItem('user_id', user[0]);
                        localStorage.setItem('user_name', user[1]);
                        localStorage.setItem('role', user[2]);
                        showModal('Вход выполнен успешно!');
                        updateHeader();
                        setTimeout(() => window.location.href = 'dashboard.html', 1000);
                    } else {
                        showModal('Неверный email или пароль.');
                    }
                } catch (err) {
                    showModal('Ошибка при входе.');
                }
            } else {
                showModal('Пожалуйста, заполните все поля.');
            }
        });
    }
});