import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <h1 className="text-4xl font-bold mb-8">Team Point</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <Link href="/teacher/login" className="p-8 bg-white rounded-lg shadow-lg hover:shadow-xl transition text-center">
          <h2 className="text-2xl font-semibold mb-3">교사 로그인</h2>
          <p className="text-gray-600">세션 관리 및 학생 등록</p>
        </Link>
        <Link href="/student/login" className="p-8 bg-white rounded-lg shadow-lg hover:shadow-xl transition text-center">
          <h2 className="text-2xl font-semibold mb-3">학생 로그인</h2>
          <p className="text-gray-600">투표 참여 및 결과 확인</p>
        </Link>
      </div>
    </main>
  )
}
