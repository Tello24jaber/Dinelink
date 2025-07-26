document.addEventListener('DOMContentLoaded', () => {
    
    let menuItems = [];

   const supabase = window.supabase.createClient(
  'https://twvvgvwgsuccqgqcdwpm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3dnZndndnc3VjY3FncWNkd3BtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MjcxMzAsImV4cCI6MjA2OTEwMzEzMH0.D2JfE_i_16HJnv1ON6H6Z76ptgYpg-U_K1DtjZ5SIHs'
    
);

    // DOM Elements
    const tableNumberForm = document.getElementById('tableNumberForm');
    const tableNumberInput = document.getElementById('tableNumber');
    const tableDisplay = document.getElementById('tableDisplay');
    const tableNumberDisplay = document.getElementById('tableNumberDisplay');
    const menuContainer = document.getElementById('menuContainer');
    const cartButton = document.getElementById('cartButton');
    const cartCount = document.getElementById('cartCount');
    const cartModal = document.getElementById('cartModal');
    const closeCart = document.getElementById('closeCart');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const clearCart = document.getElementById('clearCart');
    const placeOrder = document.getElementById('placeOrder');
    const backdrop = document.getElementById('backdrop');
    const orderNotes = document.getElementById('orderNotes');

    // State
    let tableNumber = null;
    let cart = [];

   

    // Initialize
    init();

    // Functions
    async function init() {
        await fetchMenuItems();
        renderMenu();
        renderCartCount();
        attachEventListeners();
        disableOrdering();
    }

async function fetchMenuItems() {
    try {
        const { data, error } = await supabase
            .from('menu_items')
            .select('*')
            .eq('available', true);

        if (error) throw error;

        menuItems = data.map(item => ({
            id: item.id, // UUID now, so no parseInt
            name: item.name,
            description: item.description,
            price: parseFloat(item.price),
            image: item.image
        }));

        console.log('Menu items loaded from Supabase:', menuItems);
    } catch (error) {
        console.error('Error fetching menu items from Supabase:', error.message);
        menuContainer.innerHTML = '<p class="error-message">Unable to load menu. Please refresh or contact staff.</p>';
    }
}


    function generateOrderID() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `ORD-${year}${month}${day}-${hours}${minutes}${seconds}`;
    }

    function attachEventListeners() {
        tableNumberForm.addEventListener('submit', handleTableNumberSubmit);
        cartButton.addEventListener('click', openCartModal);
        closeCart.addEventListener('click', closeCartModal);
        backdrop.addEventListener('click', closeCartModal);
        clearCart.addEventListener('click', handleClearCart);
        placeOrder.addEventListener('click', handlePlaceOrder);
    }

    function handleTableNumberSubmit(e) {
        e.preventDefault();
        const inputNumber = parseInt(tableNumberInput.value);

        if (!inputNumber || inputNumber < 1 || inputNumber > 50) {
            alert('Please enter a valid table number (1-50)');
            return;
        }

        tableNumber = inputNumber;
        tableNumberDisplay.textContent = tableNumber;
        tableDisplay.classList.remove('hidden');
        enableOrdering();
    }

    function enableOrdering() {
        document.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.disabled = false;
        });
        if (cart.length > 0) {
            cartButton.style.display = 'flex';
        }
    }

    function disableOrdering() {
        document.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.disabled = true;
        });
        cartButton.style.display = 'none';
    }

    function renderMenu() {
        menuContainer.innerHTML = '';

        if (menuItems.length === 0) {
            menuContainer.innerHTML = '<p class="no-items-message">No menu items available at the moment.</p>';
            return;
        }

        menuItems.forEach(item => {
            const menuItemElement = createMenuItemElement(item);
            menuContainer.appendChild(menuItemElement);
        });
    }

    function createMenuItemElement(item) {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        menuItem.dataset.id = item.id;

        menuItem.innerHTML = `
            <div class="menu-item-image">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Available'">
            </div>
            <div class="menu-item-info">
                <div class="menu-item-header">
                    <h3 class="menu-item-name">${item.name}</h3>
                    <span class="menu-item-price">$${item.price.toFixed(2)}</span>
                </div>
                <p class="menu-item-desc">${item.description}</p>
                <div class="menu-item-add">
                    <div class="quantity-control">
                        <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                        <span class="quantity-display" id="quantity-${item.id}">1</span>
                        <button class="quantity-btn increase" data-id="${item.id}">+</button>
                    </div>
                    <button class="add-to-cart" data-id="${item.id}" disabled>
                        Add to Order
                    </button>
                </div>
            </div>
        `;

        const addToCartBtn = menuItem.querySelector('.add-to-cart');
        const increaseBtn = menuItem.querySelector('.increase');
        const decreaseBtn = menuItem.querySelector('.decrease');

        addToCartBtn.addEventListener('click', () => handleAddToCart(item));
        increaseBtn.addEventListener('click', () => handleQuantityChange(item.id, 1));
        decreaseBtn.addEventListener('click', () => handleQuantityChange(item.id, -1));

        return menuItem;
    }

    function handleQuantityChange(itemId, change) {
        const quantityDisplay = document.getElementById(`quantity-${itemId}`);
        let currentQuantity = parseInt(quantityDisplay.textContent);
        currentQuantity = Math.max(1, currentQuantity + change);
        quantityDisplay.textContent = currentQuantity;
    }

    function handleAddToCart(item) {
        if (!tableNumber) {
            alert('Please enter your table number first.');
            return;
        }

        const quantity = parseInt(document.getElementById(`quantity-${item.id}`).textContent);
        const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id);

        if (existingItemIndex !== -1) {
            cart[existingItemIndex].quantity += quantity;
        } else {
            cart.push({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: quantity
            });
        }

        document.getElementById(`quantity-${item.id}`).textContent = '1';
        renderCartCount();

        const addBtn = document.querySelector(`.add-to-cart[data-id="${item.id}"]`);
        const originalText = addBtn.textContent;
        addBtn.textContent = 'Added!';
        addBtn.disabled = true;

        setTimeout(() => {
            addBtn.textContent = originalText;
            addBtn.disabled = false;
        }, 1000);
    }

    function renderCartCount() {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems;

        if (totalItems > 0 && tableNumber) {
            cartButton.style.display = 'flex';
        } else {
            cartButton.style.display = 'none';
        }
    }

    function openCartModal() {
        if (!tableNumber) {
            alert('Please enter your table number first.');
            return;
        }
        renderCartItems();
        cartModal.classList.remove('hidden');
        backdrop.classList.remove('hidden');
    }

    function closeCartModal() {
        cartModal.classList.add('hidden');
        backdrop.classList.add('hidden');
    }

    function renderCartItems() {
        cartItems.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            cartItems.innerHTML = '<p class="empty-cart-message">Your cart is empty</p>';
            cartTotal.textContent = '$0.00';
            return;
        }

        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            const cartItemElement = document.createElement('div');
            cartItemElement.className = 'cart-item';
            cartItemElement.innerHTML = `
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)} × ${item.quantity}</div>
                </div>
                <div class="cart-item-quantity">
                    <span>$${itemTotal.toFixed(2)}</span>
                    <button class="cart-item-remove" data-id="${item.id}">
                        <i class="fas fa-trash"></i> 
                    </button>
                </div>
            `;

            cartItemElement.querySelector('.cart-item-remove')
                .addEventListener('click', () => handleRemoveCartItem(item.id));

            cartItems.appendChild(cartItemElement);
        });

        cartTotal.textContent = `$${total.toFixed(2)}`;
    }

    function handleRemoveCartItem(itemId) {
        cart = cart.filter(item => item.id !== itemId);
        renderCartItems();
        renderCartCount();
    }

    function handleClearCart() {
        if (!tableNumber) return;
        if (confirm('Are you sure you want to clear your order?')) {
            cart = [];
            orderNotes.value = '';
            renderCartItems();
            renderCartCount();
            closeCartModal();
        }
    }

    async function handlePlaceOrder() {
        if (!tableNumber) {
            alert('Please enter your table number first.');
            return;
        }

        if (cart.length === 0) {
            alert('Your cart is empty. Please add items to your order.');
            return;
        }

        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const notes = orderNotes.value.trim() || "None";
        const orderId = generateOrderID();

        // Format items as "Item (x2), Item2 (x1), ..."
        const itemsString = cart.map(item =>
            `${item.name} (x${item.quantity})`
        ).join(', ');

        try {
    const { data, error } = await supabase
        .from('orders')
        .insert([{
            order_id: orderId,
            timestamp: new Date().toISOString(),
            table_number: tableNumber,
            items: itemsString,
            notes: notes,
            total: parseFloat(total.toFixed(2)),
            preparing: true,
            done: false
        }]);

    if (error) {
        console.error('Supabase insert error:', error);
        alert('There was an error placing your order. Please try again or contact staff.');
        return;
    }

    console.log('Order saved successfully:', data);


            // Show success confirmation
            const orderSummary = cart.map(item =>
                `${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}`
            ).join('\n');

            alert(`Order placed successfully for Table ${tableNumber}!\n\nOrder ID: ${orderId}\n\nSummary:\n${orderSummary}\n\nTotal: $${total.toFixed(2)}\n\nYour order has been sent to the kitchen.`);

            // Reset everything
            cart = [];
            orderNotes.value = '';
            tableNumber = null;
            tableNumberInput.value = '';
            tableDisplay.classList.add('hidden');
            renderCartItems();
            renderCartCount();
            closeCartModal();
            disableOrdering();

        } catch (error) {
            console.error('Error placing order:', error);
            alert('There was an error placing your order. Please try again or contact staff for assistance.');
        }
    }
});