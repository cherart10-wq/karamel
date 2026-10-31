// --- 1. ПЕРЕМЕННЫЕ ---
let cart = [];
const addButtons = document.querySelectorAll('.add-to-cart');
const cartCountEl = document.getElementById('cart-count');
const cartLink = document.querySelector('.cart-link');

const cartPanel = document.getElementById('cart-panel');
const cartOverlay = document.getElementById('cart-overlay');
const closeCartBtn = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalPriceEl = document.getElementById('cart-total-price');

const checkoutBtn = document.getElementById('checkout-btn');
const checkoutModal = document.getElementById('checkout-modal');
const closeModalBtn = document.getElementById('close-modal');
const modalTotalPrice = document.getElementById('modal-total-price');
const orderForm = document.getElementById('order-form');

const toastContainer = document.getElementById('toast-container');

// --- 2. КОРЗИНА (ОТКРЫТИЕ/ЗАКРЫТИЕ) ---
cartLink.addEventListener('click', (e) => { e.preventDefault(); openCart(); });
closeCartBtn.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

function openCart() {
    cartPanel.classList.add('active');
    cartOverlay.classList.add('active');
}
function closeCart() {
    cartPanel.classList.remove('active');
    cartOverlay.classList.remove('active');
}

// --- 3. ДОБАВЛЕНИЕ В КОРЗИНУ ---
addButtons.forEach(button => {
    button.addEventListener('click', () => {
        const name = button.dataset.name;
        const price = Number(button.dataset.price);
        const existingItem = cart.find(item => item.name === name);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ name: name, price: price, quantity: 1 });
        }
        updateCartUI();
        showToast(`Добавлено: ${name}`);
    });
});

// --- 4. ОТРИСОВКА КОРЗИНЫ ---
function updateCartUI() {
    let totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountEl.textContent = totalItems;
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Корзина пока пуста 🍰</p>';
        cartTotalPriceEl.textContent = '0';
        return;
    }

    let totalSum = 0;
    cart.forEach((item, index) => {
        const itemSum = item.price * item.quantity;
        totalSum += itemSum;

        const itemHTML = `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">${item.price} ₽</div>
                </div>
                <div class="cart-item-controls">
                    <button class="qty-btn minus" data-index="${index}">-</button>
                    <span class="cart-item-qty">${item.quantity}</span>
                    <button class="qty-btn plus" data-index="${index}">+</button>
                    <button class="remove-item" data-index="${index}">🗑</button>
                </div>
            </div>
        `;
        cartItemsContainer.insertAdjacentHTML('beforeend', itemHTML);
    });
    cartTotalPriceEl.textContent = totalSum;
    attachCartEvents();
}

function attachCartEvents() {
    document.querySelectorAll('.qty-btn.plus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            cart[e.target.dataset.index].quantity += 1;
            updateCartUI();
        });
    });
    document.querySelectorAll('.qty-btn.minus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.target.dataset.index;
            if (cart[index].quantity > 1) cart[index].quantity -= 1;
            else cart.splice(index, 1);
            updateCartUI();
        });
    });
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            cart.splice(e.target.dataset.index, 1);
            updateCartUI();
        });
    });
}

// --- 5. ОФОРМЛЕНИЕ ЗАКАЗА ---
checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
        alert("Корзина пуста, добавьте товары!");
        return;
    }
    let total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    modalTotalPrice.textContent = total;
    closeCart();
    checkoutModal.classList.add('active');
});

closeModalBtn.addEventListener('click', () => {
    checkoutModal.classList.remove('active');
});

// Маска телефона
const phoneInput = document.getElementById('phone');
phoneInput.addEventListener('input', (e) => {
    let input = e.target.value.replace(/\D/g, '');
    if (input.startsWith('8')) input = '7' + input.slice(1);
    if (!input.startsWith('7') && input.length > 0) input = '7' + input;
    if (input.length > 11) input = input.slice(0, 11);
    
    let formatted = '+7';
    if (input.length > 1) formatted += ' (' + input.slice(1, 4);
    if (input.length > 4) formatted += ') ' + input.slice(4, 7);
    if (input.length > 7) formatted += '-' + input.slice(7, 9);
    if (input.length > 9) formatted += '-' + input.slice(9, 11);
    if (input.length === 0) formatted = '';
    
    e.target.value = formatted;
});

