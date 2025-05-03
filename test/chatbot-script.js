document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatContainer = document.getElementById('chatContainer');
    const chatForm = document.getElementById('chatForm');
    const userInput = document.getElementById('userInput');

    // Chat history from localStorage
    let chatHistory = [];
    loadChatHistory();

    // Menu data for recommendations
    const menuItems = [
        { id: 1, name: "Mediterranean Salad", description: "Fresh mixed greens with feta, olives, cherry tomatoes, cucumber, and house dressing.", calories: 320, categories: ["low calorie", "vegetarian", "light", "healthy"], price: 14.99 },
        { id: 2, name: "Grilled Chicken Breast", description: "Herb-marinated chicken breast, grilled to perfection with seasonal vegetables.", calories: 450, categories: ["high protein", "healthy", "gluten free"], price: 19.99 },
        { id: 3, name: "Spicy Beef Kebab", description: "Tender pieces of spiced beef with grilled peppers and onions, served with rice pilaf.", calories: 680, categories: ["spicy", "high protein"], price: 24.99 },
        { id: 4, name: "Falafel Bowl", description: "Crispy falafel, hummus, tabbouleh, and tahini sauce with warm pita bread.", calories: 520, categories: ["vegetarian", "vegan"], price: 16.99 },
        { id: 5, name: "Pan-Seared Salmon", description: "Atlantic salmon with lemon butter sauce, served with seasonal vegetables.", calories: 480, categories: ["high protein", "healthy", "gluten free"], price: 26.99 },
        { id: 6, name: "Mushroom Risotto", description: "Creamy arborio rice with wild mushrooms, finished with parmesan.", calories: 620, categories: ["vegetarian"], price: 18.99 },
        { id: 7, name: "Spicy Thai Curry", description: "Red curry with vegetables and your choice of protein, served with jasmine rice.", calories: 580, categories: ["spicy", "gluten free"], price: 22.99 },
        { id: 8, name: "Caesar Salad", description: "Crisp romaine, garlic croutons, parmesan, and house-made Caesar dressing.", calories: 380, categories: ["low calorie", "light"], price: 12.99 }
    ];

    // Initialize events
    init();

    function init() {
        // Attach event listeners
        chatForm.addEventListener('submit', handleUserMessage);

        // Render existing chat history if available
        if (chatHistory.length > 0) {
            chatHistory.forEach(message => {
                if (message.sender === 'user') {
                    appendUserMessage(message.text);
                } else {
                    appendBotMessage(message.text);
                }
            });
        }

        // Focus on input field
        userInput.focus();
    }

    function handleUserMessage(e) {
        e.preventDefault();

        const message = userInput.value.trim();

        if (message === '') return;

        // Append user message to chat
        appendUserMessage(message);

        // Add to chat history
        chatHistory.push({
            sender: 'user',
            text: message,
            timestamp: new Date().getTime()
        });

        // Clear input field
        userInput.value = '';

        // Show typing indicator
        showTypingIndicator();

        // Process message and respond with delay
        setTimeout(async () => {
            let response = generateResponse(message);

            if (response === "I'm sorry, I didn't understand that.") {
                // If no predefined response, get AI response from serverless function
                response = await getAIResponse(message);
            }

            // Remove typing indicator
            removeTypingIndicator();

            // Append bot message to chat
            appendBotMessage(response);

            // Add to chat history
            chatHistory.push({
                sender: 'bot',
                text: response,
                timestamp: new Date().getTime()
            });

            // Save chat history
            saveChatHistory();

        }, 1200); // Simulate typing delay
    }

    async function getAIResponse(message) {
        try {
            const response = await fetch("/.netlify/functions/ask", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: message }),
            });

            const data = await response.json();
            return data.reply || "Sorry, I didn’t understand that.";
        } catch (error) {
            console.error("Error:", error);
            return "Oops! Something went wrong.";
        }
    }

    function appendUserMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'user-message';
        messageElement.textContent = message;

        chatContainer.appendChild(messageElement);
        scrollToBottom();
    }

    function appendBotMessage(message) {
        const messageWrapper = document.createElement('div');
        messageWrapper.className = 'bot-message';

        const botIcon = document.createElement('div');
        botIcon.className = 'bot-icon';
        botIcon.innerHTML = '<i class="fas fa-robot"></i>';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = message;

        messageWrapper.appendChild(botIcon);
        messageWrapper.appendChild(messageContent);

        chatContainer.appendChild(messageWrapper);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        typingIndicator.id = 'typingIndicator';

        typingIndicator.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;

        const messageWrapper = document.createElement('div');
        messageWrapper.className = 'bot-message';
        messageWrapper.id = 'typingWrapper';

        const botIcon = document.createElement('div');
        botIcon.className = 'bot-icon';
        botIcon.innerHTML = '<i class="fas fa-robot"></i>';

        messageWrapper.appendChild(botIcon);
        messageWrapper.appendChild(typingIndicator);

        chatContainer.appendChild(messageWrapper);
        scrollToBottom();
    }

    function removeTypingIndicator() {
        const typingWrapper = document.getElementById('typingWrapper');
        if (typingWrapper) {
            chatContainer.removeChild(typingWrapper);
        }
    }

    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function generateResponse(message) {
        // Convert message to lowercase for easier pattern matching
        const lowerMessage = message.toLowerCase();

        // Check for greetings
        if (containsAny(lowerMessage, ['hello', 'hi', 'hey', 'greetings'])) {
            return "Hello! How can I help you find the perfect meal today? Are you looking for something specific like vegetarian or low-calorie options?";
        }

        // Check for general help request
        if (containsAny(lowerMessage, ['help', 'assist', 'recommendation', 'suggest', 'recommend'])) {
            return "I'd be happy to help you find something to eat! I can suggest dishes based on dietary preferences like vegetarian, high protein, or spicy. Or I can recommend dishes under a certain calorie count. What are you in the mood for today?";
        }

        // Check for calorie-related queries
        let calorieMatch = false;
        if (containsAny(lowerMessage, ['low calorie', 'low-calorie', 'diet', 'light', 'calories', 'calorie'])) {
            calorieMatch = true;

            // Check for specific calorie count requests
            const calorieNumberMatch = lowerMessage.match(/under (\d+) calories/);
            if (calorieNumberMatch) {
                const calorieLimit = parseInt(calorieNumberMatch[1]);
                return generateCalorieResponse(calorieLimit);
            } else {
                // General low calorie request
                return generateCategoryResponse('low calorie');
            }
        }

        // Check for dietary preferences
        for (const category of ['vegetarian', 'vegan', 'spicy', 'high protein', 'gluten free']) {
            if (lowerMessage.includes(category)) {
                return generateCategoryResponse(category);
            }
        }

        // Check for price inquiries
        if (containsAny(lowerMessage, ['price', 'cost', 'expensive', 'cheap', 'affordable', '$'])) {
            if (containsAny(lowerMessage, ['cheap', 'affordable', 'inexpensive', 'budget'])) {
                return generatePriceResponse('low');
            } else if (containsAny(lowerMessage, ['expensive', 'high-end', 'fancy', 'premium'])) {
                return generatePriceResponse('high');
            } else {
                return "Our menu offers a range of prices to suit different budgets. The Mediterranean Salad at $14.99 and Caesar Salad at $12.99 are our most affordable options, while our specialty dishes like Pan-Seared Salmon at $26.99 are premium selections. Would you like me to suggest something in a particular price range?";
            }
        }

        // Check for specific dish inquiries
        for (const item of menuItems) {
            if (lowerMessage.includes(item.name.toLowerCase())) {
                return `${item.name} is an excellent choice! ${item.description} It has ${item.calories} calories and costs $${item.price.toFixed(2)}. Would you like to know about other similar dishes?`;
            }
        }

        // Default response if no pattern matches
        return "I'm sorry, I didn't understand that.";
    }

    function generateCalorieResponse(calorieLimit) {
        const filteredItems = menuItems.filter(item => item.calories < calorieLimit);

        if (filteredItems.length > 0) {
            return `Here are some low-calorie options under ${calorieLimit} calories:\n` +
                filteredItems.map(item => `${item.name} - ${item.calories} calories - $${item.price.toFixed(2)}`).join('\n');
        } else {
            return `Sorry, we don't have any dishes under ${calorieLimit} calories. Would you like to see other options?`;
        }
    }

    function generateCategoryResponse(category) {
        const filteredItems = menuItems.filter(item => item.categories.includes(category));

        if (filteredItems.length > 0) {
            return `Here are some ${category} options:\n` +
                filteredItems.map(item => `${item.name} - ${item.description} - $${item.price.toFixed(2)}`).join('\n');
        } else {
            return `Sorry, we don't have any ${category} dishes. Would you like to explore other categories?`;
        }
    }

    function generatePriceResponse(priceRange) {
        const filteredItems = menuItems.filter(item => priceRange === 'low' ? item.price <= 20 : item.price > 20);

        if (filteredItems.length > 0) {
            return `Here are some ${priceRange} priced options:\n` +
                filteredItems.map(item => `${item.name} - $${item.price.toFixed(2)}`).join('\n');
        } else {
            return `Sorry, we don't have any ${priceRange} priced dishes. Would you like to see other options?`;
        }
    }

    function containsAny(message, words) {
        return words.some(word => message.includes(word));
    }

    function loadChatHistory() {
        const storedHistory = localStorage.getItem('chatHistory');
        if (storedHistory) {
            chatHistory = JSON.parse(storedHistory);
        }
    }

    function saveChatHistory() {
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    }
});
