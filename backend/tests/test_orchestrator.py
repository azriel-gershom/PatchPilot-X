import pytest
from unittest.mock import AsyncMock, MagicMock
from app.agent.orchestrator import MasterOrchestrator
from app.models.domain import FrameworkInfo, RepositoryMap, TestSummary, ChangeContract
from app.agent.validator import ValidationResult

class MockLLM:
    pass

@pytest.mark.asyncio
async def test_orchestrator_success(monkeypatch, tmp_path):
    llm = MockLLM()
    orch = MasterOrchestrator(llm)
    
    workspace = tmp_path / "workspace"
    workspace.mkdir()
    test_file = workspace / "main.py"
    test_file.write_text("orig")
    
    orch.repo_manager = MagicMock()
    orch.repo_manager.clone.return_value = str(workspace)
    
    orch.detector = MagicMock()
    orch.detector.detect.return_value = FrameworkInfo(language="PYTHON", confidence=1.0)
    
    orch.analyzer = MagicMock()
    orch.analyzer.build_map.return_value = RepositoryMap()
    
    orch.test_runner = MagicMock()
    orch.test_runner.run_tests.return_value = TestSummary(passed=1, failed=0, skipped=0, exit_code=0, stdout="", stderr="")
    
    orch.contract_agent = AsyncMock()
    orch.contract_agent.analyze.return_value = ChangeContract(goal="test", must_change=[], must_preserve=[], acceptance_criteria=[])
    
    orch.locator_agent = AsyncMock()
    orch.locator_agent.locate_files.return_value = ["main.py"]
    
    orch.coder_agent = AsyncMock()
    orch.coder_agent.modify_file.return_value = "modified"
    
    orch.validator = AsyncMock()
    orch.validator.validate.return_value = ValidationResult(passed=True, reason="ok")
    
    orch.hallucination_checker = AsyncMock()
    orch.hallucination_checker.check.return_value = MagicMock(status="NO", evidence=[])
    
    orch.explainer = AsyncMock()
    orch.explainer.explain.return_value = "# Explanation"
    
    monkeypatch.setattr("app.agent.orchestrator.save_artifact", MagicMock())
    monkeypatch.setattr("app.sandbox.patcher.PatchGenerator.generate_and_save_patch", MagicMock(return_value="diff"))
    
    res = await orch.run("test_run", "http://github.com/a/b", "do stuff")
    
    assert res["status"] == "COMPLETED_SUCCESS"
    assert res["validation"] is True
    assert orch.coder_agent.modify_file.call_count == 1
    assert orch.repo_manager.cleanup.call_count == 1
