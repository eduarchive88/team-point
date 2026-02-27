'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import Footer from '@/components/Footer'

export default function GroupLogin() {
  const [sessionCode, setSessionCode] = useState('')
  const [grade, setGrade] = useState('')
  const [classNumber, setClassNumber] = useState('')
  const [studentNumber, setStudentNumber] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    if (!sessionCode || !grade || !classNumber || !studentNumber) {
      return alert('모든 필드를 입력하세요')
    }

    const { data: session } = await supabase
      .from('activity_sessions')
      .select('*')
      .eq('session_code', sessionCode.toUpperCase())
      .eq('status', 'active')
      .single()

    if (!session) {
      return alert('유효하지 않은 세션 코드입니다')
    }

    const { data: student } = await supabase
      .from('students')
      .select('*, teachers(name)')
      .eq('teacher_id', session.teacher_id)
      .eq('grade', grade)
      .eq('class_number', classNumber)
      .eq('student_number', studentNumber)
      .eq('is_group_leader', true)
      .single()

    if (!student) {
      return alert('모둠 대표로 등록되지 않은 학생입니다')
    }

    localStorage.setItem('groupLeader', JSON.stringify(student))
    localStorage.setItem('session', JSON.stringify(session))
    router.push('/group/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-4 bg-gray-50">
      <div className="flex-1 flex items-center justify-center w-full">
        <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>모둠 대표 로그인</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input 
            placeholder="세션 코드" 
            value={sessionCode} 
            onChange={e => setSessionCode(e.target.value)}
          />
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
          <Button onClick={handleLogin} className="w-full">로그인</Button>
        </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  )
}
