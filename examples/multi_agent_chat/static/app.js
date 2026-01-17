// AI Agent Hub - Multi-Agent Chat Application

let currentAgent = 'triage';
let sessionId = null;
let messageHistory = [];
let agents = {};
let messageCount = 0;
let agentSwitches = 0;
let lastAgent = null;

const agentDescriptions = {
    'triage': 'Routes to specialists',
    'orchestrator': 'Coordinates agents',
    'research': 'Research & analysis',
    'creative': 'Creative writing',
    'technical': 'Technical help',
    'business': 'Business strategy',
};

const agentFullDescriptions = {
    'triage': 'Routes your request to the right specialist',
    'orchestrator': 'Coordinates multiple agents to handle complex tasks',
    'research': 'Research, analysis, and information gathering',
    'creative': 'Creative writing and brainstorming',
    'technical': 'Technical programming and debugging',
    'business': 'Business strategy and planning',
};

const agentIcons = {
    'triage': '🎯',
    'orchestrator': '🎼',
    'research': '🔬',
    'creative': '🎨',
    'technical': '💻',
    'business': '💼',
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadAgents();
    renderAgentList();
    updateModeBanner();
    setupEventListeners();
});

function setupEventListeners() {
    const input = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const agentSelect = document.getElementById('agentSelect');

    // Character counter
    input.addEventListener('input', () => {
        const count = input.value.length;
        document.getElementById('charCount').textContent = `${count}/2000`;
    });

    // Enter to send
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Send button
    sendBtn.addEventListener('click', sendMessage);

    // Agent selector
    agentSelect.addEventListener('change', (e) => {
        currentAgent = e.target.value;
        updateModeBanner();
        renderAgentList();
    });
}

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
    
    const agentNames = Object.keys(agents).length > 0 ? Object.keys(agents) : Object.keys(agentDescriptions);
    
    for (const name of agentNames) {
        const isActive = name === currentAgent;
        const item = document.createElement('div');
        item.className = `agent-item ${isActive ? 'active' : ''}`;
        item.onclick = () => selectAgent(name);
        
        item.innerHTML = `
            <div class="icon">${agentIcons[name] || '🤖'}</div>
            <div class="agent-info">
                <div class="agent-name">${formatAgentName(name)}</div>
                <div class="agent-desc">${agentDescriptions[name] || ''}</div>
            </div>
        `;
        
        agentList.appendChild(item);
    }
}

function formatAgentName(name) {
    return name.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function selectAgent(name) {
    currentAgent = name;
    document.getElementById('agentSelect').value = name;
    updateModeBanner();
    renderAgentList();
}

function updateModeBanner() {
    const banner = document.getElementById('modeBanner');
    const icon = agentIcons[currentAgent] || '🤖';
    const name = formatAgentName(currentAgent);
    const desc = agentFullDescriptions[currentAgent] || '';
    
    banner.innerHTML = `
        <div class="icon">${icon}</div>
        <span><strong>${name}</strong> — ${desc}</span>
    `;
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
    sendBtn.disabled = true;
    sendBtn.innerHTML = `<div class="btn-loading"><span></span><span></span><span></span></div>`;
    
    try {
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
        addMessage('assistant', `Error: Could not connect to the server. ${error.message}`, 'error');
    } finally {
        sendBtn.disabled = false;
        sendBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2"/>
            </svg>
        `;
    }
}

function addMessage(role, content, agent = null) {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const icon = role === 'user' ? '👤' : (agent ? (agentIcons[agent] || '🤖') : '🤖');
    
    let metaHTML = '';
    if (role === 'assistant' && agent && agent !== 'error') {
        metaHTML = `
            <div class="message-meta">
                <span class="agent-tag">${agentIcons[agent] || '🤖'} ${formatAgentName(agent)}</span>
                <span class="timestamp">${time}</span>
            </div>
        `;
    } else {
        metaHTML = `<div class="message-meta"><span class="timestamp">${time}</span></div>`;
    }
    
    messageDiv.innerHTML = `
        <div class="avatar">${icon}</div>
        <div class="bubble-wrapper">
            <div class="bubble">${escapeHtml(content)}</div>
            ${metaHTML}
        </div>
    `;
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showTypingIndicator() {
    const messagesDiv = document.getElementById('messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant';
    typingDiv.id = 'typing-indicator';
    
    typingDiv.innerHTML = `
        <div class="avatar">💭</div>
        <div class="bubble-wrapper">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    
    messagesDiv.appendChild(typingDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function removeTypingIndicator() {
    const typing = document.getElementById('typing-indicator');
    if (typing) {
        typing.remove();
    }
}

function updateStats() {
    document.getElementById('messageCount').textContent = messageCount;
    document.getElementById('agentSwitches').textContent = agentSwitches;
}

function clearChat() {
    // Clear messages except welcome
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = `
        <div class="message assistant welcome-message">
            <div class="avatar">✨</div>
            <div class="bubble-wrapper">
                <div class="bubble">
                    <div class="welcome-title">Welcome to AI Agent Hub!</div>
                    <div class="welcome-list">
                        <div class="welcome-item">
                            <div class="emoji">🔬</div>
                            <span>Research and analysis</span>
                        </div>
                        <div class="welcome-item">
                            <div class="emoji">🎨</div>
                            <span>Creative writing and brainstorming</span>
                        </div>
                        <div class="welcome-item">
                            <div class="emoji">💻</div>
                            <span>Technical help and debugging</span>
                        </div>
                        <div class="welcome-item">
                            <div class="emoji">💼</div>
                            <span>Business strategy and planning</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Reset state
    sessionId = null;
    messageHistory = [];
    messageCount = 0;
    agentSwitches = 0;
    lastAgent = null;
    updateStats();
    
    // Delete session on server
    if (sessionId) {
        const apiUrl = window.location.hostname === 'localhost' 
            ? `http://localhost:8000/api/sessions/${sessionId}`
            : `/api/sessions/${sessionId}`;
        
        fetch(apiUrl, { method: 'DELETE' }).catch(() => {});
    }
}
