'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function TeacherLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [name, setName] = useState('')
  const router = useRouter()

  const handleAuth = async () => {
    if (isSignup) {
      if (!email || !password || !name) return alert('모든 필드를 입력하세요')
      
      const { data, error } = await supabase
        .from('teachers')
        .insert({ email, password, name })
        .select()
        .single()

      if (error) return alert('회원가입 실패: ' + error.message)
      
      localStorage.setItem('teacher', JSON.stringify(data))
      router.push('/teacher/dashboard')
    } else {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single()

      if (error || !data) return alert('로그인 실패')
      
      localStorage.setItem('teacher', JSON.stringify(data))
      router.push('/teacher/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isSignup ? '교사 회원가입' : '교사 로그인'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} />
          <Input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} />
          {isSignup && <Input placeholder="이름" value={name} onChange={e => setName(e.target.value)} />}
          <Button onClick={handleAuth} className="w-full">
            {isSignup ? '회원가입' : '로그인'}
          </Button>
          <Button variant="outline" onClick={() => setIsSignup(!isSignup)} className="w-full">
            {isSignup ? '로그인으로 전환' : '회원가입으로 전환'}
          </Button>
          <Link href="/" className="block text-center text-sm text-gray-500 hover:underline">
            홈으로 돌아가기
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}