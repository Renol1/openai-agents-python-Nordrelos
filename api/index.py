"""
FastAPI server for multi-agent chat interface.
"""

import asyncio
import logging
import os
import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

# Load environment variables
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from agents import ItemHelpers, MessageOutputItem, Runner, TResponseInputItem

from .multi_agents import AGENTS, get_agent, get_available_agents

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Request/Response models
class ChatRequest(BaseModel):
    agent_name: str
    message: str
    history: list[dict[str, Any]] = []
    session_id: str | None = None


class ChatResponse(BaseModel):
    response: str
    agent: str
    session_id: str
    history: list[dict[str, Any]]


# Session storage
sessions: dict[str, dict[str, Any]] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown."""
    logger.info("Starting multi-agent chat server...")
    yield
    logger.info("Shutting down multi-agent chat server...")


app = FastAPI(lifespan=lifespan, title="Multi-Agent Chat API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/agents")
async def list_agents():
    """List all available agents."""
    return {"agents": get_available_agents()}


@app.post("/api/chat")
async def chat(request: ChatRequest) -> ChatResponse:
    """Handle chat request with specified agent."""
    try:
        # Get or create session
        session_id = request.session_id or str(uuid.uuid4())
        if session_id not in sessions:
            sessions[session_id] = {
                "history": [],
                "current_agent": request.agent_name,
            }

        # Get the agent
        agent = get_agent(request.agent_name)

        # Build input from history + new message
        inputs: list[TResponseInputItem] = request.history.copy() if request.history else []
        inputs.append({"content": request.message, "role": "user"})

        # Run the agent
        result = await Runner.run(agent, input=inputs)

        # Extract response text
        response_text = result.final_output or ""
        if not response_text:
            # Try to get text from output items
            for item in result.new_items:
                if isinstance(item, MessageOutputItem):
                    text = ItemHelpers.text_message_output(item)
                    if text:
                        response_text += text + "\n"

        # Update history
        updated_history = result.to_input_list()

        # Update session
        sessions[session_id]["history"] = updated_history
        current_agent_name = result.agent.name if hasattr(result, 'agent') else request.agent_name
        sessions[session_id]["current_agent"] = current_agent_name

        return ChatResponse(
            response=response_text.strip(),
            agent=current_agent_name,
            session_id=session_id,
            history=updated_history,
        )

    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat/stream")
async def chat_stream(request: ChatRequest):
    """Handle streaming chat request."""

    async def event_generator():
        try:
            # Get or create session
            session_id = request.session_id or str(uuid.uuid4())
            if session_id not in sessions:
                sessions[session_id] = {
                    "history": [],
                    "current_agent": request.agent_name,
                }

            # Get the agent
            agent = get_agent(request.agent_name)

            # Build input
            inputs: list[TResponseInputItem] = request.history.copy() if request.history else []
            inputs.append({"content": request.message, "role": "user"})

            # Stream the response
            result = Runner.run_streamed(agent, input=inputs)

            # Send session ID first
            yield f"data: {{'type': 'session', 'session_id': '{session_id}'}}\n\n"

            async for event in result.stream_events():
                # Send text deltas
                if hasattr(event, "data") and hasattr(event.data, "delta"):
                    delta = event.data.delta
                    if delta:
                        yield f"data: {{'type': 'delta', 'content': {repr(delta)}}}\n\n"

            # Get final result
            final_result = await result.wait()

            # Send final metadata
            agent_name = final_result.agent.name if hasattr(final_result, 'agent') else 'unknown'
            yield f"data: {{'type': 'done', 'agent': '{agent_name}'}}\n\n"

            # Update session
            sessions[session_id]["history"] = final_result.to_input_list()
            sessions[session_id]["current_agent"] = agent_name

        except Exception as e:
            logger.error(f"Error in streaming: {e}", exc_info=True)
            yield f"data: {{'type': 'error', 'message': {repr(str(e))}}}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.delete("/api/sessions/{session_id}")
async def clear_session(session_id: str):
    """Clear a session."""
    if session_id in sessions:
        del sessions[session_id]
        return {"status": "cleared"}
    raise HTTPException(status_code=404, detail="Session not found")


# For Vercel serverless
handler = app

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info",
    )
