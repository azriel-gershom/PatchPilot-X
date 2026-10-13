import asyncio
from app.agent.orchestrator import MasterOrchestrator
from app.llm.gemini import GeminiProvider

from app.llm.fallback import FallbackLLMProvider
from app.llm.groq import GroqProvider

async def main():
    import dotenv
    dotenv.load_dotenv()
    gemini = GeminiProvider()
    groq = GroqProvider()
    llm = FallbackLLMProvider([gemini, groq])
    orchestrator = MasterOrchestrator(llm)
    try:
        import uuid
        run_id = str(uuid.uuid4())
        result = await orchestrator.run(run_id, "https://github.com/azriel-gershom/testing.git", "Add case-insensitive username search.")
        print(result)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
