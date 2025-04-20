$(document).ready(function() {
    console.log('jQuery is ready!');

    // Temporarily bypass token check for testing
    // const token = localStorage.getItem('token');
    // if (!token) {
    //     alert('Please log in to access the dashboard.');
    //     return;
    // }

    // Sidebar navigation
    $('.nav-link, .mobile-nav-link').click(function(e) {
        e.preventDefault();
        const target = $(this).data('target');
        console.log('Switching to panel:', target);
        $('.nav-link, .mobile-nav-link').removeClass('active bg-blue-700').addClass('hover:bg-blue-700');
        $(this).addClass('active bg-blue-700').removeClass('hover:bg-blue-700');
        $('.panel').addClass('hidden');
        $('#' + target).removeClass('hidden');
        $('#mobile-sidebar').addClass('-translate-x-full');
    });

    // Mobile sidebar toggle
    $('#sidebar-toggle').click(() => $('#mobile-sidebar').removeClass('-translate-x-full'));
    $('#close-sidebar').click(() => $('#mobile-sidebar').addClass('-translate-x-full'));

    // Modal handling
    $('#add-item-btn').click(() => {
        $('#item-modal').removeClass('hidden');
        loadCategories();
    });
    $('#close-item-modal, #cancel-item').click(() => $('#item-modal').addClass('hidden'));
    $('#add-category-btn').click(() => $('#category-modal').removeClass('hidden'));
    $('#close-category-modal, #cancel-category').click(() => $('#category-modal').addClass('hidden'));

    // Load categories for item modal
    function loadCategories() {
        fetch('http://localhost:5000/api/menu')
            .then(response => response.json())
            .then(data => {
                const categories = [...new Set(data.map(item => item.category))];
                const categorySelect = $('#item-category');
                categorySelect.empty();
                categories.forEach(cat => {
                    categorySelect.append(`<option value="${cat}">${cat}</option>`);
                });
            })
            .catch(error => console.error('Error loading categories:', error));
    }

    // Save menu item
    $('#save-item').click(() => {
        const item = {
            name: $('#item-name').val().trim(),
            category: $('#item-category').val(),
            description: $('#item-description').val().trim(),
            price: parseFloat($('#item-price').val()),
            status: $('input[name="item-status"]:checked').val()
        };
        if (!item.name || !item.category || isNaN(item.price)) {
            alert('Please fill in all required fields.');
            return;
        }
        fetch('http://localhost:5000/api/menu', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || 'dummy-token'}`
            },
            body: JSON.stringify(item)
        })
            .then(response => response.json())
            .then(data => {
                alert('Menu item added successfully!');
                $('#item-modal').addClass('hidden');
                $('#item-name, #item-description, #item-price').val('');
                $('input[name="item-status"][value="active"]').prop('checked', true);
            })
            .catch(error => {
                console.error('Error saving item:', error);
                alert('Failed to add menu item. Please try again.');
            });
    });

    // Settings handlers
    $('#save-settings').click(() => {
        alert('Settings saved!'); // Placeholder action
        // Add API call to save settings when backend is ready
    });
    $('#upload-logo-btn').click(() => {
        $('#logo-upload').click(); // Trigger file input
    });
    $('#logo-upload').change(function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => $('#logo-preview').attr('src', e.target.result);
            reader.readAsDataURL(file);
        }
    });

    // Fetch dashboard stats
    fetch('http://localhost:5000/api/dashboard/stats', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || 'dummy-token'}`
        }
    })
        .then(response => response.json())
        .then(data => {
            $('#active-orders').text(data.activeOrders || 0);
            $('#completed-today').text(data.completedToday || 0);
            $('#menu-items').text(data.menuItemsCount || 0);
            $('#today-sales').text(`$${data.totalSales || 0}`);
        })
        .catch(error => console.error('Error fetching stats:', error));
});