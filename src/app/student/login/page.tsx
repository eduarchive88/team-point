'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Footer from '@/components/Footer'

export default function StudentLogin() {
  const [studentNumber, setStudentNumber] = useState('')
  const [sessionCode, setSessionCode] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    if (!studentNumber || !sessionCode) return alert('학번과 세션 코드를 입력하세요')
    
    // 학번 파싱 (20101 -> 2학년 1반 1번)
    if (studentNumber.length !== 5) return alert('학번은 5자리여야 합니다 (예: 20101)')
    
    const grade = studentNumber[0]
    const classNumber = studentNumber.substring(1, 3)
    const number = studentNumber.substring(3, 5)
    
    // 세션 확인
    const { data: session } = await supabase
      .from('activity_sessions')
      .select('*')
      .eq('session_code', sessionCode)
      .eq('status', 'active')
      .single()
    
    if (!session) return alert('유효하지 않은 세션 코드입니다')
    
    // 학생 확인
    const { data: student } = await supabase
      .from('students')
      .select('*, teachers(name)')
      .eq('teacher_id', session.teacher_id)
      .eq('grade', grade)
      .eq('class_number', classNumber)
      .eq('student_number', number)
      .single()

    if (!student) return alert('등록되지 않은 학생입니다')
    
    localStorage.setItem('student', JSON.stringify(student))
    localStorage.setItem('session', JSON.stringify(session))
    router.push('/student/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-4 bg-gray-50">
      <div className="flex-1 flex items-center justify-center w-full">
        <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>학생 로그인</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input 
            placeholder="학번 (5자리, 예: 20101)" 
            value={studentNumber} 
            onChange={e => setStudentNumber(e.target.value)}
          />
          <Input 
            placeholder="세션 코드" 
            value={sessionCode} 
            onChange={e => setSessionCode(e.target.value.toUpperCase())}
            onKeyPress={e => e.key === 'Enter' && handleLogin()}
          />
          <Button onClick={handleLogin} className="w-full">
            로그인
          </Button>
          <Link href="/" className="block text-center text-sm text-gray-500 hover:underline">
            홈으로 돌아가기
          </Link>
        </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  )
}