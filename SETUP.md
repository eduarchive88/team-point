# Team Point 설치 및 실행 가이드

## 1단계: 의존성 설치

터미널에서 team-point 폴더로 이동 후 실행:

```bash
cd team-point
npm install
```

## 2단계: Supabase 설정

1. https://supabase.com 에서 새 프로젝트 생성
2. SQL Editor에서 `supabase-schema.sql` 파일 내용 전체 실행
3. Settings > API에서 다음 정보 복사:
   - Project URL
   - anon public key

## 3단계: 환경 변수 설정

`.env.local` 파일 생성:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 4단계: 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 사용 방법

### 교사
1. `/admin` 페이지 접속
2. 활동명, 투표권, 변환율 입력 후 세션 시작
3. 실시간으로 학생들의 투표 현황 확인
4. 활동 종료 후 "세션 종료" 버튼 클릭 → 자동 포인트 정산

### 학생
1. `/vote` 페이지 접속
2. 학생 ID와 조 번호 입력
3. 타 팀들에게 토큰 배분 및 피드백 작성
4. 모든 토큰 배분 완료 후 제출

### 결과 확인
1. `/result` 페이지 접속
2. 조 번호 입력
3. 받은 포인트와 익명 피드백 확인
