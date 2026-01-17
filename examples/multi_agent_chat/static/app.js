// Multi-Agent Chat Application

let currentAgent = 'triage';
let sessionId = null;
let messageHistory = [];
let agents = {};
let messageCount = 0;
let agentSwitches = 0;
let lastAgent = null;

const agentDescriptions = {
    'triage': 'Routes to the right specialist (handoffs pattern)',
    'orchestrator': 'Coordinates multiple specialists (agents-as-tools pattern)',
    'research': 'Research and information specialist',
    'creative': 'Creative writing specialist',
    'technical': 'Technical and programming specialist',
    'business': 'Business and strategy specialist',
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadAgents();
    renderAgentList();
    updateAgentInfo();
    setupCharCounter();
    
    const agentSelect = document.getElementById('agentSelect');
    agentSelect.addEventListener('change', (e) => {
        currentAgent = e.target.value;
        updateAgentInfo();
        renderAgentList();
    });
});

async function loadAgents() {
    try {
        const apiUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:8000/api/agents'
            : '/api/agents';
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        agents = data.agents;
    } catch (error) {
        console.error('Error loading agents:', error);
        agents = agentDescriptions;
    }
}

function renderAgentList() {
    const agentList = document.getElementById('agentList');
    agentList.innerHTML = '';
    
    for (const [name, description] of Object.entries(agents)) {
        const card = document.createElement('div');
        card.className = `agent-card ${name === currentAgent ? 'active' : ''}`;
        card.onclick = () => selectAgent(name);
        
        const icon = getAgentIcon(name);
        card.innerHTML = `
            <div class="agent-card-header">
                <span class="agent-icon">${icon}</span>
                <h4>${formatAgentName(name)}</h4>
            </div>
            <p>${description}</p>
        `;
        
        agentList.appendChild(card);
    }
}

function getAgentIcon(name) {
    const icons = {
        'triage': '🎯',
        'orchestrator': '🎼',
        'research': '🔬',
        'creative': '🎨',
        'technical': '💻',
        'business': '💼',
    };
    return icons[name] || '🤖';
}

function formatAgentName(name) {
    return name.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function selectAgent(name) {
    currentAgent = name;
    document.getElementById('agentSelect').value = name;
    updateAgentInfo();
    renderAgentList();
}

function updateAgentInfo() {
    const agentInfo = document.getElementById('agentInfo');
    agentInfo.textContent = agents[currentAgent] || agentDescriptions[currentAgent] || '';
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message to UI
    addMessage('user', message);
    input.value = '';
    document.getElementById('charCount').textContent = '0/2000';
    
    // Show typing indicator
    showTypingIndicator();
    
    // Disable send button
    const sendBtn = document.getElementById('sendBtn');
    const sendBtnText = document.getElementById('sendBtnText');
    sendBtn.disabled = true;
    sendBtnText.innerHTML = '<div class="loading"><div class="loading-dot"></div><div class="loading-dot"></div><div class="loading-dot"></div></div>';
    
    try {
        // Use relative path for API - works both locally and on Vercel
        const apiUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:8000/api/chat'
            : '/api/chat';
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                agent_name: currentAgent,
                message: message,
                history: messageHistory,
                session_id: sessionId,
            }),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Remove typing indicator
        removeTypingIndicator();
        
        // Update session
        sessionId = data.session_id;
        messageHistory = data.history;
        
        // Track agent switches
        if (lastAgent && lastAgent !== data.agent) {
            agentSwitches++;
            updateStats();
        }
        lastAgent = data.agent;
        
        // Add assistant response
        addMessage('assistant', data.response, data.agent);
        
        // Update stats
        messageCount++;
        updateStats();
        
    } catch (error) {
        console.error('Error sending message:', error);
        removeTypingIndicator();
        addMessage('assistant', `⚠️ Error: ${error.message}`, 'error');
    } finally {
        sendBtn.disabled = false;
        sendBtnText.textContent = 'Send';
    }
}

function addMessage(role, content, agent = null) {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const avatar = role === 'user' ? '👤' : (agent ? getAgentIcon(agent) : '🤖');
    
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = 'message-wrapper';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;
    
    const metaDiv = document.createElement('div');
    metaDiv.className = 'message-meta';
    
    if (role === 'assistant' && agent && agent !== 'error') {
        const badge = document.createElement('span');
        badge.className = 'agent-badge';
        badge.textContent = `${getAgentIcon(agent)} ${formatAgentName(agent)}`;
        metaDiv.appendChild(badge);
    }
    
    const timestamp = document.createElement('span');
    timestamp.className = 'timestamp';
    timestamp.textContent = time;
    metaDiv.appendChild(timestamp);
    
    wrapperDiv.appendChild(contentDiv);
    wrapperDiv.appendChild(metaDiv);
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    avatarDiv.textContent = avatar;
    
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(wrapperDiv);
    
    messagesDiv.appendChild(messageDiv);
    
    // Smooth scroll to bottom
    messagesDiv.scrollTo({
        top: messagesDiv.scrollHeight,
        behavior: 'smooth'
    });
}

function clearChat() {
    if (!confirm('🗑️ Clear all messages and start fresh?')) return;
    
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = '';
    
    // Add welcome message
    messagesDiv.innerHTML = `
        <div class="message assistant" style="animation: none;">
            <div class="message-avatar">👋</div>
            <div class="message-wrapper">
                <div class="message-content">
                    <strong>Chat cleared! Ready for a new conversation.</strong><br><br>
                    What would you like help with today?
                </div>
            </div>
        </div>
    `;
    
    messageHistory = [];
    messageCount = 0;
    agentSwitches = 0;
    lastAgent = null;
    updateStats();
    
    if (sessionId) {
        const apiUrl = window.location.hostname === 'localhost' 
            ? `http://localhost:8000/api/sessions/${sessionId}`
            : `/api/sessions/${sessionId}`;
        
        fetch(apiUrl, {
            method: 'DELETE',
        }).catch(console.error);
        sessionId = null;
    }
}

function setupCharCounter() {
    const input = document.getElementById('messageInput');
    const counter = document.getElementById('charCount');
    
    input.addEventListener('input', () => {
        const length = input.value.length;
        counter.textContent = `${length}/2000`;
        counter.style.color = length > 1800 ? '#ef4444' : 'var(--text-secondary)';
    });
}

function showTypingIndicator() {
    const messagesDiv = document.getElementById('messages');
    const indicator = document.createElement('div');
    indicator.id = 'typingIndicator';
    indicator.className = 'message assistant';
    indicator.style.animation = 'none';
    indicator.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    messagesDiv.appendChild(indicator);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

function updateStats() {
    document.getElementById('messageCount').textContent = messageCount;
    document.getElementById('agentSwitches').textContent = agentSwitches;
}
