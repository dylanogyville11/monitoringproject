import React from 'react'
import { FileCheck, FileSignature, HardHat, Award } from 'lucide-react'
import { getStageName } from '../../utils/formatters'
import type { StageType, StageWithDocuments } from '../../types'

interface StagesTabsProps {
  stages: StageWithDocuments[]
  activeStage: StageType
  onSelectStage: (stageType: StageType) => void
  stageProgress: Record<string, number | null>
}

const stageIcons: Record<StageType, React.ReactNode> = {
  prakualifikasi: <FileCheck size={18} />,
  kontrak: <FileSignature size={18} />,
  pelaksanaan: <HardHat size={18} />,
  serah_terima: <Award size={18} />,
}

const StagesTabs: React.FC<StagesTabsProps> = ({
  stages,
  activeStage,
  onSelectStage,
  stageProgress,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
      {stages.map((stage) => {
        const isActive = activeStage === stage.stage_type
        const progress = stageProgress[stage.stage_type]
        const docs = stage.document_items || []
        const completed = docs.filter((d) => d.status === 'Sudah Lengkap').length

        return (
          <button
            key={stage.id}
            type="button"
            onClick={() => onSelectStage(stage.stage_type)}
            className={`p-3.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between ${
              isActive
                ? 'bg-navy-900 border-navy-900 text-white shadow-md'
                : 'bg-white border-gray-200 text-gray-700 hover:border-navy-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span
                className={`p-2 rounded-lg ${
                  isActive ? 'bg-navy-800 text-white' : 'bg-navy-50 text-navy-800'
                }`}
              >
                {stageIcons[stage.stage_type]}
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-navy-800 text-navy-100'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Bobot {stage.weight}%
              </span>
            </div>

            <div>
              <div
                className={`text-sm font-bold truncate ${
                  isActive ? 'text-white' : 'text-gray-900'
                }`}
              >
                {getStageName(stage.stage_type)}
              </div>

              <div
                className={`flex items-center justify-between text-xs mt-2 ${
                  isActive ? 'text-navy-200' : 'text-gray-500'
                }`}
              >
                <span>
                  {completed}/{docs.length} Dokumen
                </span>
                <span className="font-bold">
                  {progress !== null && progress !== undefined
                    ? `${progress.toFixed(0)}%`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default StagesTabs
