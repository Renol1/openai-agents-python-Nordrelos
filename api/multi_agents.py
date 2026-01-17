"""
Multi-agent configuration with different specialized agents that can collaborate.
"""

from agents import Agent

# Specialized agents for different tasks
research_agent = Agent(
    name="research_agent",
    instructions="""You are a research specialist. You help users find information, 
    analyze data, and provide well-researched answers. You cite sources when possible.""",
    handoff_description="A research specialist who finds and analyzes information",
)

creative_agent = Agent(
    name="creative_agent",
    instructions="""You are a creative writing specialist. You help users with 
    creative tasks like writing stories, poems, brainstorming ideas, and 
    developing creative concepts.""",
    handoff_description="A creative writing specialist for stories, poems, and ideas",
)

technical_agent = Agent(
    name="technical_agent",
    instructions="""You are a technical specialist. You help with programming, 
    debugging, system architecture, and technical problem-solving. You provide 
    code examples when helpful.""",
    handoff_description="A technical specialist for programming and system design",
)

business_agent = Agent(
    name="business_agent",
    instructions="""You are a business consultant. You help with business strategy, 
    marketing, finance, and organizational planning. You provide actionable advice.""",
    handoff_description="A business consultant for strategy and planning",
)

# Triage agent that routes to specialists
triage_agent = Agent(
    name="triage_agent",
    instructions="""You are a helpful assistant that routes users to the right specialist.
    
    Available specialists:
    - research_agent: For research, information gathering, and analysis
    - creative_agent: For creative writing, storytelling, and brainstorming
    - technical_agent: For programming, debugging, and technical problems
    - business_agent: For business strategy, marketing, and planning
    
    Analyze the user's request and hand off to the most appropriate specialist.
    If the request spans multiple areas, pick the primary focus.""",
    handoffs=[research_agent, creative_agent, technical_agent, business_agent],
)

# Orchestrator that can use multiple agents as tools
orchestrator_agent = Agent(
    name="orchestrator_agent",
    instructions="""You are an orchestration agent that coordinates multiple specialists.
    
    When a user needs help from multiple areas, you use the specialist tools to gather
    information from each relevant expert, then synthesize their responses into a 
    comprehensive answer.
    
    Always use the tools provided - never try to answer directly.""",
    tools=[
        research_agent.as_tool(
            tool_name="consult_researcher",
            tool_description="Get research and analysis from the research specialist",
        ),
        creative_agent.as_tool(
            tool_name="consult_creative",
            tool_description="Get creative ideas from the creative specialist",
        ),
        technical_agent.as_tool(
            tool_name="consult_technical",
            tool_description="Get technical advice from the technical specialist",
        ),
        business_agent.as_tool(
            tool_name="consult_business",
            tool_description="Get business advice from the business specialist",
        ),
    ],
)

# Map of all available agents
AGENTS = {
    "triage": triage_agent,
    "orchestrator": orchestrator_agent,
    "research": research_agent,
    "creative": creative_agent,
    "technical": technical_agent,
    "business": business_agent,
}


def get_agent(agent_name: str) -> Agent:
    """Get an agent by name."""
    return AGENTS.get(agent_name, triage_agent)


def get_available_agents() -> dict[str, str]:
    """Get list of available agents with descriptions."""
    return {
        "triage": "Routes to the right specialist (handoffs pattern)",
        "orchestrator": "Coordinates multiple specialists (agents-as-tools pattern)",
        "research": "Research and information specialist",
        "creative": "Creative writing specialist",
        "technical": "Technical and programming specialist",
        "business": "Business and strategy specialist",
    }
