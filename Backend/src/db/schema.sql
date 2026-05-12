CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL CHECK(role IN ('student', 'teacher', 'professional')),
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  concept VARCHAR(255) NOT NULL,
  input_type VARCHAR(50) NOT NULL CHECK(input_type IN ('document', 'generic', 'code')),
  file_path TEXT,
  github_url TEXT,
  document_context LONGTEXT,
  confidence_declared INT NOT NULL DEFAULT 50,
  duration_minutes INT NOT NULL DEFAULT 15,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'abandoned')),
  integrity_score DOUBLE DEFAULT 50,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(36) PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK(role IN ('user', 'assistant')),
  content LONGTEXT NOT NULL,
  confidence_bet INT,
  is_paste_detected TINYINT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_session FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS concept_scores (
  id VARCHAR(36) PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  concept_name VARCHAR(255) NOT NULL,
  score DOUBLE NOT NULL,
  status VARCHAR(50) NOT NULL CHECK(status IN ('solid', 'partial', 'gap', 'unknown')),
  evaluated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_concept_score CHECK (score BETWEEN 0 AND 100),
  CONSTRAINT fk_concept_scores_session FOREIGN KEY (session_id) REFERENCES sessions(id),
  CONSTRAINT fk_concept_scores_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS evaluations (
  id VARCHAR(36) PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  concept VARCHAR(255) NOT NULL,
  integrity_score DOUBLE NOT NULL,
  confidence_declared INT NOT NULL,
  calibration_gap DOUBLE NOT NULL,
  solid_concepts JSON NOT NULL,
  partial_concepts JSON NOT NULL,
  gap_concepts JSON NOT NULL,
  recommendations JSON NOT NULL,
  duration_seconds INT,
  rounds_count INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_evaluations_session FOREIGN KEY (session_id) REFERENCES sessions(id),
  CONSTRAINT fk_evaluations_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  activity_date DATE NOT NULL UNIQUE,
  sessions_count INT DEFAULT 0,
  total_duration_seconds INT DEFAULT 0,
  CONSTRAINT fk_activity_logs_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS classes (
  id VARCHAR(36) PRIMARY KEY,
  teacher_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_classes_teacher FOREIGN KEY (teacher_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS class_members (
  class_id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (class_id, student_id),
  CONSTRAINT fk_class_members_class FOREIGN KEY (class_id) REFERENCES classes(id),
  CONSTRAINT fk_class_members_student FOREIGN KEY (student_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_concept_scores_user ON concept_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_user ON evaluations(user_id);
