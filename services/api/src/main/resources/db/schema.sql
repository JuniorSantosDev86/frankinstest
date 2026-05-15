CREATE TABLE IF NOT EXISTS ai_runs (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    project_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    feature VARCHAR(100) NOT NULL,
    input_context TEXT,
    estimated_credits BIGINT,
    consumed_credits BIGINT DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    output_artifact_type VARCHAR(50),
    output_artifact_id VARCHAR(36),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS credit_transactions (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    type VARCHAR(50) NOT NULL,
    amount BIGINT NOT NULL,
    reason VARCHAR(200),
    ai_run_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
