import React, { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus, Scale, Calendar, Activity, Dumbbell, Trash2, Download, Upload } from 'lucide-react'
import planData from '../../data/plan.json'
import { getHistory, getBodyWeight, saveBodyWeight, getExerciseHistory, getPersonalRecord, deleteSession, exportAllData, importAllData } from '../../utils/storage'

// Helper para formatear fecha
const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

// Componente de gráfico simple de barras
const SimpleBarChart = ({ data, labelKey, valueKey, maxValue }) => {
  if (!data || data.length === 0) {
    return <p className="text-center opacity-50 py-8">Sin datos aún</p>
  }

  const max = maxValue || Math.max(...data.map(d => d[valueKey])) || 10

  return (
    <div className="flex items-end gap-1 h-32 w-full px-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center">
          <div 
            className="w-full bg-primary rounded-t"
            style={{ height: `${(d[valueKey] / max) * 100}%` }}
          />
          <span className="text-[8px] opacity-50 mt-1 truncate w-full text-center">
            {d[labelKey]}
          </span>
        </div>
      ))}
    </div>
  )
}

// Componente de tendencia
const TrendIndicator = ({ current, previous }) => {
  if (!previous || previous === 0) return null
  
  const diff = current - previous
  const percentChange = ((diff / previous) * 100).toFixed(1)
  const isUp = diff > 0
  
  return (
    <div className={`flex items-center gap-1 text-xs ${isUp ? 'text-success' : 'text-error'}`}>
      {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
      <span className="font-bold">{Math.abs(percentChange)}%</span>
    </div>
  )
}

// Screen de Analytics
const Analytics = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('sessions')
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [newWeight, setNewWeight] = useState('')
  const [showDataModal, setShowDataModal] = useState(false)
  const [importText, setImportText] = useState('')

  const history = useMemo(() => getHistory(), [])
  const bodyWeights = useMemo(() => getBodyWeight(), [])

  // Obtener lista de ejercicios únicos con datos
  const exerciseList = useMemo(() => {
    const names = new Set()
    history.forEach(session => {
      session.exercises?.forEach(ex => names.add(ex.name))
    })
    return Array.from(names).sort()
  }, [history])

  // Stats generales
  const stats = useMemo(() => {
    const totalWorkouts = history.length
    const thisMonth = history.filter(h => {
      const d = new Date(h.date)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length
    
    return { totalWorkouts, thisMonth }
  }, [history])

  // Handle guardar peso
  const handleSaveWeight = () => {
    if (newWeight && parseFloat(newWeight) > 0) {
      saveBodyWeight(newWeight)
      setNewWeight('')
      setShowWeightModal(false)
    }
  }

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <button onClick={onBack} className="btn btn-ghost btn-sm gap-1 uppercase font-black italic">
          ← Volver
        </button>
        <h2 className="text-xl font-black uppercase">Analíticas</h2>
        <div className="w-16" />
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed mb-4">
        <button 
          className={`tab flex-1 ${activeTab === 'sessions' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          <Calendar size={16} />
          <span className="ml-1">Sesiones</span>
        </button>
        <button 
          className={`tab flex-1 ${activeTab === 'exercises' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('exercises')}
        >
          <Dumbbell size={16} />
          <span className="ml-1">Ejercicios</span>
        </button>
        <button 
          className={`tab flex-1 ${activeTab === 'weight' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('weight')}
        >
          <Scale size={16} />
          <span className="ml-1">Peso</span>
        </button>
      </div>

      {/* Contenido según tab */}
      {activeTab === 'sessions' && (
        <div className="flex-1 overflow-auto">
          <h3 className="font-bold text-sm mb-3">Últimas sesiones</h3>
          {history.length === 0 ? (
            <div className="text-center py-12 opacity-50">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p>No hay sesiones aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.slice(0, 20).map((session, i) => {
                const duration = session.totalDuration || session.exercises?.reduce((acc, ex) => acc + (ex.duration || 0), 0) || 0
                const mins = Math.floor(duration / 60)
                const secs = duration % 60
                const dayTitle = planData.days.find(d => d.id === session.dayId)?.title || `Día ${session.dayId}`
                
                return (
                  <div key={session.timestamp} className="bg-base-200 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-black uppercase text-sm">{dayTitle}</h4>
                        <p className="text-xs opacity-60">{formatDate(session.date)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="badge badge-primary font-black uppercase">
                          {mins > 0 ? `${mins}m ${secs}s` : `${secs}s`}
                        </span>
                        <button 
                          onClick={() => {
                            if (confirm('¿Eliminar esta sesión?')) {
                              deleteSession(session.timestamp)
                              // Force re-render
                              window.location.reload()
                            }
                          }}
                          className="btn btn-ghost btn-xs btn-circle text-error"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {session.exercises && session.exercises.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-base-300">
                        <p className="text-xs opacity-50 mb-1">Tiempo por ejercicio:</p>
                        <div className="flex flex-wrap gap-1">
                          {session.exercises.slice(0, 8).map((ex, j) => (
                            <span key={j} className="text-[10px] bg-base-300 px-2 py-1 rounded">
                              {ex.name?.split(' ')[0]}: {ex.duration ? `${ex.duration}s` : '-'}
                            </span>
                          ))}
                          {session.exercises.length > 8 && (
                            <span className="text-[10px] opacity-50 px-2 py-1">
                              +{session.exercises.length - 8} más
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'exercises' && (
        <div className="flex-1 overflow-auto">
          {/* Stats rápidos */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="stats shadow">
              <div className="stat px-4 py-2">
                <div className="stat-title text-xs uppercase">Entrenos</div>
                <div className="stat-value text-2xl">{stats.totalWorkouts}</div>
              </div>
            </div>
            <div className="stats shadow">
              <div className="stat px-4 py-2">
                <div className="stat-title text-xs uppercase">Este mes</div>
                <div className="stat-value text-2xl">{stats.thisMonth}</div>
              </div>
            </div>
          </div>

          {/* Lista de ejercicios */}
          {exerciseList.length === 0 ? (
            <div className="text-center py-12 opacity-50">
              <Dumbbell size={48} className="mx-auto mb-4 opacity-50" />
              <p>No hay datos de ejercicios aún</p>
              <p className="text-sm">¡完成 algunos entrenamientos para ver tu progreso!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exerciseList.map(exName => {
                const exHistory = getExerciseHistory(exName)
                const pr = getPersonalRecord(exName)
                const lastResult = exHistory[exHistory.length - 1]
                const prevResult = exHistory.length > 1 ? exHistory[exHistory.length - 2] : null
                
                // datos para gráfico (últimos 10)
                const chartData = exHistory.slice(-10).map(e => ({
                  date: formatDate(e.date),
                  reps: e.actual?.reps || 0,
                  weight: e.actual?.weight || 0,
                }))

                return (
                  <div key={exName} className="bg-base-200 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-black uppercase text-sm">{exName}</h3>
                      {lastResult?.feeling && (
                        <span className="text-lg">
                          {lastResult.feeling === 'easy' ? '😊' : 
                           lastResult.feeling === 'good' ? '👍' : 
                           lastResult.feeling === 'hard' ? '😤' : '❌'}
                        </span>
                      )}
                    </div>

                    {/*Gráfico*/}
                    <SimpleBarChart 
                      data={chartData} 
                      labelKey="date" 
                      valueKey={chartData[0]?.weight > 0 ? 'weight' : 'reps'} 
                    />

                    {/* Stats */}
                    <div className="flex justify-between items-end mt-2 text-xs">
                      <div>
                        <span className="opacity-50">Último: </span>
                        <span className="font-bold">
                          {lastResult?.actual?.reps && `${lastResult.actual.reps} reps`}
                          {lastResult?.actual?.weight && ` • ${lastResult.actual.weight}kg`}
                        </span>
                      </div>
                      {pr && (
                        <div className="text-success font-bold">
                          PR: {pr.actual?.weight}kg
                        </div>
                      )}
                      <TrendIndicator 
                        current={lastResult?.actual?.weight || lastResult?.actual?.reps}
                        previous={prevResult?.actual?.weight || prevResult?.actual?.reps}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab Peso corporal */}
      {activeTab === 'weight' && (
        <div className="flex-1 overflow-auto">
          {/* Botón agregar peso */}
          <button 
            onClick={() => setShowWeightModal(true)}
            className="btn btn-primary btn-block mb-4"
          >
            <Scale size={18} />
            Agregar peso corporal
          </button>

          {/* Latest weight */}
          {bodyWeights.length > 0 && (
            <div className="stats shadow mb-4">
              <div className="stat">
                <div className="stat-title text-xs uppercase">Última pesa</div>
                <div className="stat-value text-4xl">{bodyWeights[0].weight} <span className="text-lg">kg</span></div>
                <div className="stat-desc">{formatDate(bodyWeights[0].date)}</div>
              </div>
            </div>
          )}

          {/* Gráfico de peso */}
          {bodyWeights.length > 1 && (
            <div className="bg-base-200 rounded-xl p-4">
              <h3 className="font-bold text-sm mb-2">Evolución del peso</h3>
              <SimpleBarChart 
                data={bodyWeights.slice(0, 30).map(w => ({
                  date: formatDate(w.date),
                  weight: w.weight,
                })).reverse()} 
                labelKey="date" 
                valueKey="weight"
                maxValue={Math.max(...bodyWeights.map(w => w.weight)) + 2}
              />
            </div>
          )}

          {/* Lista de entradas */}
          {bodyWeights.length === 0 ? (
            <div className="text-center py-12 opacity-50">
              <Scale size={48} className="mx-auto mb-4 opacity-50" />
              <p>No hay datos de peso aún</p>
            </div>
          ) : (
            <div className="mt-4">
              <h4 className="font-bold text-xs uppercase opacity-50 mb-2">Historial</h4>
              <div className="space-y-1">
                {bodyWeights.slice(0, 10).map((w, i) => (
                  <div key={i} className="flex justify-between bg-base-200 px-3 py-2 rounded-lg text-sm">
                    <span>{formatDate(w.date)}</span>
                    <span className="font-bold">{w.weight} kg</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

{/* Modal agregar peso */}
      {showWeightModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-base-100 p-6 rounded-2xl w-64">
            <h3 className="font-black text-lg mb-4 text-center">Agregar Peso</h3>
            <input
              type="number"
              step="0.1"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              placeholder="70.5"
              className="input input-bordered input-lg w-full text-center text-2xl font-black mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button 
                onClick={() => setShowWeightModal(false)}
                className="btn btn-ghost flex-1"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveWeight}
                className="btn btn-primary flex-1"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botones Export/Import */}
      <div className="mt-6 pt-4 border-t border-base-300">
        <div className="flex gap-2">
          <button 
            onClick={() => {
              const data = exportAllData()
              if (data) {
                const blob = new Blob([data], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `entreno-backup-${new Date().toISOString().split('T')[0]}.json`
                a.click()
              }
            }}
            className="btn btn-outline btn-sm flex-1"
          >
            <Download size={16} />
            Exportar
          </button>
          <button 
            onClick={() => setShowDataModal(true)}
            className="btn btn-outline btn-sm flex-1"
          >
            <Upload size={16} />
            Importar
          </button>
        </div>
        <p className="text-xs opacity-50 text-center mt-2">
          Comparte datos entre dispositivos
        </p>
      </div>

      {/* Modal Import */}
      {showDataModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-base-100 p-4 rounded-2xl m-4 max-h-[80vh] overflow-auto w-80">
            <h3 className="font-black text-lg mb-2">Importar datos</h3>
            <p className="text-xs opacity-70 mb-2">Pega el JSON aqui:</p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="textarea textarea-bordered w-full h-32 text-xs font-mono"
              placeholder="Pega el contenido del archivo JSON..."
            />
            <div className="flex gap-2 mt-3">
              <button 
                onClick={() => {
                  setShowDataModal(false)
                  setImportText('')
                }}
                className="btn btn-ghost flex-1"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if (importAllData(importText)) {
                    alert('Datos importados!')
                    window.location.reload()
                  } else {
                    alert('Error al importar')
                  }
                }}
                className="btn btn-primary flex-1"
              >
                Importar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Analytics