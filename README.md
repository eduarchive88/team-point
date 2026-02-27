# Team Point - 수업 특별 프로그램 전용 앱

## 설치 방법

1. 의존성 설치:
```bash
npm install
```

2. 환경 변수 설정:
`.env.example`을 `.env.local`로 복사하고 Supabase 정보를 입력하세요.

3. Supabase 설정:
- Supabase 프로젝트 생성
- `supabase-schema.sql` 파일의 내용을 SQL Editor에서 실행
- Realtime 기능 활성화

4. 개발 서버 실행:
```bash
npm run dev
```

## 주요 기능

### 교사 관리 (/admin)
- 활동 세션 생성 및 관리
- 실시간 투표 현황 모니터링
- 세션 종료 및 포인트 정산

### 학생 투표 (/vote)
- 타 팀에게 포인트 배분
- 실시간 남은 토큰 확인
- 피드백 작성 (필수)

### 결과 확인 (/result)
- 받은 포인트 확인
- 익명 피드백 조회

## 기술 스택
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Database + Realtime)
- shadcn/ui
