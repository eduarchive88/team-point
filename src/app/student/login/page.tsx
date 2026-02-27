'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function StudentLogin() {
  const [studentNumber, setStudentNumber] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    if (!studentNumber) return alert('학번을 입력하세요')
    
    const { data, error } = await supabase
      .from('students')
      .select('*, teachers(name)')
      .eq('student_number', studentNumber)
      .single()

    if (error || !data) return alert('등록되지 않은 학번입니다')
    
    localStorage.setItem('student', JSON.stringify(data))
    router.push('/student/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>학생 로그인</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input 
            placeholder="학번" 
            value={studentNumber} 
            onChange={e => setStudentNumber(e.target.value)}
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
  )
}