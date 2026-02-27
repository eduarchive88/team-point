'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function ResultPage() {
  const [myGroup, setMyGroup] = useState<number>(0)
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [totalPoints, setTotalPoints] = useState(0)
  const [loaded, setLoaded] = useState(false)

  const loadResults = async () => {
    if (!myGroup) return alert('조 번호를 입력하세요')

    const { data: groupData } = await supabase.from('groups').select('total_points').eq('group_number', myGroup).single()
    setTotalPoints(groupData?.total_points || 0)

    const { data: votesData } = await supabase
      .from('activity_votes')
      .select('feedback, allocated_tokens, activity_sessions(activity_name)')
      .eq('target_group', myGroup)

    setFeedbacks(votesData || [])
    setLoaded(true)
  }

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">결과 확인</h1>
        
        {!loaded ? (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Input 
                type="number" 
                placeholder="우리 조 번호 (1-9)" 
                value={myGroup || ''} 
                onChange={e => setMyGroup(Number(e.target.value))} 
              />
              <Button onClick={loadResults}>결과 보기</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>누적 포인트</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-blue-600">{totalPoints} P</p>
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
          </>
        )}
      </div>
    </div>
  )
}
