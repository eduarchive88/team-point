import * as XLSX from 'xlsx'

export const generateSampleExcel = () => {
  const data = [
    ['학년', '반', '번호', '이름', '모둠'],
    ['1', '1', '1', '김철수', '1'],
    ['1', '1', '2', '이영희', '2'],
    ['1', '1', '3', '박민수', '1']
  ]
  
  const ws = XLSX.utils.aoa_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '학생명단')
  XLSX.writeFile(wb, '학생명단_샘플.xlsx')
}

export const parseExcelFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        // 첫 번째 행(헤더) 제외하고 반환
        const students = (jsonData as any[]).slice(1).filter(row => 
          row[0] && row[1] && row[2] && row[3] && row[4] // 모든 필드가 있는 행만
        ).map(row => ({
          grade: String(row[0]),
          class_number: String(row[1]),
          student_number: String(row[2]),
          name: String(row[3]),
          group_number: parseInt(String(row[4]))
        }))
        
        resolve(students)
      } catch (error) {
        reject(error)
      }
    }
    reader.readAsArrayBuffer(file)
  })
}