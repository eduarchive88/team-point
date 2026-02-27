'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { generateSampleExcel, parseExcelFile } from '@/lib/excel'
import Footer from '@/components/Footer'

export default function TeacherDashboard() {
  const [teacher, setTeacher] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [grade, setGrade] = useState('')
  const [classNumber, setClassNumber] = useState('')
  const [studentNumber, setStudentNumber] = useState('')
  const [studentName, setStudentName] = useState('')
  const [groupNumber, setGroupNumber] = useState('')
  const [activityName, setActivityName] = useState('')
  const [tokensPerStudent, setTokensPerStudent] = useState('')
  const [totalGroups, setTotalGroups] = useState('')
  const [sessionCode, setSessionCode] = useState('')
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null)
  const [newSessionCode, setNewSessionCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [sessionResults, setSessionResults] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    const teacherData = localStorage.getItem('teacher')
    if (!teacherData) return router.push('/teacher/login')
    
    const t = JSON.parse(teacherData)
    setTeacher(t)
    if (t && t.id) {
      loadStudents(t.id)
      loadSessions(t.id)
    }
  }, [])

  const loadStudents = async (teacherId: number) => {
    const { data } = await supabase.from('students').select('*').eq('teacher_id', teacherId)
    setStudents(data || [])
  }

  const loadSessions = async (teacherId: number) => {
    const { data } = await supabase.from('activity_sessions').select('*').eq('teacher_id', teacherId).order('status', { ascending: true }).order('created_at', { ascending: false })
    setSessions(data || [])
  }

  const addStudent = async () => {
    if (!grade || !classNumber || !studentNumber || !studentName || !groupNumber) {
      return alert('모든 필드를 입력하세요')
    }
    
    const { error } = await supabase.from('students').insert({
      teacher_id: teacher.id,
      grade,
      class_number: classNumber,
      student_number: studentNumber,
      name: studentName,
      group_number: parseInt(groupNumber)
    })
    
    if (error) {
      alert('등록 중 오류가 발생했습니다: ' + error.message)
      return
    }
    
    setGrade('')
    setClassNumber('')
    setStudentNumber('')
    setStudentName('')
    setGroupNumber('')
    loadStudents(teacher.id)
  }

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const students = await parseExcelFile(file)
      
      const { error } = await supabase.from('students').insert(
        students.map(student => ({
          teacher_id: teacher.id,
          grade: student.grade,
          class_number: student.class_number,
          student_number: student.student_number,
          name: student.name,
          group_number: student.group_number
        }))
      )
      
      if (error) {
        alert('등록 중 오류가 발생했습니다: ' + error.message)
        return
      }
      
      alert(`${students.length}명의 학생이 등록되었습니다`)
      loadStudents(teacher.id)
    } catch (error) {
      alert('엑셀 파일 처리 중 오류가 발생했습니다')
    }
  }

  const updateStudentGroup = async (studentId: number, newGroup: number) => {
    await supabase.from('students').update({ group_number: newGroup }).eq('id', studentId)
    loadStudents(teacher.id)
  }

  const toggleGroupLeader = async (studentId: number, currentStatus: boolean) => {
    await supabase.from('students').update({ is_group_leader: !currentStatus }).eq('id', studentId)
    loadStudents(teacher.id)
  }

  const createSession = async () => {
    if (!activityName || !tokensPerStudent || !totalGroups) {
      return alert('모든 필드를 입력하세요')
    }
    
    let code = sessionCode.toUpperCase()
    if (!code) {
      code = Math.random().toString(36).substring(2, 8).toUpperCase()
    }
    
    const { data: existing } = await supabase.from('activity_sessions').select('id').eq('session_code', code).single()
    if (existing) {
      return alert('이미 사용 중인 세션 코드입니다')
    }
    
    await supabase.from('activity_sessions').insert({
      teacher_id: teacher.id,
      activity_name: activityName,
      session_code: code,
      tokens_per_student: parseInt(tokensPerStudent),
      total_groups: parseInt(totalGroups),
      status: 'active'
    })
    
    setActivityName('')
    setTokensPerStudent('')
    setTotalGroups('')
    setSessionCode('')
    loadSessions(teacher.id)
  }

  const checkSessionCode = async (code: string) => {
    if (!code) {
      setCodeError('')
      return
    }
    const { data } = await supabase.from('activity_sessions').select('id').eq('session_code', code.toUpperCase()).single()
    setCodeError(data ? '이미 사용 중인 코드입니다' : '사용 가능한 코드입니다')
  }

  const updateSessionCode = async (sessionId: number) => {
    if (!newSessionCode) return
    
    const { data: existing } = await supabase.from('activity_sessions').select('id').eq('session_code', newSessionCode.toUpperCase()).single()
    if (existing && existing.id !== sessionId) {
      return alert('이미 사용 중인 세션 코드입니다')
    }
    
    await supabase.from('activity_sessions').update({ session_code: newSessionCode.toUpperCase() }).eq('id', sessionId)
    setEditingSessionId(null)
    setNewSessionCode('')
    loadSessions(teacher.id)
  }

  const viewSessionResults = async (sessionId: number) => {
    const { data } = await supabase
      .from('activity_votes')
      .select('*, students(grade, class_number, student_number, name, group_number)')
      .eq('session_id', sessionId)
    
    setSessionResults(data || [])
    setShowResults(true)
  }

  const closeSession = async (sessionId: number) => {
    await supabase.from('activity_sessions').update({ status: 'closed' }).eq('id', sessionId)
    loadSessions(teacher.id)
  }

  if (!teacher) return <div>로딩중...</div>

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{teacher.name} 선생님 대시보드</h1>
          <div className="space-x-2">
            {showResults && (
              <button 
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                onClick={() => setShowResults(false)}
              >
                대시보드로
              </button>
            )}
            <Button onClick={() => { localStorage.removeItem('teacher'); router.push('/') }}>
              로그아웃
            </Button>
          </div>
        </div>

        {showResults ? (
          <Card>
            <CardHeader>
              <CardTitle>세션 결과</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessionResults.map((vote, idx) => (
                  <div key={idx} className="p-4 border rounded">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">
                          {vote.students?.grade}-{vote.students?.class_number}-{vote.students?.student_number} {vote.students?.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {vote.students?.group_number}모둠 → {vote.target_group}모둠
                        </p>
                      </div>
                      <span className="text-blue-600 font-bold">{vote.allocated_tokens} 토큰</span>
                    </div>
                    <p className="text-gray-700">{vote.feedback}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>학생 등록</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="학년" value={grade} onChange={e => setGrade(e.target.value)} />
                    <Input placeholder="반" value={classNumber} onChange={e => setClassNumber(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="번호" value={studentNumber} onChange={e => setStudentNumber(e.target.value)} />
                    <Input placeholder="이름" value={studentName} onChange={e => setStudentName(e.target.value)} />
                  </div>
                  <Input placeholder="모둠 번호" value={groupNumber} onChange={e => setGroupNumber(e.target.value)} />
                  <Button onClick={addStudent} className="w-full">학생 추가</Button>
                  
                  <div className="border-t pt-4">
                    <div className="flex gap-2 mb-2">
                      <Button onClick={generateSampleExcel} className="flex-1">샘플 다운로드</Button>
                      <label className="flex-1">
                        <Button className="w-full" onClick={() => document.getElementById('excel-upload')?.click()}>
                          엑셀 업로드
                        </Button>
                        <input 
                          id="excel-upload"
                          type="file" 
                          accept=".xlsx,.xls" 
                          onChange={handleExcelUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">A열:학년, B열:반, C열:번호, D열:이름, E열:모둠</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>새 활동 세션</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="활동명" value={activityName} onChange={e => setActivityName(e.target.value)} />
                  <Input placeholder="1인당 토큰" value={tokensPerStudent} onChange={e => setTokensPerStudent(e.target.value)} />
                  <Input placeholder="총 모둠 수" value={totalGroups} onChange={e => setTotalGroups(e.target.value)} />
                  <div>
                    <Input 
                      placeholder="세션 코드 (선택, 비우면 자동생성)" 
                      value={sessionCode} 
                      onChange={e => {
                        setSessionCode(e.target.value)
                        checkSessionCode(e.target.value)
                      }} 
                    />
                    {codeError && (
                      <p className={`text-xs mt-1 ${codeError.includes('사용 가능') ? 'text-green-600' : 'text-red-600'}`}>
                        {codeError}
                      </p>
                    )}
                  </div>
                  <Button onClick={createSession} className="w-full">세션 시작</Button>
                </CardContent>
              </Card>
            </div>

            {sessions.filter(s => s.status === 'active').map(session => (
              <Card key={session.id} className="mt-6 border-2 border-blue-500">
                <CardHeader>
                  <CardTitle>활성 세션: {session.activity_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    {editingSessionId === session.id ? (
                      <div className="flex gap-2">
                        <Input 
                          value={newSessionCode} 
                          onChange={e => setNewSessionCode(e.target.value)}
                          placeholder="새 세션 코드"
                        />
                        <Button onClick={() => updateSessionCode(session.id)}>저장</Button>
                        <Button onClick={() => setEditingSessionId(null)} className="bg-gray-400">취소</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-bold text-blue-600">세션 코드: {session.session_code}</p>
                        <Button onClick={() => {
                          setEditingSessionId(session.id)
                          setNewSessionCode(session.session_code)
                        }} className="text-xs px-2 py-1 h-auto">변경</Button>
                      </div>
                    )}
                    <p>토큰: {session.tokens_per_student} | 모둠 수: {session.total_groups}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => viewSessionResults(session.id)}>결과 보기</Button>
                    <Button onClick={() => closeSession(session.id)} className="bg-red-600">
                      세션 종료
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>등록된 학생 ({students.length}명)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">학년</th>
                        <th className="text-left p-2">반</th>
                        <th className="text-left p-2">번호</th>
                        <th className="text-left p-2">이름</th>
                        <th className="text-center p-2">모둠</th>
                        <th className="text-center p-2">포인트</th>
                        <th className="text-center p-2">모둠장</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(s => (
                        <tr key={s.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">{s.grade}학년</td>
                          <td className="p-2">{s.class_number}반</td>
                          <td className="p-2">{s.student_number}번</td>
                          <td className="p-2 font-medium">{s.name}</td>
                          <td className="p-2 text-center">
                            <input 
                              type="number" 
                              value={s.group_number} 
                              onChange={e => updateStudentGroup(s.id, Number(e.target.value))}
                              className="w-16 px-2 py-1 border rounded text-center"
                            />
                          </td>
                          <td className="p-2 text-center text-blue-600 font-semibold">{s.total_points}P</td>
                          <td className="p-2 text-center">
                            <Button 
                              onClick={() => toggleGroupLeader(s.id, s.is_group_leader)}
                              className={`text-xs px-3 py-1 h-auto ${s.is_group_leader ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 hover:bg-gray-400 text-gray-700'}`}
                            >
                              {s.is_group_leader ? '✓ 모둠장' : '모둠장 지정'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {sessions.filter(s => s.status === 'closed').map(session => (
              <Card key={session.id} className="mt-6 opacity-60">
                <CardHeader>
                  <CardTitle>종료된 세션: {session.activity_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">세션 코드: {session.session_code}</p>
                  <Button onClick={() => viewSessionResults(session.id)} className="mt-2">결과 보기</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </div>
      </div>
      <Footer />
    </div>
  )
}