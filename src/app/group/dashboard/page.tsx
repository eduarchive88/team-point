'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { useRouter } from 'next/navigation'
import Footer from '@/components/Footer'

export default function GroupDashboard() {
  const [leader, setLeader] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [votes, setVotes] = useState<any>({})
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const leaderData = localStorage.getItem('groupLeader')
    const sessionData = localStorage.getItem('session')
    if (!leaderData || !sessionData) return router.push('/group/login')
    
    setLeader(JSON.parse(leaderData))
    setSession(JSON.parse(sessionData))
  }, [])

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
        student_id: leader.id,
        target_group: parseInt(group),
        allocated_tokens: data.tokens,
        feedback: data.feedback || ''
      }))

    if (voteData.some(v => !v.feedback)) return alert('모든 모둠에 피드백을 작성해주세요')

    await supabase.from('activity_votes').insert(voteData)
    setSubmitted(true)
    alert('투표가 완료되었습니다!')
  }

  if (!leader || !session) return <div>로딩중...</div>

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">{leader.group_number}모둠 대표: {leader.name}</h1>
            <p className="text-gray-600">{session.activity_name}</p>
          </div>
          <Button onClick={() => { localStorage.removeItem('groupLeader'); router.push('/') }}>
            로그아웃
          </Button>
        </div>

        {submitted ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-green-600">투표 완료!</p>
            </CardContent>
          </Card>
        ) : (
          <div>
            <Card className="mb-4">
              <CardContent className="pt-6">
                <p className="mb-2">남은 토큰: {remaining} / {session.tokens_per_student}</p>
                <Progress value={progress} />
              </CardContent>
            </Card>

            <div className="space-y-4">
              {Array.from({length: session.total_groups}, (_, i) => i + 1)
                .filter(g => g !== leader.group_number)
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
      </div>
      <Footer />
    </div>
  )
}
