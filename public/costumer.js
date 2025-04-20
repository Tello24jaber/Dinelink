$(document).ready(function() {
    let cart = [];

    // Fetch menu items
    function loadMenu(category = 'all') {
        fetch('http://localhost:5000/api/menu/customer')
            .then(response => response.json())
            .then(data => {
                // Extract unique categories
                const categories = ['all', ...new Set(data.map(item => item.category))];
                const categoryFilter = $('.category-filter').first().parent();
                categoryFilter.empty();
                categories.forEach(cat => {
                    categoryFilter.append(`
                        <button class="category-filter bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition" data-category="${cat}">
                            ${cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                    `);
                });

                // Filter and display menu items
                const menuItems = $('#menu-items');
                menuItems.empty();
                const filteredItems = category === 'all' ? data : data.filter(item => item.category === category);
                if (filteredItems.length === 0) {
                    menuItems.append('<p class="text-gray-700">No items available.</p>');
                    return;
                }
                filteredItems.forEach(item => {
                    menuItems.append(`
                        <div class="bg-white rounded-lg shadow p-6">
                            <h3 class="text-lg font-bold">${item.name}</h3>
                            <p class="text-gray-600">${item.description || 'No description'}</p>
                            <p class="text-blue-600 font-bold">$${item.price.toFixed(2)}</p>
                            <button class="add-to-cart bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition mt-2" data-id="${item._id}" data-name="${item.name}" data-price="${item.price}">
                                Add to Cart
                            </button>
                        </div>
                    `);
                });
            })
            .catch(error => {
                console.error('Error fetching menu:', error);
                $('#menu-items').html('<p class="text-red-600">Failed to load menu.</p>');
            });
    }

    // Category filter
    $(document).on('click', '.category-filter', function() {
        const category = $(this).data('category');
        $('.category-filter').removeClass('bg-blue-800').addClass('bg-blue-600 hover:bg-blue-700');
        $(this).removeClass('bg-blue-600 hover:bg-blue-700').addClass('bg-blue-800');
        loadMenu(category);
    });

    // Add to cart
    $(document).on('click', '.add-to-cart', function() {
        const item = {
            id: $(this).data('id'),
            name: $(this).data('name'),
            price: parseFloat($(this).data('price')),
            quantity: 1
        };
        const existingItem = cart.find(cartItem => cartItem.id === item.id);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push(item);
        }
        updateCart();
    });

    // Update cart display
    function updateCart() {
        const cartItems = $('#cart-items');
        cartItems.empty();
        if (cart.length === 0) {
            cartItems.append('<p class="text-gray-700">Your cart is empty.</p>');
        } else {
            cart.forEach(item => {
                cartItems.append(`
                    <div class="flex justify-between mb-2">
                        <span>${item.name} x${item.quantity}</span>
                        <span>$${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                `);
            });
        }
        const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        $('#cart-total').text(`$${total.toFixed(2)}`);
        $('#cart-count').text(cart.reduce((sum, item) => sum + item.quantity, 0));
    }

    // Cart modal
    $('#cart-btn').click(() => $('#cart-modal').removeClass('hidden'));
    $('#close-cart-modal, #clear-cart').click(() => {
        $('#cart-modal').addClass('hidden');
        if (event.target.id === 'clear-cart') {
            cart = [];
            updateCart();
        }
    });

    // Place order
    $('#place-order').click(() => {
        const tableNumber = $('#table-number').val().trim();
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        if (!tableNumber) {
            alert('Please enter a table number.');
            return;
        }
        const order = {
            orderId: `ORD-${Date.now()}`,
            table: tableNumber,
            items: cart.map(item => ({ menuItem: item.id, quantity: item.quantity })),
            total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
        };
        fetch('http://localhost:5000/api/orders/customer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        })
            .then(response => response.json())
            .then(data => {
                alert(`Order placed successfully! Your order ID is ${data.orderId}`);
                cart = [];
                updateCart();
                $('#table-number').val('');
                $('#cart-modal').addClass('hidden');
            })
            .catch(error => {
                console.error('Error placing order:', error);
                alert('Failed to place order. Please try again.');
            });
    });

    // Order status modal
    $('#order-status-btn').click(() => $('#order-status-modal').removeClass('hidden'));
    $('#close-order-status-modal, #cancel-order-status').click(() => {
        $('#order-status-modal').addClass('hidden');
        $('#order-id-input').val('');
        $('#order-status-result').addClass('hidden').empty();
    });

    // Check order status
    $('#check-order').click(() => {
        const orderId = $('#order-id-input').val().trim();
        if (!orderId) {
            alert('Please enter an order ID.');
            return;
        }
        fetch(`http://localhost:5000/api/orders/customer/${orderId}`)
            .then(response => {
                if (!response.ok) throw new Error('Order not found');
                return response.json();
            })
            .then(data => {
                $('#order-status-result').removeClass('hidden').html(`
                    <p><strong>Order ID:</strong> ${data.orderId}</p>
                    <p><strong>Table:</strong> ${data.table}</p>
                    <p><strong>Status:</strong> ${data.status}</p>
                    <p><strong>Total:</strong> $${data.total.toFixed(2)}</p>
                `);
            })
            .catch(error => {
                console.error('Error checking order:', error);
                $('#order-status-result').removeClass('hidden').html('<p class="text-red-600">Order not found.</p>');
            });
    });

    // Initial load
    loadMenu();
});