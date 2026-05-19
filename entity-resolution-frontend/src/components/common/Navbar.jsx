import { useNavigate } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'
import useStore from '../../store/useStore'

export default function Navbar() {
  const { reset } = useStore()
  const navigate = useNavigate()

  const handleReset = () => {
    reset()
    navigate('/upload')
  }

  return (
    <header className="sticky top-0 z-30 h-14 bg-white border-b border-gray-200">
      <div className="h-14 px-6 flex items-center justify-end gap-4">
        <button onClick={handleReset} className="btn-ghost text-sm ml-auto">
          <RotateCcw size={14} /> Reset
        </button>
      </div>
    </header>
  )
}
