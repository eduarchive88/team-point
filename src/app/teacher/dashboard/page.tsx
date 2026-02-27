'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'

export default function TeacherDashboard() {
  const [teacher, setTeacher] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [studentNumber, setStudentNumber] = useState('')
  const [studentName, setStudentName] = useState('')
  const [groupNumber, setGroupNumber] = useState(1)
  const [activityName, setActivityName] = useState('')
  const [tokensPerStudent, setTokensPerStudent] = useState(1000)
  const [totalGroups, setTotalGroups] = useState(6)
  const router = useRouter()

  useEffect(() => {
    const teacherData = localStorage.getItem('teacher')
    if (!teacherData) return router.push('/teacher/login')
    
    const t = JSON.parse(teacherData)
    setTeacher(t)
    loadStudents(t.id)
    loadSessions(t.id)
  }, [])

  const loadStudents = async (teacherId: number) => {
    const { data } = await supabase.from('students').select('*').eq('teacher_id', teacherId)
    setStudents(data || [])
  }

  const loadSessions = async (teacherId: number) => {
    const { data } = await supabase.from('activity_sessions').select('*').eq('teacher_id', teacherId).order('created_at', { ascending: false })
    setSessions(data || [])
  }

  const addStudent = async () => {
    if (!studentNumber || !studentName) return alert('학번과 이름을 입력하세요')
    
    await supabase.from('students').insert({
      teacher_id: teacher.id,
      student_number: studentNumber,
      name: studentName,
      group_number: groupNumber
    })
    
    setStudentNumber('')
    setStudentName('')
    loadStudents(teacher.id)
  }

  const createSession = async () => {
    if (!activityName) return alert('활동명을 입력하세요')
    
    await supabase.from('activity_sessions').insert({
      teacher_id: teacher.id,
      activity_name: activityName,
      tokens_per_student: tokensPerStudent,
      total_groups: totalGroups,
      status: 'active'
    })
    
    setActivityName('')
    loadSessions(teacher.id)
  }

  const closeSession = async (sessionId: number) => {
    const { data: votes } = await supabase
      .from('activity_votes')
      .select('student_id, allocated_tokens')
      .eq('session_id', sessionId)

    const session = sessions.find(s => s.id === sessionId)
    if (!session) return

    const studentPoints: any = {}
    votes?.forEach(v => {
      studentPoints[v.student_id] = (studentPoints[v.student_id] || 0) + v.allocated_tokens
    })

    for (const [studentId, tokens] of Object.entries(studentPoints)) {
      const points = Math.round((tokens as number) * session.point_conversion_rate)
      await supabase.rpc('increment_student_points', { 
        student_id_param: parseInt(studentId), 
        points_to_add: points 
      })
    }

    await supabase.from('activity_sessions').update({ status: 'closed' }).eq('id', sessionId)
    loadSessions(teacher.id)
  }

  if (!teacher) return <div>로딩중...</div>

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{teacher.name} 선생님 대시보드</h1>
          <Button onClick={() => { localStorage.removeItem('teacher'); router.push('/') }}>
            로그아웃
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>학생 등록</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="학번" value={studentNumber} onChange={e => setStudentNumber(e.target.value)} />
              <Input placeholder="이름" value={studentName} onChange={e => setStudentName(e.target.value)} />
              <Input type="number" placeholder="모둠 번호" value={groupNumber} onChange={e => setGroupNumber(Number(e.target.value))} />
              <Button onClick={addStudent}>학생 추가</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>새 활동 세션</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="활동명" value={activityName} onChange={e => setActivityName(e.target.value)} />
              <Input type="number" placeholder="1인당 토큰" value={tokensPerStudent} onChange={e => setTokensPerStudent(Number(e.target.value))} />
              <Input type="number" placeholder="총 모둠 수" value={totalGroups} onChange={e => setTotalGroups(Number(e.target.value))} />
              <Button onClick={createSession}>세션 시작</Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>등록된 학생 ({students.length}명)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {students.map(s => (
                <div key={s.id} className="p-2 bg-gray-100 rounded">
                  {s.student_number} - {s.name} ({s.group_number}모둠) - {s.total_points}P
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {sessions.filter(s => s.status === 'active').map(session => (
          <Card key={session.id} className="mt-6">
            <CardHeader>
              <CardTitle>활성 세션: {session.activity_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">토큰: {session.tokens_per_student} | 모둠 수: {session.total_groups}</p>
              <Button onClick={() => closeSession(session.id)} className="bg-red-600">
                세션 종료
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}