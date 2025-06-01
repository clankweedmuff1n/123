function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const modalClose = document.getElementById('modalClose');
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    // Закрытие модального окна при клике на фон
    const modal = document.getElementById('modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
});