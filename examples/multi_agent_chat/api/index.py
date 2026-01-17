"""
Vercel serverless function entry point for multi-agent chat.
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
parent_dir = Path(__file__).parent.parent
sys.path.insert(0, str(parent_dir))

# Import the FastAPI app
from server import app

# This is the entry point for Vercel
handler = app
