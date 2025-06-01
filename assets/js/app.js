const API_URL = 'http://localhost:3000/api';

async function registerUser(name, email, password) {
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        localStorage.setItem('user_id', data.id);
        localStorage.setItem('user_name', data.name);
        localStorage.setItem('role', data.role);
        return data;
    } catch (err) {
        throw new Error('Ошибка регистрации: ' + err.message);
    }
}

async function loginUser(email, password) {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        localStorage.setItem('user_id', data.id);
        localStorage.setItem('user_name', data.name);
        localStorage.setItem('role', data.role);
        return data;
    } catch (err) {
        throw new Error('Ошибка входа: ' + err.message);
    }
}

async function getUser(userId) {
    try {
        const response = await fetch(`${API_URL}/users/${userId}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        return data;
    } catch (err) {
        throw new Error('Ошибка получения пользователя: ' + err.message);
    }
}

function showModal(message) {
    const modal = document.getElementById('modal');
    const modalMessage = document.getElementById('modalMessage');
    if (modal && modalMessage) {
        modalMessage.textContent = message;
        modal.style.display = 'block'; /* Изменено на block для совместимости с margin */
    } else {
        console.error('Modal elements not found:', { modal, modalMessage });
    }
}

function updateHeader() {
    const userName = localStorage.getItem('user_name');
    const role = localStorage.getItem('role');
    const loginLink = document.getElementById('loginLink');
    const registerLink = document.getElementById('registerLink');
    const logoutLink = document.getElementById('logoutLink');
    const dashboardLink = document.getElementById('dashboardLink');

    if (userName && loginLink && registerLink && logoutLink && dashboardLink) {
        loginLink.style.display = 'none';
        registerLink.style.display = 'none';
        logoutLink.style.display = 'inline';
        dashboardLink.style.display = 'inline';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateHeader();
});