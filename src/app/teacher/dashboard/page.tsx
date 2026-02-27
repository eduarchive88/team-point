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
  const [sortField, setSortField] = useState<string>('is_group_leader')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [resultTab, setResultTab] = useState<'student' | 'groupLeader'>('student')
  const [viewTab, setViewTab] = useState<'stats' | 'logs' | 'groupStats' | 'groupLogs' | 'participants' | 'nonParticipants'>('stats')
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

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const sortedStudents = [...students].sort((a, b) => {
    let aVal = a[sortField]
    let bVal = b[sortField]
    
    // 모둠장 여부는 불린이므로 숫자로 변환
    if (sortField === 'is_group_leader') {
      aVal = a.is_group_leader ? 1 : 0
      bVal = b.is_group_leader ? 1 : 0
    }
    
    // 숫자 필드 처리
    if (sortField === 'group_number' || sortField === 'total_points') {
      aVal = Number(aVal)
      bVal = Number(bVal)
    }
    
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

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
    const student = students.find(s => s.id === studentId)
    if (!student) return
    
    // 모둠장으로 지정하려는 경우
    if (!currentStatus) {
      // 같은 모둠에 이미 모둠장이 있는지 확인
      const existingLeader = students.find(s => 
        s.group_number === student.group_number && 
        s.is_group_leader && 
        s.id !== studentId
      )
      
      if (existingLeader) {
        return alert(`${student.group_number}모둠에는 이미 모둠장(${existingLeader.name})이 있습니다. 먼저 기존 모둠장을 해제해주세요.`)
      }
    }
    
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
    const session = sessions.find(s => s.id === sessionId)
    if (!session) return
    
    const { data } = await supabase
      .from('activity_votes')
      .select('*, students(grade, class_number, student_number, name, group_number, is_group_leader)')
      .eq('session_id', sessionId)
    
    setSessionResults(data || [])
    setShowResults(true)
    setResultTab('student')
    setViewTab('stats')
  }

  const getStudentVotes = () => sessionResults.filter(v => !v.students?.is_group_leader)
  const getGroupLeaderVotes = () => sessionResults.filter(v => v.students?.is_group_leader)

  const getNonParticipants = (isGroupLeader: boolean) => {
    const activeSession = sessions.find(s => s.status === 'active')
    if (!activeSession) return []
    
    const votes = isGroupLeader ? getGroupLeaderVotes() : getStudentVotes()
    const participantIds = new Set(votes.map(v => v.student_id))
    
    return students.filter(s => 
      s.is_group_leader === isGroupLeader && 
      !participantIds.has(s.id)
    )
  }

  const getParticipants = (isGroupLeader: boolean) => {
    const votes = isGroupLeader ? getGroupLeaderVotes() : getStudentVotes()
    const participantIds = new Set(votes.map(v => v.student_id))
    
    return students.filter(s => 
      s.is_group_leader === isGroupLeader && 
      participantIds.has(s.id)
    )
  }

  const getNonParticipantGroups = () => {
    const activeSession = sessions.find(s => s.status === 'active')
    if (!activeSession) return []
    
    const votes = getGroupLeaderVotes()
    const participantGroups = new Set(votes.map(v => v.students?.group_number))
    
    const allGroups = Array.from(new Set(students.filter(s => s.is_group_leader).map(s => s.group_number)))
    return allGroups.filter(g => !participantGroups.has(g))
  }

  const getParticipantGroups = () => {
    const votes = getGroupLeaderVotes()
    return Array.from(new Set(votes.map(v => v.students?.group_number))).filter(g => g)
  }

  const getGroupStats = (votes: any[]) => {
    const groupMap: any = {}
    votes.forEach(vote => {
      const group = vote.target_group
      if (!groupMap[group]) {
        groupMap[group] = { total: 0, count: 0, feedbacks: [] }
      }
      groupMap[group].total += vote.allocated_tokens
      groupMap[group].count += 1
      groupMap[group].feedbacks.push(vote.feedback)
    })
    return groupMap
  }

  const getIndividualStats = (votes: any[]) => {
    const studentMap: any = {}
    votes.forEach(vote => {
      const studentId = vote.student_id
      if (!studentMap[studentId]) {
        studentMap[studentId] = {
          student: vote.students,
          totalGiven: 0,
          votes: []
        }
      }
      studentMap[studentId].totalGiven += vote.allocated_tokens
      studentMap[studentId].votes.push(vote)
    })
    return Object.values(studentMap)
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
          <div>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>세션 결과</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Button 
                    onClick={() => setResultTab('student')}
                    className={resultTab === 'student' ? 'bg-blue-600' : 'bg-gray-400'}
                  >
                    학생 개인 투표 ({getStudentVotes().length}건)
                  </Button>
                  <Button 
                    onClick={() => setResultTab('groupLeader')}
                    className={resultTab === 'groupLeader' ? 'bg-blue-600' : 'bg-gray-400'}
                  >
                    모둠 대표 투표 ({getGroupLeaderVotes().length}건)
                  </Button>
                </div>
                <div className="flex gap-2 border-b mb-4 overflow-x-auto">
                  <button 
                    onClick={() => setViewTab('stats')}
                    className={`px-4 py-2 whitespace-nowrap ${viewTab === 'stats' ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-600'}`}
                  >
                    개인별 통계
                  </button>
                  <button 
                    onClick={() => setViewTab('logs')}
                    className={`px-4 py-2 whitespace-nowrap ${viewTab === 'logs' ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-600'}`}
                  >
                    개인별 로그
                  </button>
                  <button 
                    onClick={() => setViewTab('groupStats')}
                    className={`px-4 py-2 whitespace-nowrap ${viewTab === 'groupStats' ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-600'}`}
                  >
                    모둠별 통계
                  </button>
                  <button 
                    onClick={() => setViewTab('groupLogs')}
                    className={`px-4 py-2 whitespace-nowrap ${viewTab === 'groupLogs' ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-600'}`}
                  >
                    모둠별 로그
                  </button>
                  <button 
                    onClick={() => setViewTab('participants')}
                    className={`px-4 py-2 whitespace-nowrap ${viewTab === 'participants' ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-600'}`}
                  >
                    참여자
                  </button>
                  <button 
                    onClick={() => setViewTab('nonParticipants')}
                    className={`px-4 py-2 whitespace-nowrap ${viewTab === 'nonParticipants' ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-600'}`}
                  >
                    미참여자
                  </button>
                </div>

                {(() => {
                  const currentVotes = resultTab === 'student' ? getStudentVotes() : getGroupLeaderVotes()
                  
                  if (viewTab === 'stats') {
                    return (
                      <div className="space-y-4">
                        <h3 className="font-bold text-lg">개인별 투표 통계</h3>
                        {getIndividualStats(currentVotes).map((data: any, idx: number) => (
                          <div key={idx} className="p-4 border rounded bg-gray-50">
                            <div className="flex justify-between items-center mb-2">
                              <p className="font-semibold">
                                {data.student?.grade}학년 {data.student?.class_number}반 {data.student?.student_number}번 {data.student?.name}
                                {data.student?.is_group_leader && <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded">모둠장</span>}
                              </p>
                              <span className="text-blue-600 font-bold">총 {data.totalGiven}토큰 부여</span>
                            </div>
                            <p className="text-sm text-gray-600">{data.student?.group_number}모둠 | {data.votes.length}건의 투표</p>
                          </div>
                        ))}
                      </div>
                    )
                  } else if (viewTab === 'logs') {
                    return (
                      <div className="space-y-4">
                        <h3 className="font-bold text-lg">개인별 투표 로그</h3>
                        {currentVotes.map((vote, idx) => (
                          <div key={idx} className="p-4 border rounded">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-semibold">
                                  {vote.students?.grade}학년 {vote.students?.class_number}반 {vote.students?.student_number}번 {vote.students?.name}
                                  {vote.students?.is_group_leader && <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded">모둠장</span>}
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
                    )
                  } else if (viewTab === 'groupStats') {
                    return (
                      <div className="space-y-4">
                        <h3 className="font-bold text-lg">모둠별 획등 통계</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {Object.entries(getGroupStats(currentVotes))
                            .sort(([, a]: any, [, b]: any) => b.total - a.total)
                            .map(([group, data]: any) => (
                            <div key={group} className="p-4 border rounded bg-blue-50">
                              <p className="text-2xl font-bold text-blue-600">{group}모둠</p>
                              <p className="text-xl font-semibold mt-2">{data.total} 토큰</p>
                              <p className="text-sm text-gray-600">{data.count}건의 투표 받음</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  } else if (viewTab === 'groupLogs') {
                    return (
                      <div className="space-y-4">
                        <h3 className="font-bold text-lg">모둠별 피드백 로그</h3>
                        {Object.entries(getGroupStats(currentVotes)).map(([group, data]: any) => (
                          <div key={group} className="p-4 border rounded">
                            <div className="flex justify-between items-center mb-3">
                              <p className="text-xl font-bold">{group}모둠</p>
                              <span className="text-blue-600 font-bold">총 {data.total}토큰</span>
                            </div>
                            <div className="space-y-2">
                              {data.feedbacks.map((feedback: string, idx: number) => (
                                <div key={idx} className="p-2 bg-gray-50 rounded text-sm">
                                  <p className="text-gray-500">익명의 피드백 #{idx + 1}</p>
                                  <p>{feedback}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  } else if (viewTab === 'nonParticipants') {
                    return (
                      <div className="space-y-4">
                        <h3 className="font-bold text-lg">
                          {resultTab === 'student' ? '미참여 학생' : '미참여 모둠'}
                        </h3>
                        {resultTab === 'student' ? (
                          <div>
                            {getNonParticipants(false).length === 0 ? (
                              <p className="text-center text-gray-500 py-8">모든 학생이 참여했습니다!</p>
                            ) : (
                              <div className="space-y-2">
                                {getNonParticipants(false).map(s => (
                                  <div key={s.id} className="p-3 border rounded bg-red-50">
                                    <p className="font-semibold">
                                      {s.grade}학년 {s.class_number}반 {s.student_number}번 {s.name}
                                    </p>
                                    <p className="text-sm text-gray-600">{s.group_number}모둠</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            {getNonParticipantGroups().length === 0 ? (
                              <p className="text-center text-gray-500 py-8">모든 모둠이 참여했습니다!</p>
                            ) : (
                              <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                                {getNonParticipantGroups().map(group => (
                                  <div key={group} className="p-4 border rounded bg-red-50 text-center">
                                    <p className="text-2xl font-bold text-red-600">{group}모둠</p>
                                    <p className="text-sm text-gray-600 mt-1">미참여</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  } else {
                    return (
                      <div className="space-y-4">
                        <h3 className="font-bold text-lg">
                          {resultTab === 'student' ? '참여 학생' : '참여 모둠'}
                        </h3>
                        {resultTab === 'student' ? (
                          <div>
                            {getParticipants(false).length === 0 ? (
                              <p className="text-center text-gray-500 py-8">아직 참여한 학생이 없습니다.</p>
                            ) : (
                              <div className="space-y-2">
                                {getParticipants(false).map(s => (
                                  <div key={s.id} className="p-3 border rounded bg-green-50">
                                    <p className="font-semibold">
                                      {s.grade}학년 {s.class_number}반 {s.student_number}번 {s.name}
                                    </p>
                                    <p className="text-sm text-gray-600">{s.group_number}모둠</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            {getParticipantGroups().length === 0 ? (
                              <p className="text-center text-gray-500 py-8">아직 참여한 모둠이 없습니다.</p>
                            ) : (
                              <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                                {getParticipantGroups().map(group => (
                                  <div key={group} className="p-4 border rounded bg-green-50 text-center">
                                    <p className="text-2xl font-bold text-green-600">{group}모둠</p>
                                    <p className="text-sm text-gray-600 mt-1">참여 완료</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  }
                })()}
              </CardContent>
            </Card>
          </div>
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
                        <th className="text-left p-2 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('grade')}>
                          학년 {sortField === 'grade' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="text-left p-2 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('class_number')}>
                          반 {sortField === 'class_number' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="text-left p-2 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('student_number')}>
                          번호 {sortField === 'student_number' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="text-left p-2 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                          이름 {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="text-center p-2 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('group_number')}>
                          모둠 {sortField === 'group_number' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="text-center p-2 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('is_group_leader')}>
                          모둠장 {sortField === 'is_group_leader' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedStudents.map(s => (
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