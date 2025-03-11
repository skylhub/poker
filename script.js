// State management
const state = {
    participants: new Map(),
    isVotingActive: false,
    timer: 300,
    timerInterval: null,
    currentItem: null,
    items: new Map(),
    currentEstimationId: null
};

// DOM Elements
const elements = {
    username: document.getElementById('username'),
    userRole: document.getElementById('user-role'),
    joinButton: document.getElementById('join-session'),
    startVoting: document.getElementById('start-voting'),
    revealCards: document.getElementById('reveal-cards'),
    resetVoting: document.getElementById('reset-voting'),
    countdown: document.getElementById('countdown'),
    participantsList: document.getElementById('participants-list'),
    cards: document.querySelectorAll('.card'),
    modal: document.getElementById('modal'),
    closeModal: document.querySelector('.close'),
    modalCard: document.getElementById('modal-card'),
    averageVote: document.getElementById('average-vote'),
    medianVote: document.getElementById('median-vote'),
    participantsVotes: document.getElementById('participants-votes'),
    chatBox: document.getElementById('chat-box'),
    chatInput: document.getElementById('chat-input'),
    sendButton: document.getElementById('send-button'),
    addItemModal: document.getElementById('add-item-modal'),
    addItemForm: document.getElementById('add-item-form'),
    closeAddItem: document.getElementById('close-add-item'),
    cancelAddItem: document.getElementById('cancel-add-item'),
    deleteConfirmation: document.getElementById('delete-confirmation'),
    confirmDelete: document.getElementById('confirm-delete'),
    cancelDelete: document.getElementById('cancel-delete'),
    acceptEstimate: document.getElementById('accept-estimate')
};

// Event Listeners
//document.addEventListener('DOMContentLoaded', () => {
document.addEventListener('DOMContentLoaded', function () {
  
elements.joinButton.addEventListener('click', handleJoinSession);
elements.startVoting.addEventListener('click', startVoting);
elements.revealCards.addEventListener('click', revealVotes);
elements.resetVoting.addEventListener('click', resetVoting);
elements.closeModal.addEventListener('click', () => elements.modal.style.display = 'none');
elements.sendButton.addEventListener('click', sendChatMessage);
elements.chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendChatMessage();
    });

    // Handle close button click on estimated items
    document.querySelectorAll('.estimated .close-btn').forEach(button => {
        button.addEventListener('click', function () {
            this.closest('.estimation-item').style.display = 'none';
        });
    });
});
    // Add Item Modal
    document.getElementById('add-item-btn').addEventListener('click', showAddItemModal);
    elements.addItemForm.addEventListener('submit', handleAddItem);
    elements.closeAddItem.addEventListener('click', hideAddItemModal);
    elements.cancelAddItem.addEventListener('click', hideAddItemModal);

    // Delete Confirmation
    document.querySelectorAll('.delete-btn').forEach(btn => {
        const item = btn.closest('.estimation-item');
        const itemData = {
            id: item.dataset.id,
            title: item.querySelector('a').textContent,
            link: item.querySelector('a').href,
            description: item.querySelector('p').textContent
        };

        btn.addEventListener('click', () => {
            showDeleteConfirmation(itemData, () => {
                state.items.delete(itemData.id);
                item.style.opacity = '0';
                item.style.transform = 'translateX(-10px)';
                setTimeout(() => item.remove(), 200);
            });
        });
    });

    // Initialize estimate buttons for existing items
    document.querySelectorAll('.estimate-btn').forEach(btn => {
        const item = btn.closest('.estimation-item');
        const itemData = {
            id: item.dataset.id,
            title: item.querySelector('a').textContent,
            link: item.querySelector('a').href,
            description: item.querySelector('p').textContent
        };

        btn.addEventListener('click', () => {
            // Remove current-estimation class from all items
            document.querySelectorAll('.estimation-item').forEach(item => {
                item.classList.remove('current-estimation');
            });
            
            // Add current-estimation class to this item
            item.classList.add('current-estimation');
            
            // Set current estimation ID
            state.currentEstimationId = itemData.id;
            
            // Reset any previous votes
            state.participants.forEach(participant => {
                participant.vote = null;
            });
            updateParticipantsList();
            
            // Enable start voting button if there are participants
            elements.startVoting.disabled = false;
            
            addChatMessage('estimation', `Now estimating: ${itemData.title}`);
        });
    });

    // Add accept estimate button handler
    elements.acceptEstimate.addEventListener('click', acceptEstimation);

    // Show chat input container again
    const chatInputContainer = document.querySelector('.chat-input-container');
    if (chatInputContainer) {
        chatInputContainer.style.display = 'flex';
    }
});

// Add Item Modal Functions
function showAddItemModal() {
    elements.addItemModal.style.display = 'block';
}

function hideAddItemModal() {
    elements.addItemModal.style.display = 'none';
    elements.addItemForm.reset();
}

