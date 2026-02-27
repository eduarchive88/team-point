import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-between p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <h1 className="text-4xl font-bold mb-8">Team Point</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          <Link href="/teacher/login" className="p-8 bg-white rounded-lg shadow-lg hover:shadow-xl transition text-center">
            <h2 className="text-2xl font-semibold mb-3">교사 로그인</h2>
            <p className="text-gray-600">세션 관리 및 학생 등록</p>
          </Link>
          <Link href="/student/login" className="p-8 bg-white rounded-lg shadow-lg hover:shadow-xl transition text-center">
            <h2 className="text-2xl font-semibold mb-3">학생 로그인</h2>
            <p className="text-gray-600">투표 참여 및 결과 확인</p>
          </Link>
          <Link href="/group/login" className="p-8 bg-white rounded-lg shadow-lg hover:shadow-xl transition text-center">
            <h2 className="text-2xl font-semibold mb-3">모둠 로그인</h2>
            <p className="text-gray-600">모둠 대표 투표</p>
          </Link>
        </div>
      </div>
      <footer className="text-center text-sm text-gray-600 mt-8">
        <p>만든 사람: 경기도 지구과학 교사 뀨짱</p>
        <p className="mt-1">
          문의: <a href="https://open.kakao.com/o/s7hVU65h" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">카카오톡 오픈채팅</a>
          {" | "}
          블로그: <a href="https://eduarchive.tistory.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">뀨짱쌤의 교육자료 아카이브</a>
        </p>
      </footer>
    </main>
  )
}
