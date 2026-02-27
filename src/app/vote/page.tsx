'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'

export default function VotePage() {
  const [session, setSession] = useState<any>(null)
  const [studentId, setStudentId] = useState('')
  const [myGroup, setMyGroup] = useState<number>(0)
  const [votes, setVotes] = useState<any>({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    loadActiveSession()
    
    const channel = supabase
      .channel('vote-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_sessions' }, loadActiveSession)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const loadActiveSession = async () => {
    const { data } = await supabase.from('activity_sessions').select('*').eq('status', 'active').single()
    setSession(data)
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
    if (!studentId || !myGroup) return alert('학생 ID와 조 번호를 입력하세요')
    if (remaining !== 0) return alert('모든 토큰을 배분해야 합니다')

    const voteData = Object.entries(votes)
      .filter(([group, data]: any) => data.tokens > 0)
      .map(([group, data]: any) => ({
        session_id: session.id,
        student_id: studentId,
        student_group: myGroup,
        target_group: parseInt(group),
        allocated_tokens: data.tokens,
        feedback: data.feedback || ''
      }))

    if (voteData.some(v => !v.feedback)) return alert('모든 팀에 피드백을 작성해주세요')

    await supabase.from('activity_votes').insert(voteData)
    setSubmitted(true)
    alert('투표가 완료되었습니다!')
  }

  if (!session) return <div className="min-h-screen flex items-center justify-center">활성 세션이 없습니다</div>
  if (submitted) return <div className="min-h-screen flex items-center justify-center">투표 완료!</div>

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">{session.activity_name}</h1>
        
        <Card className="mb-4">
          <CardContent className="pt-6">
            <Input placeholder="학생 ID" value={studentId} onChange={e => setStudentId(e.target.value)} className="mb-2" />
            <Input type="number" placeholder="내 조 번호 (1-9)" value={myGroup || ''} onChange={e => setMyGroup(Number(e.target.value))} />
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardContent className="pt-6">
            <p className="mb-2">남은 토큰: {remaining} / {session.tokens_per_student}</p>
            <Progress value={progress} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {[1,2,3,4,5,6,7,8,9].filter(g => g !== myGroup).map(group => (
            <Card key={group}>
              <CardHeader>
                <CardTitle>{group}조</CardTitle>
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
    </div>
  )
}
