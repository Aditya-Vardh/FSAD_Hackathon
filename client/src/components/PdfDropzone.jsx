import { useRef, useState } from 'react'

export default function PdfDropzone({ onFileSelected, fileName, label }) {
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

  const pickFile = () => inputRef.current?.click()

  const acceptFile = (file) => {
    if (!file) return
    if (file.type !== 'application/pdf') return
    onFileSelected(file)
  }

  return (
    <div>
      {label ? <div className="text-sm font-medium text-slate-800 mb-2">{label}</div> : null}
      <div
        role="button"
        tabIndex={0}
        onClick={pickFile}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') pickFile()
        }}
        onDragEnter={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsDragging(true)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsDragging(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsDragging(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsDragging(false)
          const file = e.dataTransfer?.files?.[0]
          acceptFile(file)
        }}
        className={[
          'rounded-xl border-2 border-dashed px-4 py-6 text-center transition cursor-pointer select-none',
          isDragging
            ? 'border-[#3b82f6] bg-blue-50'
            : 'border-gray-300 bg-white hover:border-[#3b82f6]/60'
        ].join(' ')}
      >
        <div className="text-sm font-semibold text-blue-900">Drag & drop PDF</div>
        <div className="text-xs text-slate-500 mt-1">or click to browse</div>

        {fileName ? (
          <div className="mt-3 text-xs text-slate-700">
            Selected: <span className="font-medium">{fileName}</span>
          </div>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          acceptFile(file)
        }}
      />
    </div>
  )
}