function handleAddItem(e) {
    e.preventDefault();

    const title = document.getElementById('item-title').value;
    const link = document.getElementById('item-link').value;
    const description = document.getElementById('item-description').value;

    const itemId = `item${Date.now()}`;

    const itemElement = createItemElement({
        id: itemId,
        title,
        link,
        description
    });

    document.getElementById('to-estimate-list').appendChild(itemElement);

    state.items.set(itemId, {
        title,
        link,
        description,
        createdAt: new Date(),
        estimate: null
    });

    hideAddItemModal();
    addChatMessage('estimation', `New item "${title}" added`);
}

// Delete Confirmation Functions
function showDeleteConfirmation(item, onConfirm) {
    elements.deleteConfirmation.style.display = 'block';

    const handleConfirm = () => {
        onConfirm();
        hideDeleteConfirmation();
        addChatMessage('estimation', `Item "${item.title}" has been deleted`);
    };

    const handleCancel = () => {
        hideDeleteConfirmation();
    };

    elements.confirmDelete.addEventListener('click', handleConfirm, { once: true });
    elements.cancelDelete.addEventListener('click', handleCancel, { once: true });
}

function hideDeleteConfirmation() {
    elements.deleteConfirmation.style.display = 'none';
}

function createItemElement(item) {
    const li = document.createElement('li');
    li.className = 'estimation-item';
    li.dataset.id = item.id;

    li.innerHTML = `
        <div class="item-header">
            <div class="item-content">
                <a href="${item.link}" target="_blank">${item.title}</a>
                <p>${item.description}</p>
            </div>
            <button class="delete-btn" title="Delete item">×</button>
        </div>
        <button class="estimate-btn">Estimate</button>
    `;

    // Add delete functionality
    const deleteBtn = li.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
        showDeleteConfirmation(item, () => {
            state.items.delete(item.id);
            li.style.opacity = '0';
            li.style.transform = 'translateX(-10px)';
            setTimeout(() => li.remove(), 200);
        });
    });

    // Add estimate button functionality
    const estimateBtn = li.querySelector('.estimate-btn');
    estimateBtn.addEventListener('click', () => {
        // Remove current-estimation class from all items
        document.querySelectorAll('.estimation-item').forEach(item => {
            item.classList.remove('current-estimation');
        });
        
        // Add current-estimation class to this item
        li.classList.add('current-estimation');
        
        // Set current estimation ID
        state.currentEstimationId = item.id;
        
        // Reset any previous votes
        state.participants.forEach(participant => {
            participant.vote = null;
        });
        updateParticipantsList();
        
        // Enable start voting button if there are participants
        elements.startVoting.disabled = false;
        
        addChatMessage('estimation', `Now estimating: ${item.title}`);
    });

    return li;
}

// Update window click event
window.onclick = (event) => {
    if (event.target === elements.modal) {
        elements.modal.style.display = 'none';
    }
    if (event.target === elements.addItemModal) {
        hideAddItemModal();
    }
    if (event.target === elements.deleteConfirmation) {
        hideDeleteConfirmation();
    }
};

// Session Management Functions
function handleJoinSession() {
    const name = elements.username.value.trim();
    const role = elements.userRole.value;
    
    if (!name) {
        alert('Please enter your name');
        return;
    }

    state.participants.set(name, {
        name,
        role,
        vote: null
    });

    updateParticipantsList();
    elements.username.disabled = true;
    elements.userRole.disabled = true;
    elements.joinButton.disabled = true;

    addChatMessage('join', name);
}

function startVoting() {
    if (state.participants.size < 1) {
        alert('Need at least one participant to start voting');
        return;
    }

    if (!state.currentEstimationId) {
        alert('Please select an item to estimate');
        return;
    }

    state.isVotingActive = true;
    elements.startVoting.disabled = true;
    resetTimer();
    startTimer();
    
    state.participants.forEach(participant => {
        participant.vote = null;
    });
    
    const itemTitle = document.querySelector(`.estimation-item[data-id="${state.currentEstimationId}"]`)
        .querySelector('a').textContent;
    addChatMessage('estimation', `Started voting for: ${itemTitle}`);
}

function revealVotes() {
    if (!state.isVotingActive) return;
    
    state.isVotingActive = false;
    clearInterval(state.timerInterval);
    
    const votes = Array.from(state.participants.values())
        .filter(p => p.vote !== null)
        .map(p => parseInt(p.vote));
    
    if (votes.length === 0) {
        alert('No votes to reveal');
        return;
    }

    const average = calculateAverage(votes);
    const median = calculateMedian(votes);
    
    elements.averageVote.textContent = average.toFixed(1);
    elements.medianVote.textContent = median;
    
    const votesList = Array.from(state.participants.entries())
        .map(([name, data]) => `${name}: ${data.vote || 'No vote'}`)
        .join('<br>');
    elements.participantsVotes.innerHTML = votesList;
    
    elements.modal.style.display = 'block';
}

