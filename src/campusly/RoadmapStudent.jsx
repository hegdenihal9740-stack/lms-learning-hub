import studentPhoto from '@/assets/college-student-lms.png.asset.json'
import studentBack from '@/assets/college-student-back.png.asset.json'
import { assetUrl } from '@/lib/asset-url'

// Photo layers preserve the supplied character while adding a scroll-driven gait.
export default function RoadmapStudent({ running, direction = 1 }) {
  const views = [['front', studentPhoto], ['back', studentBack]]
  return (
    <div className={`roadmap-photo-student${running ? ' is-walking' : ''}`} data-facing={direction > 0 ? 'front' : 'back'}>
      <span className="roadmap-student-shadow" />
      <div className="roadmap-photo-turn">
        {views.map(([view, asset]) => <div key={view} className={`roadmap-photo-view roadmap-photo-${view}`}>
          <div className="roadmap-photo-body">
            <img className="roadmap-photo-upper" src={assetUrl(asset.url)} alt="" draggable={false} />
            <img className="roadmap-photo-leg roadmap-photo-leg-left" src={assetUrl(asset.url)} alt="" draggable={false} />
            <img className="roadmap-photo-leg roadmap-photo-leg-right" src={assetUrl(asset.url)} alt="" draggable={false} />
          </div>
        </div>)}
      </div>
    </div>
  )
}