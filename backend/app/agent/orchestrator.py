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
from app.agent.validator import BlindValidator, ValidationResult
from app.agent.hallucination_checker import HallucinationChecker
from app.agent.explainer import ExplainerAgent
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
        self.hallucination_checker = HallucinationChecker(self.llm)
        self.explainer = ExplainerAgent(self.llm)
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
            
            original_contents = {}
            for rel_path in files_to_modify:
                full_path = os.path.join(workspace_path, rel_path)
                with open(full_path, "r", encoding="utf-8") as f:
                    original_contents[rel_path] = f.read()

            MAX_RETRIES = 2
            validation = None
            modifications = []
            
            for attempt in range(MAX_RETRIES + 1):
                feedback = validation.reason if validation else None
                modifications = []
                
                # Restore original contents to workspace before attempting
                for rel_path, orig in original_contents.items():
                    full_path = os.path.join(workspace_path, rel_path)
                    with open(full_path, "w", encoding="utf-8") as f:
                        f.write(orig)
                
                for rel_path in files_to_modify:
                    orig = original_contents[rel_path]
                    new_content = await self.coder_agent.modify_file(contract, rel_path, orig, feedback=feedback)
                    
                    full_path = os.path.join(workspace_path, rel_path)
                    with open(full_path, "w", encoding="utf-8") as f:
                        f.write(new_content)
                        
                    modifications.append({
                        "file_path": rel_path,
                        "original": orig,
                        "modified": new_content
                    })
                    
                new_summary = self.test_runner.run_tests(workspace_path, framework)
                save_artifact(run_id, f"post_test_summary_attempt_{attempt}", new_summary)
                
                patch_content = self.patcher.generate_and_save_patch(run_id, modifications)
                
                hallucination = await self.hallucination_checker.check(patch_content, str(repo_map.model_dump()))
                save_artifact(run_id, f"hallucination_attempt_{attempt}", hallucination)
                
                if hallucination.status == "YES":
                    validation = ValidationResult(
                        passed=False,
                        reason="Hallucination detected: " + "; ".join(hallucination.evidence),
                        regressions=[]
                    )
                    save_artifact(run_id, f"validation_attempt_{attempt}", validation)
                    continue
                
                validation = await self.validator.validate(contract, baseline_summary, new_summary, patch_content)
                save_artifact(run_id, f"validation_attempt_{attempt}", validation)
                
                if validation.passed:
                    explanation = await self.explainer.explain(contract, patch_content, validation)
                    from app.core.storage import BASE_DIR
                    expl_dir = os.path.join(BASE_DIR, run_id)
                    os.makedirs(expl_dir, exist_ok=True)
                    expl_path = os.path.join(expl_dir, "explanation.md")
                    with open(expl_path, "w", encoding="utf-8") as f:
                        f.write(explanation)
                    break
            
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
