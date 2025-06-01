document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = form.querySelector('#name').value.trim();
            const email = form.querySelector('#email').value.trim();
            const message = form.querySelector('#message').value.trim();

            if (name && email && message) {
                try {
                    db.run('INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)', [name, email, message]);
                    saveDatabase();
                    showModal('Сообщение отправлено!');
                    form.reset();
                } catch (err) {
                    showModal('Ошибка при отправке сообщения.');
                }
            } else {
                showModal('Пожалуйста, заполните все поля.');
            }
        });
    }
});