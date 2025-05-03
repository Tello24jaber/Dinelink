
document.addEventListener('DOMContentLoaded', () => {
    // Menu data
    const menuItems = [
        {
            id: 1,
            name: "Pan-Seared Salmon",
            description: "Atlantic salmon with lemon butter sauce, served with seasonal vegetables and wild rice.",
            calories: 520,
            price: 24.99,
            image: "https://static01.nyt.com/images/2024/02/13/multimedia/LH-pan-seared-salmon-lwzt/LH-pan-seared-salmon-lwzt-mediumSquareAt3X.jpg"
        },
        {
            id: 2,
            name: "Filet Mignon",
            description: "8oz premium beef tenderloin, char-grilled to perfection with truffle mashed potatoes.",
            calories: 680,
            price: 34.99,
            image: "https://hips.hearstapps.com/hmg-prod/images/filet-mignon-index-66c4b19cc80ba.jpeg?crop=1.00xw:1.00xh;0,0&resize=1200:*"
        },
        {
            id: 3,
            name: "Mushroom Risotto",
            description: "Creamy arborio rice slowly cooked with wild mushrooms, finished with parmesan and herbs.",
            calories: 450,
            price: 18.99,
            image: "https://cdn.loveandlemons.com/wp-content/uploads/opengraph/2023/01/mushroom-risotto-recipe.jpg"
        },
        {
            id: 4,
            name: "Mediterranean Salad",
            description: "Fresh mixed greens with feta, olives, cherry tomatoes, cucumber, and house dressing.",
            calories: 320,
            price: 14.99,
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS-Ilu08tcq9yIlM2ZfkTpO1u2Xwh1i6IJ5XQ&s"
        },
        {
            id: 5,
            name: "Roasted Chicken",
            description: "Free-range half chicken with rosemary and garlic, served with roasted potatoes.",
            calories: 590,
            price: 22.99,
            image: "https://assets.epicurious.com/photos/62f16ed5fe4be95d5a460eed/1:1/w_4318,h_4318,c_limit/RoastChicken_RECIPE_080420_37993.jpg"
        },
        {
            id: 6,
            name: "Seafood Pasta",
            description: "Linguine with shrimp, scallops, and mussels in a light white wine and tomato sauce.",
            calories: 620,
            price: 26.99,
            image: "https://simply-delicious-food.com/wp-content/uploads/2021/07/Creamy-seafood-pasta-5.jpg"
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
        renderMenu();
        renderCartCount();
        attachEventListeners();
        disableOrdering(); // Added to initially disable ordering
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
        cartButton.style.display = 'flex';
    }

    function disableOrdering() {
        document.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.disabled = true;
        });
        cartButton.style.display = 'none';
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
        cartButton.style.display = totalItems > 0 ? 'flex' : 'none';
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
            document.getElementById('orderNotes').value = ''; // Clear notes
            renderCartItems();
            renderCartCount();
            closeCartModal();
        }
    }
    
const SHEETDB_ENDPOINT = 'https://sheetdb.io/api/v1/1ud2pjrkgw2oq';


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
    const notes = document.getElementById('orderNotes').value;
    
    try {
        // Format items for spreadsheet
        const itemsString = cart.map(item => 
            `${item.name} (x${item.quantity})`
        ).join(', ');

        // Create order data object
        const orderData = {
            data: [{
                "table number": tableNumber,
                "items": itemsString,
                "notes": notes || "None",
                "total": total.toFixed(2)
            }]
        };

        // Send to Google Sheets via SheetDB
        const response = await fetch(SHEETDB_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            throw new Error('Failed to save order to spreadsheet');
        }

        const result = await response.json();
        console.log('Order saved:', result);

        // Show confirmation
        const orderSummary = cart.map(item => 
            `${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}`
        ).join('\n');
        
        alert(`Order placed for Table ${tableNumber}!\n\nSummary:\n${orderSummary}\n\nTotal: $${total.toFixed(2)}\n\nYour order has been sent to the kitchen.`);

    } catch (error) {
        console.error('Error saving order:', error);
        alert('Order placed successfully, but receipt was not saved. Please inform staff.');
    } finally {
        // Clear cart and reset UI
        cart = [];
        document.getElementById('orderNotes').value = '';
        renderCartItems();
        renderCartCount();
        closeCartModal();
        disableOrdering();
    }
}
});