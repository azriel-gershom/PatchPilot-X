from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class RunStatus(str, Enum):
    CREATED = "CREATED"
    CLONING = "CLONING"
    ANALYZING = "ANALYZING"
    BASELINE_TESTING = "BASELINE_TESTING"
    BEHAVIORAL_TWIN = "BEHAVIORAL_TWIN"
    TASK_ANALYSIS = "TASK_ANALYSIS"
    BLIND_PLANNING = "BLIND_PLANNING"
    LOCALIZING = "LOCALIZING"
    PLANNING = "PLANNING"
    PATCHING = "PATCHING"
    TARGETED_TESTING = "TARGETED_TESTING"
    REGRESSION_TESTING = "REGRESSION_TESTING"
    BLIND_VALIDATION = "BLIND_VALIDATION"
    VERIFYING = "VERIFYING"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"
    FAILED = "FAILED"

class RepositoryInfo(BaseModel):
    url: str
    branch: str
    commit_sha: Optional[str] = None
    workspace_path: Optional[str] = None

class RepositoryMap(BaseModel):
    file_tree: Dict[str, Any] = Field(default_factory=dict)
    languages: List[str] = Field(default_factory=list)
    source_files: List[str] = Field(default_factory=list)
    test_files: List[str] = Field(default_factory=list)
    config_files: List[str] = Field(default_factory=list)
    dependency_manifests: List[str] = Field(default_factory=list)
    entrypoints: List[str] = Field(default_factory=list)
    functions: List[str] = Field(default_factory=list)
    classes: List[str] = Field(default_factory=list)
    imports: List[str] = Field(default_factory=list)
    api_routes: List[str] = Field(default_factory=list)

class FrameworkInfo(BaseModel):
    language: str
    framework: Optional[str] = None
    package_manager: Optional[str] = None
    test_command: Optional[str] = None
    build_command: Optional[str] = None
    lint_command: Optional[str] = None
    typecheck_command: Optional[str] = None
    confidence: float
    evidence: List[str] = Field(default_factory=list)

class ChangeRequest(BaseModel):
    request: str
    repository_url: str

class ChangeContract(BaseModel):
    goal: str
    acceptance_criteria: List[str] = Field(default_factory=list)
    must_change: List[str] = Field(default_factory=list)
    must_preserve: List[str] = Field(default_factory=list)
    edge_cases: List[str] = Field(default_factory=list)
    validation_plan: List[str] = Field(default_factory=list)

class LocalizedFile(BaseModel):
    path: str
    score: float
    reason: str
    symbols: List[str] = Field(default_factory=list)

class PatchPlan(BaseModel):
    files_to_modify: List[str] = Field(default_factory=list)
    symbols_to_modify: List[str] = Field(default_factory=list)
    reason: str
    steps: List[str] = Field(default_factory=list)
    tests_to_run: List[str] = Field(default_factory=list)
    risk_notes: str = ""

class TestExecution(BaseModel):
    command: str
    cwd: str
    started_at: str
    duration: float
    exit_code: int
    stdout: str
    stderr: str
    timed_out: bool

class TestSummary(BaseModel):
    passed: int
    failed: int
    skipped: int
    exit_code: int
    stdout: str
    stderr: str

class BehavioralTwin(BaseModel):
    tests: TestSummary
    routes: List[str] = Field(default_factory=list)
    public_symbols: List[str] = Field(default_factory=list)
    function_signatures: List[str] = Field(default_factory=list)
    test_files: List[str] = Field(default_factory=list)

class BehavioralComparison(BaseModel):
    expected_changes: List[str] = Field(default_factory=list)
    unexpected_changes: List[str] = Field(default_factory=list)
    preserved_behavior: List[str] = Field(default_factory=list)
    unknown_comparisons: List[str] = Field(default_factory=list)

class BlindValidationCase(BaseModel):
    id: str
    name: str
    category: str
    reason: str
    expected_behavior: str
    execution_type: str

class BlindValidationPlan(BaseModel):
    cases: List[BlindValidationCase] = Field(default_factory=list)

class HallucinationCheck(BaseModel):
    status: str
    evidence: List[str] = Field(default_factory=list)

class EvidenceGateResult(BaseModel):
    status: str
    reason: str
    classification: Optional[str] = None

class RunEvent(BaseModel):
    timestamp: str
    status: RunStatus
    message: str
    data: Optional[Dict[str, Any]] = None