function resetVoting() {
    state.isVotingActive = false;
    clearInterval(state.timerInterval);
    elements.startVoting.disabled = false;
    elements.countdown.textContent = '05:00';
    
    state.participants.forEach(participant => {
        participant.vote = null;
    });
    
    updateParticipantsList();
    addChatMessage('estimation', 'Voting has been reset');
}

// Timer Functions
function startTimer() {
    state.timerInterval = setInterval(() => {
        state.timer--;
        updateTimerDisplay();
        
        if (state.timer <= 0) {
            revealVotes();
        }
    }, 1000);
}

function resetTimer() {
    state.timer = 300;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const minutes = Math.floor(state.timer / 60);
    const seconds = state.timer % 60;
    elements.countdown.textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Chat Functions
function sendChatMessage() {
    const message = elements.chatInput.value.trim();
    const username = elements.username.value;
    
    if (!message || !username) return;
    
    addChatMessage(username, message);
    elements.chatInput.value = '';
}

function addChatMessage(type, message) {
    const messageDiv = document.createElement('div');
    
    if (type === 'join' || type === 'estimation' || type === 'result') {
        // System message
        messageDiv.className = `chat-message system-message ${type}-message fade-in`;
        messageDiv.innerHTML = `<strong>System:</strong> ${message}`;
        
        // Add to chat box
        elements.chatBox.appendChild(messageDiv);
        elements.chatBox.scrollTop = elements.chatBox.scrollHeight;
        
        // Remove after 5 seconds
        setTimeout(() => {
            messageDiv.classList.add('fade-out');
            setTimeout(() => {
                messageDiv.remove();
            }, 300); // Remove after fade out animation
        }, 5000);
    } else {
        // Regular chat message
        messageDiv.className = 'chat-message';
        messageDiv.innerHTML = `<strong>${type}:</strong> ${message}`;
        elements.chatBox.appendChild(messageDiv);
        elements.chatBox.scrollTop = elements.chatBox.scrollHeight;
    }
}

// Helper Functions
function updateParticipantsList() {
    elements.participantsList.innerHTML = '';
    state.participants.forEach(participant => {
        const li = document.createElement('li');
        li.textContent = `${participant.name} (${participant.role}) ${participant.vote ? '✓' : ''}`;
        elements.participantsList.appendChild(li);
    });
}

function calculateAverage(numbers) {
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

function calculateMedian(numbers) {
    const sorted = numbers.sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
        return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    
    return sorted[middle];
}

// Add card click handlers
elements.cards.forEach(card => {
    card.addEventListener('click', () => {
        if (!state.isVotingActive) return;
        
        const username = elements.username.value;
        const participant = state.participants.get(username);
        
        if (!participant || participant.role !== 'participant') return;
        
        const value = card.dataset.value;
        participant.vote = value;
        updateParticipantsList();
    });
});

// Add this function to handle estimation acceptance
function acceptEstimation() {
    if (state.currentEstimationId) {
        const estimatedItem = document.querySelector(`.estimation-item[data-id="${state.currentEstimationId}"]`);
        if (estimatedItem) {
            const median = elements.medianVote.textContent;
            const itemTitle = estimatedItem.querySelector('a').textContent;
            
            // Remove the current-estimation class
            estimatedItem.classList.remove('current-estimation');
            
            // Remove estimate button
            const estimateBtn = estimatedItem.querySelector('.estimate-btn');
            if (estimateBtn) {
                estimateBtn.remove();
            }
            
            // Create and add estimate badge
            const estimateBadge = document.createElement('div');
            estimateBadge.className = 'estimate-badge';
            estimateBadge.textContent = `${median} points`;
            estimatedItem.appendChild(estimateBadge);
            
            // Move to estimated list
            document.getElementById('estimated-list').appendChild(estimatedItem);
            
            // Add system message
            addChatMessage('result', `Final estimation for "${itemTitle}": ${median} points`);
            
            // Reset current estimation
            state.currentEstimationId = null;
            
            // Hide the modal
            elements.modal.style.display = 'none';
        }
    }
}
document.getElementById('join-session').addEventListener('click', function() {
    const username = document.getElementById('username').value;
    if (username) {
        sessionStorage.setItem('username', username);
        alert(`Welcome, ${username}! You have joined the session.`);
        // Additional logic to add the user to the participants list
        const participantsList = document.getElementById('participants-list');
        const participantItem = document.createElement('li');
        participantItem.textContent = username;
        participantsList.appendChild(participantItem);
    } else {
        alert('Please enter your name to join the session.');
    }
});

// Function to store estimations
function storeEstimation(itemId, estimation) {
    const username = sessionStorage.getItem('username');
    if (username) {
        let estimations = JSON.parse(localStorage.getItem('estimations')) || {};
        if (!estimations[username]) {
            estimations[username] = {};
        }
        estimations[username][itemId] = estimation;
        localStorage.setItem('estimations', JSON.stringify(estimations));
        alert(`Estimation stored for ${username}: ${estimation}`);
    } else {
        alert('Please join the session first.');
    }
}

// Example usage: Store estimation for item1
storeEstimation('item1', 5);
