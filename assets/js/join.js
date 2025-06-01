document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://77.246.99.204:3000/api';
    const planButtons = document.querySelectorAll('.select-plan');
    const purchaseButtons = document.querySelectorAll('.purchase-plan');
    const joinFormSection = document.querySelector('.join-form');
    const joinForm = document.getElementById('joinForm');
    const selectedPlanSpan = document.getElementById('selectedPlan');
    const membershipTypeInput = document.getElementById('membershipType');
    const userId = localStorage.getItem('user_id');

    const formatMembershipType = (type) => {
        const types = {
            basic: 'Базовый',
            premium: 'Премиум',
            vip: 'VIP'
        };
        return types[type] || type;
    };

    const prices = {
        basic: '1000 руб/мес',
        premium: '2000 руб/мес',
        vip: '5000 руб/мес'
    };

    // Показываем нужные кнопки в зависимости от авторизации
    if (userId) {
        purchaseButtons.forEach(btn => btn.style.display = 'block');
        planButtons.forEach(btn => btn.style.display = 'none');
        joinFormSection.style.display = 'none';
    } else {
        purchaseButtons.forEach(btn => btn.style.display = 'none');
        planButtons.forEach(btn => btn.style.display = 'block');
        joinFormSection.style.display = 'none';
    }

    // Для незалогиненных - выбор абонемента и форма
    planButtons.forEach(button => {
        button.addEventListener('click', () => {
            const plan = button.getAttribute('data-plan');
            selectedPlanSpan.textContent = formatMembershipType(plan);
            membershipTypeInput.value = plan;
            joinFormSection.style.display = 'block';
            joinFormSection.scrollIntoView({ behavior: 'smooth' });
        });
    });

    if (joinForm) {
        joinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = joinForm.querySelector('#name').value.trim();
            const email = joinForm.querySelector('#email').value.trim();
            const membershipType = membershipTypeInput.value;

            if (!name || !email || !membershipType) {
                showModal('Пожалуйста, заполните все поля.');
                return;
            }

            try {
                const message = `Заявка на абонемент: ${formatMembershipType(membershipType)}`;
                const response = await fetch(`${API_URL}/contacts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, message })
                });
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(`Ошибка ${response.status}: ${JSON.stringify(error)}`);
                }
                showModal('Заявка успешно отправлена!');
                joinForm.reset();
                joinFormSection.style.display = 'none';
            } catch (err) {
                showModal('Ошибка при отправке заявки: ' + err.message);
                console.error('Ошибка заявки:', err);
            }
        });
    }

    // Для залогиненных - покупка абонемента
    purchaseButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const plan = button.getAttribute('data-plan');
            const modal = document.getElementById('purchaseModal');
            const message = document.getElementById('purchaseModalMessage');
            const confirmBtn = document.getElementById('purchaseModalConfirm');
            const cancelBtn = document.getElementById('purchaseModalCancel');
            const closeBtn = document.getElementById('purchaseModalClose');

            message.textContent = `Оформить абонемент ${formatMembershipType(plan)} за ${prices[plan]}?`;
            modal.style.display = 'flex';

            confirmBtn.onclick = async () => {
                try {
                    const purchaseDate = new Date().toISOString();
                    const endDate = new Date();
                    endDate.setDate(endDate.getDate() + 30); // 30 дней
                    const membershipData = {
                        user_id: userId,
                        membership_type: plan,
                        purchase_date: purchaseDate,
                        end_date: endDate.toISOString()
                    };
                    console.log('Отправляем в /api/memberships:', membershipData);
                    const response = await fetch(`${API_URL}/memberships`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(membershipData)
                    });
                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(`Ошибка ${response.status}: ${JSON.stringify(error)}`);
                    }
                    showModal('Абонемент успешно оформлен!');
                    modal.style.display = 'none';
                } catch (err) {
                    showModal('Ошибка при оформлении абонемента: ' + err.message);
                    console.error('Ошибка покупки:', err);
                }
            };

            cancelBtn.onclick = () => modal.style.display = 'none';
            closeBtn.onclick = () => modal.style.display = 'none';
        });
    });
});