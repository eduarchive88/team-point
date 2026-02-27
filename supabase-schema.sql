-- 조 정보 테이블
CREATE TABLE groups (
  id SERIAL PRIMARY KEY,
  group_number INT UNIQUE NOT NULL CHECK (group_number BETWEEN 1 AND 9),
  total_points INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 활동 세션 테이블
CREATE TABLE activity_sessions (
  id SERIAL PRIMARY KEY,
  activity_name VARCHAR(255) NOT NULL,
  tokens_per_student INT NOT NULL,
  point_conversion_rate DECIMAL(10, 2) DEFAULT 1.0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP
);

-- 투표 내역 테이블
CREATE TABLE activity_votes (
  id SERIAL PRIMARY KEY,
  session_id INT REFERENCES activity_sessions(id) ON DELETE CASCADE,
  student_id VARCHAR(100) NOT NULL,
  student_group INT NOT NULL,
  target_group INT REFERENCES groups(group_number),
  allocated_tokens INT NOT NULL,
  feedback TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 1~9조 초기 데이터 삽입
INSERT INTO groups (group_number) VALUES (1), (2), (3), (4), (5), (6), (7), (8), (9);

-- 투표 완료 여부 확인용 인덱스
CREATE INDEX idx_votes_session_student ON activity_votes(session_id, student_id);
CREATE INDEX idx_votes_target_group ON activity_votes(target_group);

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE activity_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_votes;


-- 포인트 자동 증가 함수
CREATE OR REPLACE FUNCTION increment_group_points(group_num INT, points_to_add INT)
RETURNS VOID AS $$
BEGIN
  UPDATE groups 
  SET total_points = total_points + points_to_add 
  WHERE group_number = group_num;
END;
$$ LANGUAGE plpgsql;
