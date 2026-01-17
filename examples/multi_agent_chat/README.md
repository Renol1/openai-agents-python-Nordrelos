# Multi-Agent Chat Interface

A web-based chat interface demonstrating multiple agent collaboration patterns.

## Features

- **Multiple Agent Types**: Research, Creative, Technical, and Business specialists
- **Two Collaboration Patterns**:
  - **Triage Mode**: Auto-routes to the right specialist (handoffs pattern)
  - **Orchestrator Mode**: Coordinates multiple specialists (agents-as-tools pattern)
- **Direct Specialist Access**: Chat directly with any specialist
- **Session Management**: Maintains conversation history
- **Modern UI**: Clean, responsive chat interface

## Installation

The server uses FastAPI and the OpenAI Agents SDK:

```bash
# All dependencies should already be installed from the main project
cd examples/multi_agent_chat
```

## Usage

1. **Set your OpenAI API key**:
```bash
export OPENAI_API_KEY="your-key-here"
```

2. **Start the server**:
```bash
uv run python -m examples.multi_agent_chat.server
```

3. **Open your browser** to: http://localhost:8000

## How It Works

### Agent Patterns

1. **Triage Agent** (Handoffs Pattern)
   - Analyzes user request
   - Routes to the most appropriate specialist
   - Specialist handles the conversation

2. **Orchestrator Agent** (Agents-as-Tools Pattern)
   - Uses specialists as tools
   - Coordinates multiple specialists for complex requests
   - Synthesizes responses from multiple experts

3. **Direct Specialists**
   - Chat directly with Research, Creative, Technical, or Business agents
   - Each has specialized knowledge and capabilities

### API Endpoints

- `GET /` - Chat interface
- `GET /api/agents` - List available agents
- `POST /api/chat` - Send message (sync)
- `POST /api/chat/stream` - Send message (streaming)
- `DELETE /api/sessions/{session_id}` - Clear session

## Customization

Edit `agents.py` to:
- Add new specialist agents
- Modify agent instructions
- Change collaboration patterns
- Add new tools or capabilities

## Architecture

```
Frontend (HTML/JS)
    ↓
FastAPI Server (server.py)
    ↓
Agents SDK (agents.py)
    ↓
OpenAI API
```

Each agent can:
- Handle requests independently
- Hand off to other agents
- Be used as a tool by orchestrator agents
- Maintain conversation history
