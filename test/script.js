document.addEventListener('DOMContentLoaded', () => {
    // Menu data
    const menuItems = [
        {
            id: 1,
            name: "Pan-Seared Salmon",
            description: "Atlantic salmon with lemon butter sauce, served with seasonal vegetables and wild rice.",
            calories: 520,
            price: 24.99,
            image: "/api/placeholder/400/300"
        },
        {
            id: 2,
            name: "Filet Mignon",
            description: "8oz premium beef tenderloin, char-grilled to perfection with truffle mashed potatoes.",
            calories: 680,
            price: 34.99,
            image: "/api/placeholder/400/300"
        },
        {
            id: 3,
            name: "Mushroom Risotto",
            description: "Creamy arborio rice slowly cooked with wild mushrooms, finished with parmesan and herbs.",
            calories: 450,
            price: 18.99,
            image: "/api/placeholder/400/300"
        },
        {
            id: 4,
            name: "Mediterranean Salad",
            description: "Fresh mixed greens with feta, olives, cherry tomatoes, cucumber, and house dressing.",
            calories: 320,
            price: 14.99,
            image: "/api/placeholder/400/300"
        },
        {
            id: 5,
            name: "Roasted Chicken",
            description: "Free-range half chicken with rosemary and garlic, served with roasted potatoes.",
            calories: 590,
            price: 22.99,
            image: "/api/placeholder/400/300"
        },
        {
            id: 6,
            name: "Seafood Pasta",
            description: "Linguine with shrimp, scallops, and mussels in a light white wine and tomato sauce.",
            calories: 620,
            price: 26.99,
            image: "/api/placeholder/400/300"
        }
    ];

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

    // State
    let tableNumber = null;
    let cart = [];

    // Initialize
    init();

    // Functions
    function init() {
        loadTableNumber();
        renderMenu();
        renderCartCount();
        attachEventListeners();
    }

    function attachEventListeners() {
        // Table Number Form
        tableNumberForm.addEventListener('submit', handleTableNumberSubmit);
        
        // Cart Modal
        cartButton.addEventListener('click', openCartModal);
        closeCart.addEventListener('click', closeCartModal);
        backdrop.addEventListener('click', closeCartModal);
        
        // Cart Actions
        clearCart.addEventListener('click', handleClearCart);
        placeOrder.addEventListener('click', handlePlaceOrder);
    }

    function handleTableNumberSubmit(e) {
        e.preventDefault();
        tableNumber = parseInt(tableNumberInput.value);
        
        // Save to localStorage
        localStorage.setItem('wardTableNumber', tableNumber);
        
        // Show confirmation and update UI
        tableNumberDisplay.textContent = tableNumber;
        tableDisplay.classList.remove('hidden');
        
        // Enable ordering
        enableOrdering();
    }

    function loadTableNumber() {
        const savedTableNumber = localStorage.getItem('wardTableNumber');
        
        if (savedTableNumber) {
            tableNumber = parseInt(savedTableNumber);
            tableNumberInput.value = tableNumber;
            tableNumberDisplay.textContent = tableNumber;
            tableDisplay.classList.remove('hidden');
            enableOrdering();
        }
        
        // Load cart for this table
        loadCart();
    }

    function enableOrdering() {
        // This function could be used to enable/disable ordering UI based on table number
        document.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.disabled = false;
        });
    }

    function renderMenu() {
        menuContainer.innerHTML = '';
        
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
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="menu-item-info">
                <div class="menu-item-header">
                    <h3 class="menu-item-name">${item.name}</h3>
                    <span class="menu-item-price">$${item.price.toFixed(2)}</span>
                </div>
                <p class="menu-item-desc">${item.description}</p>
                <p class="menu-item-calories">${item.calories} cal</p>
                <div class="menu-item-add">
                    <div class="quantity-control">
                        <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                        <span class="quantity-display" id="quantity-${item.id}">1</span>
                        <button class="quantity-btn increase" data-id="${item.id}">+</button>
                    </div>
                    <button class="add-to-cart" data-id="${item.id}" ${!tableNumber ? 'disabled' : ''}>
                        Add to Order
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners
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
        
        // Update quantity (min: 1)
        currentQuantity = Math.max(1, currentQuantity + change);
        quantityDisplay.textContent = currentQuantity;
    }

    function handleAddToCart(item) {
        if (!tableNumber) {
            alert('Please enter your table number first.');
            return;
        }
        
        const quantityDisplay = document.getElementById(`quantity-${item.id}`);
        const quantity = parseInt(quantityDisplay.textContent);
        
        // Check if item is already in cart
        const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id);
        
        if (existingItemIndex !== -1) {
            // Update quantity if item exists
            cart[existingItemIndex].quantity += quantity;
        } else {
            // Add new item to cart
            cart.push({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: quantity
            });
        }
        
        // Reset quantity display
        quantityDisplay.textContent = '1';
        
        // Save cart and update UI
        saveCart();
        renderCartCount();
        
        // Show confirmation
        const addBtn = document.querySelector(`.add-to-cart[data-id="${item.id}"]`);
        const originalText = addBtn.textContent;
        
        addBtn.textContent = 'Added!';
        addBtn.disabled = true;
        
        setTimeout(() => {
            addBtn.textContent = originalText;
            addBtn.disabled = false;
        }, 1000);
    }

    function loadCart() {
        const key = `wardCart_${tableNumber}`;
        const savedCart = localStorage.getItem(key);
        
        if (savedCart) {
            cart = JSON.parse(savedCart);
            renderCartCount();
        }
    }

    function saveCart() {
        const key = `wardCart_${tableNumber}`;
        localStorage.setItem(key, JSON.stringify(cart));
    }

    function renderCartCount() {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems;
        
        // Show/hide cart button based on items
        if (totalItems > 0) {
            cartButton.style.display = 'flex';
        } else {
            cartButton.style.display = 'flex'; // Always show for UX, but could be hidden
        }
    }

    function openCartModal() {
        renderCartItems();
        cartModal.classList.remove('hidden');
        backdrop.classList.remove('hidden');
    }

    function closeCartModal() {
        cartModal.classList.add('hidden');
        backdrop.classList.add('hidden');
    }

    function renderCartItems() {
        if (cart.length === 0) {
            cartItems.innerHTML = '<p class="empty-cart-message">Your cart is empty</p>';
            cartTotal.textContent = '$0.00';
            return;
        }
        
        cartItems.innerHTML = '';
        let total = 0;
        
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
            
            cartItems.appendChild(cartItemElement);
            
            // Add remove event listener
            const removeBtn = cartItemElement.querySelector('.cart-item-remove');
            removeBtn.addEventListener('click', () => handleRemoveCartItem(item.id));
        });
        
        cartTotal.textContent = `$${total.toFixed(2)}`;
    }

    function handleRemoveCartItem(itemId) {
        cart = cart.filter(item => item.id !== itemId);
        saveCart();
        renderCartItems();
        renderCartCount();
    }

    function handleClearCart() {
        if (confirm('Are you sure you want to clear your order?')) {
            cart = [];
            saveCart();
            renderCartItems();
            renderCartCount();
            closeCartModal();
        }
    }

    function handlePlaceOrder() {
        if (cart.length === 0) {
            alert('Your cart is empty. Please add items to your order.');
            return;
        }
        
        // Calculate order total
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Prepare order summary
        const orderSummary = cart.map(item => 
            `${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}`
        ).join('\n');
        
        // Show order confirmation
        alert(`Order placed for Table ${tableNumber}!\n\nSummary:\n${orderSummary}\n\nTotal: $${total.toFixed(2)}\n\nYour order has been sent to the kitchen.`);
        
        // Clear cart after order
        cart = [];
        saveCart();
        renderCartItems();
        renderCartCount();
        closeCartModal();
    }
});