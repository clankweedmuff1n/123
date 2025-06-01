document.addEventListener('DOMContentLoaded', () => {
    const userList = document.getElementById('userList');
    const addUserBtn = document.getElementById('addUser');
    const userId = localStorage.getItem('user_id');
    const role = localStorage.getItem('role');

    if (!userId || role !== 'admin') {
        showModal('Доступ только для администраторов.');
        setTimeout(() => window.location.href = 'login.html', 1000);
        return;
    }

    function loadUsers() {
        try {
            const result = db.exec('SELECT id, name, email FROM users');
            userList.innerHTML = '';
            if (result[0]?.values) {
                result[0].values.forEach(user => {
                    const li = document.createElement('li');
                    li.textContent = `${user[1]} - ${user[2]}`;
                    userList.appendChild(li);
                });
            }
        } catch (err) {
            showModal('Ошибка при загрузке пользователей.');
        }
    }

    loadUsers();

    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            showModal('Функция добавления пользователя пока недоступна.');
        });
    }
});