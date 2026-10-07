import os
from app.services.repo_manager import RepoManager
from app.services.framework_detector import FrameworkDetector
from app.services.repo_analyzer import RepoAnalyzer
from app.services.test_runner import TestRunner
from app.sandbox.executor import CommandExecutor
from app.sandbox.patcher import PatchGenerator
from app.agent.task_contract import TaskContractAgent
from app.agent.file_locator import FileLocatorAgent
from app.agent.coder import CoderAgent
from app.agent.validator import BlindValidator
from app.llm.base import LLMProvider
from app.core.storage import save_artifact

class MasterOrchestrator:
    def __init__(self, llm: LLMProvider):
        self.llm = llm
        self.repo_manager = RepoManager()
        self.detector = FrameworkDetector()
        self.analyzer = RepoAnalyzer()
        self.executor = CommandExecutor()
        self.test_runner = TestRunner(self.executor)
        self.contract_agent = TaskContractAgent(self.llm)
        self.locator_agent = FileLocatorAgent(self.llm)
        self.coder_agent = CoderAgent(self.llm)
        self.validator = BlindValidator(self.llm)
        self.patcher = PatchGenerator()

    async def run(self, run_id: str, github_url: str, user_request: str) -> dict:
        workspace_path = None
        try:
            workspace_path = self.repo_manager.clone(github_url, run_id)
            
            framework = self.detector.detect(workspace_path)
            save_artifact(run_id, "framework", framework)
            
            repo_map = self.analyzer.build_map(workspace_path)
            save_artifact(run_id, "repo_map", repo_map)
            
            baseline_summary = self.test_runner.run_tests(workspace_path, framework, run_id)
            
            contract = await self.contract_agent.analyze(user_request, repo_map, framework)
            save_artifact(run_id, "contract", contract)
            
            files_to_modify = await self.locator_agent.locate_files(contract, repo_map)
            
            modifications = []
            for rel_path in files_to_modify:
                full_path = os.path.join(workspace_path, rel_path)
                with open(full_path, "r", encoding="utf-8") as f:
                    original_content = f.read()
                    
                new_content = await self.coder_agent.modify_file(contract, rel_path, original_content)
                
                with open(full_path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                    
                modifications.append({
                    "file_path": rel_path,
                    "original": original_content,
                    "modified": new_content
                })
                
            new_summary = self.test_runner.run_tests(workspace_path, framework)
            save_artifact(run_id, "post_test_summary", new_summary)
            
            patch_content = self.patcher.generate_and_save_patch(run_id, modifications)
            
            validation = await self.validator.validate(contract, baseline_summary, new_summary, patch_content)
            save_artifact(run_id, "validation", validation)
            
            status = "COMPLETED_SUCCESS" if validation.passed else "COMPLETED_FAILED_VALIDATION"
            
            return {
                "run_id": run_id,
                "status": status,
                "validation": validation.passed,
                "reason": validation.reason
            }
            
        except Exception as e:
            return {
                "run_id": run_id,
                "status": "FAILED",
                "error": str(e)
            }
        finally:
            if workspace_path:
                self.repo_manager.cleanup(run_id)
