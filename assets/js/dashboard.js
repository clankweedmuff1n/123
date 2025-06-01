document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = 'http://localhost:3000/api';
    const userId = localStorage.getItem('user_id');
    const userRole = localStorage.getItem('role');
    console.log('Инициализация: userId=', userId, 'userRole=', userRole);

    const loader = document.getElementById('loader');
    const showLoader = () => loader.style.display = 'block';
    const hideLoader = () => loader.style.display = 'none';

    if (!userId) {
        showModal('Войдите в аккаунт.');
        setTimeout(() => window.location.href = 'login.html', 1000);
        return;
    }

    const sidebar = document.getElementById('sidebar');
    const profileMembershipSection = document.getElementById('profileMembershipSection');
    const visitsSection = document.getElementById('visitsSection');
    const settingsSection = document.getElementById('settingsSection');
    const adminSection = document.getElementById('adminSection');

    const formatRole = (role) => {
        return role === 'admin' ? 'Администратор' : 'Пользователь';
    };

    const formatMembershipType = (type) => {
        const types = {
            basic: 'Базовый',
            standard: 'Стандарт',
            premium: 'Премиум',
            vip: 'VIP'
        };
        return types[type] || 'Не оформлен';
    };

    const calculateRemainingDays = (endDate) => {
        if (!endDate) return 'Истёк';
        const today = new Date();
        const end = new Date(endDate);
        if (isNaN(end.getTime())) return 'Истёк';
        const diffTime = end - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 ? diffDays : 'Истёк';
    };

    if (userRole === 'admin') {
        sidebar.style.display = 'block';
    } else {
        sidebar.style.display = 'none';
        profileMembershipSection.style.display = 'block';
        visitsSection.style.display = 'block';
        settingsSection.style.display = 'block';
        adminSection.style.display = 'none';
    }

    const showProfile = () => {
        profileMembershipSection.style.display = 'block';
        visitsSection.style.display = 'block';
        settingsSection.style.display = 'block';
        adminSection.style.display = 'none';
    };

    const showAdmin = () => {
        profileMembershipSection.style.display = 'none';
        visitsSection.style.display = 'none';
        settingsSection.style.display = 'none';
        adminSection.style.display = 'block';
    };

    const links = document.querySelectorAll('.sidebar-link');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('href').slice(1);
            console.log('Переключение на секцию:', section);
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            if (section === 'profile') {
                showProfile();
            } else if (section === 'admin' || section.startsWith('admin-')) {
                showAdmin();
                const subsections = {
                    'admin-users': document.getElementById('adminUsersSection'),
                    'admin-memberships': document.getElementById('adminMembershipsSection'),
                    'admin-contacts': document.getElementById('adminContactsSection')
                };
                Object.values(subsections).forEach(s => s.style.display = 'none');
                const targetSection = subsections[section] || subsections['admin-users'];
                targetSection.style.display = 'block';
            }
        });
    });

    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const content = toggle.nextElementSibling;
            const isActive = toggle.classList.contains('active');
            toggle.classList.toggle('active', !isActive);
            content.classList.toggle('active', !isActive);
        });
    });

    showLoader();

    // Профиль
    try {
        const response = await fetch(`${API_URL}/users/${userId}`);
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Ошибка ${response.status}: ${error}`);
        }
        const user = await response.json();
        console.log('Профиль:', user);
        document.getElementById('profileName').textContent = user.name;
        document.getElementById('profileEmail').textContent = user.email;
        document.getElementById('profileRole').textContent = `Роль: ${formatRole(user.role)}`;
    } catch (err) {
        showModal('Ошибка профиля: ' + err.message);
        console.error('Ошибка профиля:', err);
    }

    // Абонемент
    try {
        const response = await fetch(`${API_URL}/memberships?user_id=${userId}`);
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Ошибка ${response.status}: ${error}`);
        }
        const membership = await response.json();
        console.log('Абонемент:', membership);
        document.getElementById('membershipType').textContent = `Тип: ${formatMembershipType(membership.membership_type)}`;
    } catch (err) {
        showModal('Ошибка абонемента: ' + err.message);
        console.error('Ошибка абонемента:', err);
    }

    // Статистика
    try {
        const response = await fetch(`${API_URL}/visits?user_id=${userId}`);
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Ошибка ${response.status}: ${error}`);
        }
        const visits = await response.json();
        console.log('Посещения:', visits);
        const visitCount = document.getElementById('visitCount');
        visitCount.textContent = `Тренировок за месяц: ${visits.length}`;

        if (!window.Chart) {
            console.error('Chart.js не загружен');
            document.getElementById('visitChart').style.display = 'none';

        } else {
            const dates = visits.map(v => new Date(v.visit_date).toLocaleDateString('ru-RU'));
            const counts = visits.reduce((acc, v) => {
                const date = new Date(v.visit_date).toLocaleDateString('ru-RU');
                acc[date] = (acc[date] || 0) + 1;
                return acc;
            }, {});
            const chartData = Object.keys(counts).map(date => ({ date, count: counts[date] }));

            const ctx = document.getElementById('visitChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: chartData.map(d => d.date),
                    datasets: [{
                        label: 'Посещения',
                        data: chartData.map(d => d.count),
                        borderColor: '#f1c40f',
                        backgroundColor: 'rgba(241, 196, 15, 0.2)',
                        fill: true
                    }]
                },
                options: {
                    scales: {
                        y: { beginAtZero: true, title: { display: true, text: 'Количество посещений' } },
                        x: { title: { display: true, text: 'Дата' } }
                    }
                }
            });
        }
    } catch (err) {
        showModal('Ошибка статистики: ' + err.message);
        console.error('Ошибка статистики:', err);
    }

    // Админ-панель
    if (userRole === 'admin') {
        const loadAdminData = async (query = '') => {
            console.log(`Запрос: ${API_URL}/admin/search?query=${encodeURIComponent(query)}`);
            try {
                const response = await fetch(`${API_URL}/admin/search?query=${encodeURIComponent(query)}`);
                if (!response.ok) {
                    const error = await response.text();
                    throw new Error(`Ошибка ${response.status}: ${error}`);
                }
                const data = await response.json();
                console.log('Ответ API:', data);

                const usersTable = document.getElementById('usersTable');
                const membershipsTable = document.getElementById('membershipsTable');

                // Пользователи
                usersTable.innerHTML = '';
                if (data.users && data.users.length) {
                    data.users.forEach(u => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${u.id}</td>
                            <td>${u.name || 'Без имени'}</td>
                            <td>${u.email}</td>
                            <td>${formatRole(u.role)}</td>
                            <td><button class="delete-user" data-id="${u.id}">Удалить</button></td>
                        `;
                        usersTable.appendChild(row);
                    });
                } else {
                    usersTable.innerHTML = '<tr><td colspan="5">Пользователи не найдены</td></tr>';
                }

                // Абонементы
                membershipsTable.innerHTML = '';
                if (data.memberships && data.memberships.length) {
                    data.memberships.forEach(m => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${m.id}</td>
                            <td>${m.name || 'Без имени'}</td>
                            <td>${formatMembershipType(m.membership_type)}</td>
                            <td>${calculateRemainingDays(m.end_date)}</td>
                            <td>
                                <button class="delete-membership" data-id="${m.id}">Удалить</button>
                                <button class="edit-membership" data-id="${m.id}">Изменить абонемент</button>
                                <button class="edit-days" data-id="${m.id}">Изменить дни</button>
                            </td>
                        `;
                        membershipsTable.appendChild(row);
                    });
                } else {
                    membershipsTable.innerHTML = '<tr><td colspan="5">Абонементы не найдены</td></tr>';
                }

                // Удаление пользователей
                document.querySelectorAll('.delete-user').forEach(btn => {
                    btn.addEventListener('click', () => {
                        showModal('Удалить пользователя?', {
                            confirm: async () => {
                                try {
                                    const response = await fetch(`${API_URL}/admin/users/${btn.dataset.id}`, { method: 'DELETE' });
                                    if (!response.ok) {
                                        const error = await response.text();
                                        throw new Error(`Ошибка ${response.status}: ${error}`);
                                    }
                                    const result = await response.json();
                                    showModal('Пользователь удалён.');
                                    loadAdminData(query);
                                } catch (err) {
                                    showModal('Ошибка удаления: ' + err.message);
                                    console.error('Ошибка удаления:', err);
                                }
                            }
                        });
                    });
                });

                // Удаление абонементов
                document.querySelectorAll('.delete-membership').forEach(btn => {
                    btn.addEventListener('click', () => {
                        showModal('Удалить абонемент?', {
                            confirm: async () => {
                                try {
                                    const response = await fetch(`${API_URL}/admin/memberships/${btn.dataset.id}`, { method: 'DELETE' });
                                    if (!response.ok) {
                                        const error = await response.text();
                                        throw new Error(`Ошибка ${response.status}: ${error}`);
                                    }
                                    const result = await response.json();
                                    showModal('Абонемент удалён.');
                                    loadAdminData(query);
                                } catch (err) {
                                    showModal('Ошибка удаления: ' + err.message);
                                    console.error('Ошибка удаления:', err);
                                }
                            }
                        });
                    });
                });

                // Изменение абонемента
                document.querySelectorAll('.edit-membership').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const membershipId = btn.dataset.id;
                        console.log('Изменение абонемента, ID:', membershipId);
                        const modal = document.getElementById('editMembershipModal');
                        const form = document.getElementById('editMembershipForm');
                        const close = document.getElementById('editMembershipClose');

                        modal.style.display = 'flex';
                        form.onsubmit = async (e) => {
                            e.preventDefault();
                            const type = document.getElementById('membershipTypeSelect').value;
                            console.log('Отправка PUT /api/admin/memberships/', membershipId, 'с типом:', type);
                            try {
                                const response = await fetch(`${API_URL}/admin/memberships/${membershipId}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ membership_type: type })
                                });
                                if (!response.ok) {
                                    const error = await response.text();
                                    throw new Error(`Ошибка ${response.status}: ${error}`);
                                }
                                const result = await response.json();
                                showModal('Абонемент обновлён.');
                                modal.style.display = 'none';
                                loadAdminData(query);
                            } catch (err) {
                                showModal('Ошибка: ' + err.message);
                                console.error('Ошибка изменения абонемента:', err);
                            }
                        };
                        close.onclick = () => modal.style.display = 'none';
                    });
                });

                // Изменение дней
                document.querySelectorAll('.edit-days').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const membershipId = btn.dataset.id;
                        console.log('Изменение дней, ID:', membershipId);
                        const modal = document.getElementById('editDaysModal');
                        const form = document.getElementById('editDaysForm');
                        const close = document.getElementById('editDaysClose');

                        modal.style.display = 'flex';
                        form.onsubmit = async (e) => {
                            e.preventDefault();
                            const days = parseInt(document.getElementById('remainingDays').value);
                            if (isNaN(days) || days < 0) {
                                showModal('Введите корректное количество дней.');
                                return;
                            }
                            const endDate = new Date();
                            endDate.setDate(endDate.getDate() + days);
                            console.log('Отправка PUT /api/admin/memberships/', membershipId, '/days с end_date:', endDate);
                            try {
                                const response = await fetch(`${API_URL}/admin/memberships/${membershipId}/days`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ end_date: endDate.toISOString() })
                                });
                                if (!response.ok) {
                                    const error = await response.text();
                                    throw new Error(`Ошибка ${response.status}: ${error}`);
                                }
                                const result = await response.json();
                                showModal('Количество дней обновлено.');
                                modal.style.display = 'none';
                                loadAdminData(query);
                            } catch (err) {
                                showModal('Ошибка: ' + err.message);
                                console.error('Ошибка изменения дней:', err);
                            }
                        };
                        close.onclick = () => modal.style.display = 'none';
                    });
                });
            } catch (err) {
                showModal('Ошибка админ-панели: ' + err.message);
                console.error('Ошибка загрузки:', err);
            }
        };

        // Загрузка заявок
        const loadContacts = async () => {
            try {
                const response = await fetch(`${API_URL}/admin/contacts`);
                if (!response.ok) {
                    const error = await response.text();
                    throw new Error(`Ошибка ${response.status}: ${error}`);
                }
                const contacts = await response.json();
                console.log('Заявки:', contacts);

                const contactsTable = document.getElementById('contactsTable');
                contactsTable.innerHTML = '';
                if (contacts.length) {
                    contacts.forEach(c => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${c.id}</td>
                            <td>${c.name || ''}</td>
                            <td>${c.email}</td>
                            <td>${c.message || ''}</td>
                            <td>${new Date(c.created_at).toLocaleDateString('ru-RU')}</td>
                            <td><button class="complete-contact" data-id="${c.id}">Выполнить</button></td>
                        `;
                        contactsTable.appendChild(row);
                    });
                } else {
                    contactsTable.innerHTML = '<tr><td colspan="6">Заявки не найдены</td></tr>';
                }

                // Выполнение заявки
                document.querySelectorAll('.complete-contact').forEach(btn => {
                    btn.addEventListener('click', () => {
                        showModal('Выполнить заявку?', {
                            confirm: async () => {
                                try {
                                    const response = await fetch(`${API_URL}/admin/contact/${btn.dataset.id}/status`, { method: 'PUT' });
                                    if (!response.ok) {
                                        const error = await response.text();
                                        throw new Error(`Ошибка ${response.status}: ${error}`);
                                    }
                                    const result = await response.json();
                                    showModal('Заявка выполнена!');
                                    loadContacts();
                                } catch (err) {
                                    showModal('Ошибка: ' + err.message);
                                    console.error('Ошибка:', err);
                                }
                            }
                        });
                    });
                });
            } catch (err) {
                showModal('Ошибка загрузки заявок: ' + err.message);
                console.error('Ошибка:', err);
            }
        };

        loadAdminData();
        loadContacts();

        const searchButton = document.getElementById('searchButton');
        const searchInput = document.getElementById('adminSearch');
        searchButton.addEventListener('click', () => {
            const query = searchInput.value.trim();
            console.log('Поиск:', query);
            loadAdminData(query);
        });
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                console.log('Поиск по Enter:', query);
                loadAdminData(query);
            }
        });
    }

    // Настройки
    const settingsForm = document.getElementById('settingsForm');
    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newName = document.getElementById('newName').value;
        const newPassword = document.getElementById('newPassword').value;

        if (!newName && !newPassword) {
            showModal('Введите имя или пароль.');
            return;
        }

        showLoader();
        try {
            const response = await fetch(`${API_URL}/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, password: newPassword })
            });
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Ошибка ${response.status}: ${error}`);
            }
            const updatedUser = await response.json();
            console.log('Обновлённый пользователь:', updatedUser);
            if (newName) {
                document.getElementById('profileName').textContent = updatedUser.name;
                localStorage.setItem('user_name', updatedUser.name);
            }
            showModal('Настройки обновлены!');
            settingsForm.reset();
        } catch (err) {
            showModal('Ошибка настроек: ' + err.message);
            console.error('Ошибка настроек:', err);
        } finally {
            hideLoader();
        }
    });

    // Выход
    const logoutLink = document.getElementById('logoutLink');
    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Выход');
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_name');
        localStorage.removeItem('role');
        showModal('Вы вышли.');
        setTimeout(() => window.location.href = 'login.html', 1000);
    });

    hideLoader();
});

// Модальное окно
function showModal(message, options = {}) {
    const modal = document.getElementById('modal');
    const modalMessage = document.getElementById('modalMessage');
    const modalButtons = document.getElementById('modalButtons');
    const modalClose = document.getElementById('modalClose');
    const modalConfirm = document.getElementById('modalConfirm');
    const modalCancel = document.getElementById('modalCancel');

    modalMessage.textContent = message;
    modal.style.display = 'flex';

    if (options.confirm) {
        modalButtons.style.display = 'flex';
        modalConfirm.onclick = () => {
            options.confirm();
            modal.style.display = 'none';
        };
        modalCancel.onclick = () => modal.style.display = 'none';
    } else {
        modalButtons.style.display = 'none';
    }

    modalClose.onclick = () => modal.style.display = 'none';
}