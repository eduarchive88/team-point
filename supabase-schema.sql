-- 교사 테이블
CREATE TABLE teachers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 학생 테이블
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  teacher_id INT REFERENCES teachers(id) ON DELETE CASCADE,
  grade VARCHAR(10) NOT NULL,
  class_number VARCHAR(10) NOT NULL,
  student_number VARCHAR(10) NOT NULL,
  name VARCHAR(100) NOT NULL,
  group_number INT NOT NULL,
  is_group_leader BOOLEAN DEFAULT FALSE,
  total_points INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(teacher_id, grade, class_number, student_number)
);

-- 활동 세션 테이블
CREATE TABLE activity_sessions (
  id SERIAL PRIMARY KEY,
  teacher_id INT REFERENCES teachers(id) ON DELETE CASCADE,
  activity_name VARCHAR(255) NOT NULL,
  session_code VARCHAR(6) UNIQUE NOT NULL,
  tokens_per_student INT NOT NULL,
  point_conversion_rate DECIMAL(10, 2) DEFAULT 1.0,
  total_groups INT NOT NULL DEFAULT 6,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP
);

-- 투표 내역 테이블
CREATE TABLE activity_votes (
  id SERIAL PRIMARY KEY,
  session_id INT REFERENCES activity_sessions(id) ON DELETE CASCADE,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  target_group INT NOT NULL,
  allocated_tokens INT NOT NULL,
  feedback TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_students_teacher ON students(teacher_id);
CREATE INDEX idx_sessions_teacher ON activity_sessions(teacher_id);
CREATE INDEX idx_votes_session ON activity_votes(session_id);
CREATE INDEX idx_votes_student ON activity_votes(student_id);

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE teachers;
ALTER PUBLICATION supabase_realtime ADD TABLE students;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_votes;

-- 포인트 증가 함수
CREATE OR REPLACE FUNCTION increment_student_points(student_id_param INT, points_to_add INT)
RETURNS VOID AS $$
BEGIN
  UPDATE students 
  SET total_points = total_points + points_to_add 
  WHERE id = student_id_param;
END;
$$ LANGUAGE plpgsql;
