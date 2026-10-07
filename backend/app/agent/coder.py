import ast
from pydantic import BaseModel, Field
from app.llm.base import LLMProvider
from app.models.domain import ChangeContract

class FileModification(BaseModel):
    file_path: str = Field(description="The path of the file being modified")
    new_content: str = Field(description="The complete new content of the file")

class CoderAgent:
    def __init__(self, llm: LLMProvider):
        self.llm = llm
        
    async def modify_file(
        self, 
        contract: ChangeContract, 
        file_path: str, 
        original_content: str,
        feedback: str = None
    ) -> str:
        
        system_prompt = (
            "You are a meticulous Software Engineer. "
            "You are provided with a ChangeContract and the current content of a file. "
            "Your task is to modify the file to fulfill the contract, while PRESERVING "
            "everything else (imports, unrelated functions, edge cases). "
            "You must return the ENTIRE new content of the file. Do not truncate or omit unchanged parts."
        )
        
        prompt = (
            f"Contract Goal: {contract.goal}\n"
            f"Must Change: {contract.must_change}\n"
            f"Must Preserve: {contract.must_preserve}\n\n"
            f"File Path: {file_path}\n"
            f"Original Content:\n```\n{original_content}\n```\n"
        )
        
        if feedback:
            prompt += f"\nPREVIOUS ATTEMPT FAILED WITH FEEDBACK:\n{feedback}\nPlease fix the issues and try again.\n"
            
        prompt += "\nGenerate the complete new file content."
        
        response = await self.llm.generate_structured(prompt, FileModification, system_prompt)
        
        new_content = response.new_content
        
        if file_path.endswith(".py"):
            try:
                ast.parse(new_content)
            except SyntaxError as e:
                raise ValueError(f"Generated Python code contains syntax errors: {e}")
                
        return new_content
