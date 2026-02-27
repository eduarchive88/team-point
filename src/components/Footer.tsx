export default function Footer() {
  return (
    <footer className="text-center text-sm text-gray-600 py-4 mt-8 border-t">
      <p>만든 사람: 경기도 지구과학 교사 뀨짱</p>
      <p className="mt-1">
        문의: <a href="https://open.kakao.com/o/s7hVU65h" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">카카오톡 오픈채팅</a>
        {" | "}
        블로그: <a href="https://eduarchive.tistory.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">뀨짱쌤의 교육자료 아카이브</a>
      </p>
    </footer>
  )
}
