'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { useRouter } from 'next/navigation'

export default function StudentDashboard() {
  const [student, setStudent] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [votes, setVotes] = useState<any>({})
  const [submitted, setSubmitted] = useState(false)
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const studentData = localStorage.getItem('student')
    if (!studentData) return router.push('/student/login')
    
    const s = JSON.parse(studentData)
    setStudent(s)
    loadActiveSession(s.teacher_id)
    loadFeedbacks(s.id)
  }, [])

  const loadActiveSession = async (teacherId: number) => {
    const { data } = await supabase
      .from('activity_sessions')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('status', 'active')
      .single()
    setSession(data)
  }

  const loadFeedbacks = async (studentId: number) => {
    const { data } = await supabase
      .from('activity_votes')
      .select('feedback, allocated_tokens, activity_sessions(activity_name)')
      .eq('student_id', studentId)
    setFeedbacks(data || [])
  }

  const updateVote = (group: number, field: 'tokens' | 'feedback', value: any) => {
    setVotes((prev: any) => ({
      ...prev,
      [group]: { ...prev[group], [field]: value }
    }))
  }

  const totalAllocated = Object.values(votes).reduce((sum: number, v: any) => sum + (v?.tokens || 0), 0)
  const remaining = (session?.tokens_per_student || 0) - totalAllocated
  const progress = (totalAllocated / (session?.tokens_per_student || 1)) * 100

  const submitVotes = async () => {
    if (remaining !== 0) return alert('모든 토큰을 배분해야 합니다')

    const voteData = Object.entries(votes)
      .filter(([group, data]: any) => data.tokens > 0)
      .map(([group, data]: any) => ({
        session_id: session.id,
        student_id: student.id,
        target_group: parseInt(group),
        allocated_tokens: data.tokens,
        feedback: data.feedback || ''
      }))

    if (voteData.some(v => !v.feedback)) return alert('모든 모둠에 피드백을 작성해주세요')

    await supabase.from('activity_votes').insert(voteData)
    setSubmitted(true)
    alert('투표가 완료되었습니다!')
  }

  if (!student) return <div>로딩중...</div>

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">{student.name} ({student.group_number}모둠)</h1>
            <p className="text-gray-600">{student.teachers?.name} 선생님 클래스</p>
          </div>
          <div className="space-x-2">
            <button 
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              onClick={() => setShowResults(!showResults)}
            >
              {showResults ? '투표하기' : '내 결과'}
            </button>
            <Button onClick={() => { localStorage.removeItem('student'); router.push('/') }}>
              로그아웃
            </Button>
          </div>
        </div>

        {showResults ? (
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>누적 포인트</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-blue-600">{student.total_points} P</p>
              </CardContent>
            </Card>

            <h2 className="text-xl font-bold mb-4">받은 피드백</h2>
            <div className="space-y-4">
              {feedbacks.map((fb, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-500 mb-2">익명의 응원</p>
                    <p className="mb-2">{fb.feedback}</p>
                    <p className="text-sm text-blue-600">+{fb.allocated_tokens} 토큰</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {!session ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p>현재 활성화된 투표 세션이 없습니다.</p>
                </CardContent>
              </Card>
            ) : submitted ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-2xl font-bold text-green-600">투표 완료!</p>
                </CardContent>
              </Card>
            ) : (
              <div>
                <h2 className="text-xl font-bold mb-4">{session.activity_name}</h2>
                
                <Card className="mb-4">
                  <CardContent className="pt-6">
                    <p className="mb-2">남은 토큰: {remaining} / {session.tokens_per_student}</p>
                    <Progress value={progress} />
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {Array.from({length: session.total_groups}, (_, i) => i + 1)
                    .filter(g => g !== student.group_number)
                    .map(group => (
                    <Card key={group}>
                      <CardHeader>
                        <CardTitle>{group}모둠</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Input 
                          type="number" 
                          placeholder="토큰" 
                          value={votes[group]?.tokens || ''} 
                          onChange={e => updateVote(group, 'tokens', Number(e.target.value))} 
                        />
                        <Input 
                          placeholder="피드백 (필수)" 
                          value={votes[group]?.feedback || ''} 
                          onChange={e => updateVote(group, 'feedback', e.target.value)} 
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Button onClick={submitVotes} className="w-full mt-4" disabled={remaining !== 0}>
                  제출하기
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}