'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function AdminPage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [activityName, setActivityName] = useState('')
  const [tokensPerStudent, setTokensPerStudent] = useState(1000)
  const [conversionRate, setConversionRate] = useState(1.0)
  const [voteStats, setVoteStats] = useState<any>({})

  useEffect(() => {
    loadSessions()
    
    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_sessions' }, loadSessions)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_votes' }, loadVoteStats)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const loadSessions = async () => {
    const { data } = await supabase.from('activity_sessions').select('*').order('created_at', { ascending: false })
    setSessions(data || [])
    if (data?.[0]) loadVoteStats()
  }

  const loadVoteStats = async () => {
    const activeSessions = sessions.filter(s => s.status === 'active')
    if (!activeSessions.length) return

    const { data } = await supabase
      .from('activity_votes')
      .select('target_group, allocated_tokens, student_id')
      .eq('session_id', activeSessions[0].id)

    const stats: any = {}
    for (let i = 1; i <= 9; i++) {
      const groupVotes = data?.filter(v => v.target_group === i) || []
      stats[i] = {
        total: groupVotes.reduce((sum, v) => sum + v.allocated_tokens, 0),
        count: groupVotes.length
      }
    }
    
    const uniqueVoters = new Set(data?.map(v => v.student_id) || [])
    stats.completedVoters = uniqueVoters.size

    setVoteStats(stats)
  }

  const createSession = async () => {
    if (!activityName) return alert('활동명을 입력하세요')
    
    await supabase.from('activity_sessions').insert({
      activity_name: activityName,
      tokens_per_student: tokensPerStudent,
      point_conversion_rate: conversionRate,
      status: 'active'
    })
    
    setActivityName('')
    loadSessions()
  }

  const closeSession = async (id: number) => {
    const { data: votes } = await supabase
      .from('activity_votes')
      .select('target_group, allocated_tokens')
      .eq('session_id', id)

    const session = sessions.find(s => s.id === id)
    if (!session) return

    const groupPoints: any = {}
    votes?.forEach(v => {
      groupPoints[v.target_group] = (groupPoints[v.target_group] || 0) + v.allocated_tokens
    })

    for (const [groupNum, tokens] of Object.entries(groupPoints)) {
      const points = Math.round((tokens as number) * session.point_conversion_rate)
      await supabase.rpc('increment_group_points', { 
        group_num: parseInt(groupNum), 
        points_to_add: points 
      })
    }

    await supabase.from('activity_sessions').update({ status: 'closed', closed_at: new Date().toISOString() }).eq('id', id)
    loadSessions()
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-8">교사 관리 대시보드</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>새 활동 세션 생성</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="활동명" value={activityName} onChange={e => setActivityName(e.target.value)} />
          <Input type="number" placeholder="1인당 투표권" value={tokensPerStudent} onChange={e => setTokensPerStudent(Number(e.target.value))} />
          <Input type="number" step="0.1" placeholder="포인트 변환율" value={conversionRate} onChange={e => setConversionRate(Number(e.target.value))} />
          <Button onClick={createSession}>세션 시작</Button>
        </CardContent>
      </Card>

      {sessions.filter(s => s.status === 'active').map(session => (
        <Card key={session.id} className="mb-4">
          <CardHeader>
            <CardTitle>{session.activity_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">투표 완료: {voteStats.completedVoters || 0}명</p>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[1,2,3,4,5,6,7,8,9].map(i => (
                <div key={i} className="p-4 bg-blue-50 rounded">
                  <p className="font-bold">{i}조</p>
                  <p>{voteStats[i]?.total || 0} 토큰</p>
                </div>
              ))}
            </div>
            <Button onClick={() => closeSession(session.id)} className="bg-red-600">세션 종료</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
