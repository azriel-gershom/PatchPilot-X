export interface RunItem {
  run_id: string;
  status: string;
  repository_url?: string;
  task?: string;
  created_at?: string;
  has_patch?: boolean;
  validation_passed?: boolean | null;
  mtime?: number;
}

export interface ContractData {
  goal?: string;
  acceptance_criteria?: string[];
  must_change?: string[];
  must_preserve?: string[];
  edge_cases?: string[];
  validation_plan?: string[];
}

export interface FrameworkData {
  language?: string;
  framework?: string | null;
  package_manager?: string | null;
  test_command?: string | null;
  build_command?: string | null;
  confidence?: number;
  evidence?: string[];
}

export interface ValidationData {
  passed: boolean;
  reason: string;
  regressions: string[];
}

export interface HallucinationData {
  status: string;
  evidence: string[];
}

export interface TestSummaryData {
  passed: number;
  failed: number;
  skipped: number;
  exit_code: number;
  stdout: string;
  stderr: string;
}

export interface RepoMapData {
  languages?: string[];
  source_files?: string[];
  test_files?: string[];
  config_files?: string[];
  functions?: string[];
  classes?: string[];
  imports?: string[];
  api_routes?: string[];
  file_tree?: any;
}

export interface RunDetail {
  status: {
    run_id: string;
    status: string;
    repository_url?: string;
    created_at?: string;
    updated_at?: string;
  };
  framework?: FrameworkData | null;
  validation?: ValidationData | null;
  contract?: ContractData | null;
  repo_map?: RepoMapData | null;
  explanation?: string | null;
  has_patch?: boolean;
}

export interface RunEvent {
  type: string;
  name: string;
  timestamp: string;
  data?: any;
}

export interface RunEvidence {
  baseline?: TestSummaryData | null;
  targeted?: TestSummaryData | null;
  regression?: TestSummaryData | null;
  validation?: ValidationData | null;
  hallucination?: HallucinationData | null;
}