// ОТПРАВКА ЗАКАЗА (JSONP)
const submitOrderBtn = document.querySelector('.submit-order-btn');

submitOrderBtn.addEventListener('click', (e) => {
    e.preventDefault(); 
    
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;

    if(!name || !phone || !address) {
        alert("Пожалуйста, заполните имя, телефон и адрес.");
        return;
    }

    // ТВОИ ДАННЫЕ ВК
    const VK_TOKEN = 'vk1.a.AZQGPh1FaG_cO6Y0GrN9OQngKdseaINhOQMfDxrDlHfELyUVuJ1wo3a-u1-Wtmij3Y70fJjWd7e2B_rFe77evO0uonI8oylLFeWnTgWieQj4n4oAdEEvPLLmqBymBIpuNqG5zraDtGhgshmKpfGPaSVUN5nNxZ5XHVn6x3jqCcs65iiUFK_9tYrZ9v9n3GDyi1CBFSUhe0mDORB_NuOQbg';
    const MY_VK_ID = '576144942'; 

    let message = `🔔 НОВЫЙ ЗАКАЗ!\n\n👤 Имя: ${name}\n📞 Телефон: ${phone}\n📍 Адрес: ${address}\n\n🛒 Заказ:\n`;
    cart.forEach(item => {
        message += `- ${item.name}: ${item.quantity} шт.\n`;
    });

    const callbackName = 'vkCallback_' + Math.round(1000000 * Math.random());
    
    window[callbackName] = function(data) {
        if (data.response) {
            alert("Спасибо! Ваш заказ отправлен. Мы скоро свяжемся с вами.");
            cart = [];
            updateCartUI();
            checkoutModal.classList.remove('active');
            orderForm.reset();
            window.history.replaceState(null, '', window.location.pathname);
        } else {
            alert("ОШИБКА ВК:\n" + JSON.stringify(data.error || data));
        }
        document.body.removeChild(script);
        delete window[callbackName];
    };

    const script = document.createElement('script');
    script.src = `https://api.vk.com/method/messages.send?user_id=${MY_VK_ID}&message=${encodeURIComponent(message)}&random_id=${Math.floor(Math.random() * 1000000)}&access_token=${VK_TOKEN}&v=5.199&callback=${callbackName}`;
    document.body.appendChild(script);
});

// --- 6. ТОСТЫ (УВЕДОМЛЕНИЯ) ---
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <div class="toast-content">
            <span>✅</span> <span>${message}</span>
        </div>
        <button class="toast-close">&times;</button>
    `;
    toastContainer.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    const autoHide = setTimeout(() => hideToast(toast), 4000);
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        clearTimeout(autoHide);
        hideToast(toast);
    });
}

function hideToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
}

// --- 7. АНИМАЦИЯ КАРТОЧЕК И ПОИСК ---
document.addEventListener("DOMContentLoaded", () => {
    const cards = document.querySelectorAll('.product-card');
    cards.forEach((card, index) => {
        setTimeout(() => card.classList.add('visible'), index * 150); 
    });

    const searchInput = document.getElementById('search-input');
    const filterBtns = document.querySelectorAll('.filter-btn');

    function filterProducts() {
        const searchText = searchInput.value.toLowerCase().trim();
        const activeBtn = document.querySelector('.filter-btn.active');
        const activeCategory = activeBtn ? activeBtn.dataset.category : 'all';

        cards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const category = card.dataset.category;

            const matchesSearch = title.includes(searchText);
            const matchesCategory = activeCategory === 'all' || category === activeCategory;

            if (matchesSearch && matchesCategory) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });
    }

    searchInput.addEventListener('input', filterProducts);

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterProducts(); 
        });
    });
});