CREATE TABLE IF NOT EXISTS ai_runs (
    id VARCHAR(120) PRIMARY KEY,
    organization_id VARCHAR(120) NOT NULL,
    project_id VARCHAR(120) NOT NULL,
    user_id VARCHAR(120) NOT NULL,
    feature VARCHAR(100) NOT NULL,
    source_artifact_type VARCHAR(50),
    source_artifact_id VARCHAR(120),
    input_summary TEXT,
    estimated_credits BIGINT NOT NULL DEFAULT 0,
    reserved_credits BIGINT NOT NULL DEFAULT 0,
    consumed_credits BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'estimated',
    failure_category VARCHAR(50) NOT NULL DEFAULT 'none',
    output_artifact_type VARCHAR(50),
    output_artifact_ids TEXT,
    raw_output TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

ALTER TABLE ai_runs ADD COLUMN IF NOT EXISTS raw_output TEXT;

CREATE TABLE IF NOT EXISTS credit_transactions (
    id VARCHAR(120) PRIMARY KEY,
    organization_id VARCHAR(120) NOT NULL,
    user_id VARCHAR(120),
    ai_run_id VARCHAR(120),
    type VARCHAR(50) NOT NULL,
    amount BIGINT NOT NULL,
    reason VARCHAR(500),
    balance_after BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS credit_balances (
    organization_id VARCHAR(120) PRIMARY KEY,
    available_credits BIGINT NOT NULL DEFAULT 0,
    reserved_credits BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_scenarios (
    id VARCHAR(120) PRIMARY KEY,
    organization_id VARCHAR(120) NOT NULL,
    project_id VARCHAR(120) NOT NULL,
    module_id VARCHAR(120),
    requirement_id VARCHAR(120),
    business_rule_id VARCHAR(120),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    scenario_type VARCHAR(50),
    priority VARCHAR(20),
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    ai_assisted BOOLEAN NOT NULL DEFAULT FALSE,
    ai_run_id VARCHAR(120),
    reviewed_by VARCHAR(120),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_cases (
    id VARCHAR(120) PRIMARY KEY,
    organization_id VARCHAR(120) NOT NULL,
    project_id VARCHAR(120) NOT NULL,
    module_id VARCHAR(120),
    requirement_id VARCHAR(120),
    business_rule_id VARCHAR(120),
    scenario_id VARCHAR(120),
    title VARCHAR(500) NOT NULL,
    preconditions TEXT,
    steps TEXT,
    expected_result TEXT,
    test_type VARCHAR(50),
    priority VARCHAR(20),
    automation_candidate BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    ai_assisted BOOLEAN NOT NULL DEFAULT FALSE,
    ai_run_id VARCHAR(120),
    reviewed_by VARCHAR(120),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS checkup_reports (
    id VARCHAR(120) PRIMARY KEY,
    ai_run_id VARCHAR(120) NOT NULL,
    organization_id VARCHAR(120) NOT NULL,
    user_id VARCHAR(120) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    target_type VARCHAR(50) NOT NULL,
    target_value TEXT NOT NULL,
    context TEXT NOT NULL,
    goal TEXT NOT NULL,
    depth VARCHAR(20) NOT NULL,
    quality_risks TEXT NOT NULL DEFAULT '[]',
    missing_or_unclear_requirements TEXT NOT NULL DEFAULT '[]',
    suggested_test_scenarios TEXT NOT NULL DEFAULT '[]',
    suggested_test_cases TEXT NOT NULL DEFAULT '[]',
    ux_product_risks TEXT NOT NULL DEFAULT '[]',
    release_readiness_notes TEXT NOT NULL DEFAULT '[]',
    recommended_next_actions TEXT NOT NULL DEFAULT '[]',
    raw_ai_output TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_checkup_reports_org ON checkup_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_checkup_reports_ai_run ON checkup_reports(ai_run_id);

CREATE TABLE IF NOT EXISTS audit_log (
    id VARCHAR(120) PRIMARY KEY,
    organization_id VARCHAR(120) NOT NULL,
    user_id VARCHAR(120),
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(120),
    metadata TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
