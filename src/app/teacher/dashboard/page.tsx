'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { generateSampleExcel, parseExcelFile } from '@/lib/excel'

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
  const router = useRouter()

  useEffect(() => {
    const teacherData = localStorage.getItem('teacher')
    if (!teacherData) return router.push('/teacher/login')
    
    const t = JSON.parse(teacherData)
    console.log('Teacher data:', t)
    setTeacher(t)
    if (t && t.id) {
      loadStudents(t.id)
      loadSessions(t.id)
    }
  }, [])

  const loadStudents = async (teacherId: number) => {
    console.log('Loading students for teacher:', teacherId)
    const { data, error } = await supabase.from('students').select('*').eq('teacher_id', teacherId)
    console.log('Students data:', data, 'Error:', error)
    setStudents(data || [])
  }

  const loadSessions = async (teacherId: number) => {
    const { data } = await supabase.from('activity_sessions').select('*').eq('teacher_id', teacherId).order('created_at', { ascending: false })
    setSessions(data || [])
  }

  const addStudent = async () => {
    if (!grade || !classNumber || !studentNumber || !studentName || !groupNumber) {
      return alert('모든 필드를 입력하세요')
    }
    
    if (!teacher || !teacher.id) {
      alert('교사 정보가 없습니다. 다시 로그인해주세요.')
      return
    }
    
    console.log('Adding student with teacher_id:', teacher.id)
    
    const { data, error } = await supabase.from('students').insert({
      teacher_id: teacher.id,
      grade,
      class_number: classNumber,
      student_number: studentNumber,
      name: studentName,
      group_number: parseInt(groupNumber)
    })
    
    if (error) {
      console.error('Insert error:', error)
      alert('등록 중 오류가 발생했습니다: ' + error.message)
      return
    }
    
    setGrade('')
    setClassNumber('')
    setStudentNumber('')
    setStudentName('')
    setGroupNumber('')
    await loadStudents(teacher.id)
  }

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!teacher || !teacher.id) {
      alert('교사 정보가 없습니다. 다시 로그인해주세요.')
      return
    }

    try {
      const students = await parseExcelFile(file)
      console.log('Parsed students:', students)
      console.log('Teacher ID:', teacher.id)
      
      const { data, error } = await supabase.from('students').insert(
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
        console.error('Insert error:', error)
        alert('등록 중 오류가 발생했습니다: ' + error.message)
        return
      }
      
      alert(`${students.length}명의 학생이 등록되었습니다`)
      await loadStudents(teacher.id)
    } catch (error) {
      console.error('Excel processing error:', error)
      alert('엑셀 파일 처리 중 오류가 발생했습니다')
    }
  }

  const createSession = async () => {
    if (!activityName || !tokensPerStudent || !totalGroups) {
      return alert('모든 필드를 입력하세요')
    }
    
    await supabase.from('activity_sessions').insert({
      teacher_id: teacher.id,
      activity_name: activityName,
      tokens_per_student: parseInt(tokensPerStudent),
      total_groups: parseInt(totalGroups),
      status: 'active'
    })
    
    setActivityName('')
    setTokensPerStudent('')
    setTotalGroups('')
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

  const updateStudent = async (studentId: number, field: string, value: any) => {
    await supabase.from('students').update({ [field]: value }).eq('id', studentId)
    loadStudents(teacher.id)
  }

  const deleteStudent = async (studentId: number) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      await supabase.from('students').delete().eq('id', studentId)
      loadStudents(teacher.id)
    }
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
              <Button onClick={createSession} className="w-full">세션 시작</Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>등록된 학생 ({students.length}명)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {students.map(s => (
                <div key={s.id} className="p-3 bg-gray-100 rounded flex justify-between items-center">
                  <div className="flex-1 grid grid-cols-5 gap-2 text-sm">
                    <input 
                      className="px-2 py-1 border rounded" 
                      value={s.grade} 
                      onChange={e => updateStudent(s.id, 'grade', e.target.value)}
                    />
                    <input 
                      className="px-2 py-1 border rounded" 
                      value={s.class_number} 
                      onChange={e => updateStudent(s.id, 'class_number', e.target.value)}
                    />
                    <input 
                      className="px-2 py-1 border rounded" 
                      value={s.student_number} 
                      onChange={e => updateStudent(s.id, 'student_number', e.target.value)}
                    />
                    <input 
                      className="px-2 py-1 border rounded" 
                      value={s.name} 
                      onChange={e => updateStudent(s.id, 'name', e.target.value)}
                    />
                    <input 
                      type="number" 
                      className="px-2 py-1 border rounded" 
                      value={s.group_number} 
                      onChange={e => updateStudent(s.id, 'group_number', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="ml-2 text-sm text-blue-600">{s.total_points}P</div>
                  <button 
                    className="ml-2 px-2 py-1 bg-red-500 text-white rounded text-xs"
                    onClick={() => deleteStudent(s.id)}
                  >
                    삭제
                  </button>
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