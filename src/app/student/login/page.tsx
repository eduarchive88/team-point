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
  const [grade, setGrade] = useState('')
  const [classNumber, setClassNumber] = useState('')
  const [studentNumber, setStudentNumber] = useState('')
  const [sessionCode, setSessionCode] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    if (!grade || !classNumber || !studentNumber || !sessionCode) {
      return alert('모든 필드를 입력하세요')
    }
    
    // 세션 확인
    const { data: session, error: sessionError } = await supabase
      .from('activity_sessions')
      .select('*')
      .eq('session_code', sessionCode.toUpperCase())
      .eq('status', 'active')
      .single()
    
    if (sessionError || !session) {
      console.log('Session error:', sessionError)
      return alert('유효하지 않은 세션 코드입니다')
    }
    
    // 학생 확인
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*, teachers(name)')
      .eq('teacher_id', session.teacher_id)
      .eq('grade', grade)
      .eq('class_number', classNumber)
      .eq('student_number', studentNumber)
      .single()

    if (studentError || !student) {
      console.log('Student error:', studentError)
      console.log('Looking for:', { teacher_id: session.teacher_id, grade, classNumber, studentNumber })
      return alert(`등록되지 않은 학생입니다. (학년: ${grade}, 반: ${classNumber}, 번호: ${studentNumber})`)
    }
    
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
          <div className="grid grid-cols-3 gap-2">
            <Input 
              placeholder="학년" 
              value={grade} 
              onChange={e => setGrade(e.target.value)}
            />
            <Input 
              placeholder="반" 
              value={classNumber} 
              onChange={e => setClassNumber(e.target.value)}
            />
            <Input 
              placeholder="번호" 
              value={studentNumber} 
              onChange={e => setStudentNumber(e.target.value)}
            />
          </div>
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