import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <h1 className="text-4xl font-bold mb-8">Team Point</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
        <Link href="/admin" className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition">
          <h2 className="text-xl font-semibold mb-2">교사 관리</h2>
          <p className="text-gray-600">활동 세션 관리 및 모니터링</p>
        </Link>
        <Link href="/vote" className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition">
          <h2 className="text-xl font-semibold mb-2">투표하기</h2>
          <p className="text-gray-600">팀 평가 및 포인트 배분</p>
        </Link>
        <Link href="/result" className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition">
          <h2 className="text-xl font-semibold mb-2">결과 확인</h2>
          <p className="text-gray-600">받은 피드백 및 포인트</p>
        </Link>
      </div>
    </main>
  )
}
