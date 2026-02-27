-- 기존 데이터베이스에 is_group_leader 컬럼 추가
ALTER TABLE students ADD COLUMN IF NOT EXISTS is_group_leader BOOLEAN DEFAULT FALSE;

-- 세션 정렬을 위한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_sessions_status ON activity_sessions(status, created_at DESC);
