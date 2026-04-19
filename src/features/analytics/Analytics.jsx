import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { colors, typography, borderRadius } from '../../styles/tokens'
import { Sidebar, BottomNav } from '../../components/navigation'
import { Badge } from '../../components/ui'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { analyticsAPI, sessionsAPI, weightAPI } from '../../utils/api'
import { getUISettings } from '../../utils/storage'
import ReactECharts from 'echarts-for-react'

const Analytics = ({ onNavigate }) => {
  const { profile } = useAuth()
  const { isDesktop } = useBreakpoint()
  const [timeRange, setTimeRange] = useState('12m')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState(null)
  const [statsData, setStatsData] = useState(null)
  const [frequency, setFrequency] = useState([])
  const [weightHistory, setWeightHistory] = useState([])
  const [adherence, setAdherence] = useState({ days: [], max_count: 0 })
  const [sessions, setSessions] = useState([])
  const [selectedExercise, setSelectedExercise] = useState('')
  const [progressSeriesVisibility, setProgressSeriesVisibility] = useState(() => {
    const ui = getUISettings()
    return {
      weight: ui.showWeightSeries !== false,
      reps: ui.showRepsSeries !== false,
      feeling: ui.showFeelingSeries !== false,
    }
  })
  const [exerciseProgress, setExerciseProgress] = useState({ exercise_name: '', points: [], total_points: 0 })
  const [loadingExerciseProgress, setLoadingExerciseProgress] = useState(false)
  const [newWeight, setNewWeight] = useState('')
  const [weightDate, setWeightDate] = useState(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = `${now.getMonth() + 1}`.padStart(2, '0')
    const d = `${now.getDate()}`.padStart(2, '0')
    return `${y}-${m}-${d}`
  })
  const [savingWeight, setSavingWeight] = useState(false)

  const feelingScoreMap = {
    easy: 4,
    good: 3,
    hard: 2,
    failed: 1,
  }

  const formatDateISO = (date) => {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = `${d.getMonth() + 1}`.padStart(2, '0')
    const day = `${d.getDate()}`.padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatShortDate = (iso) => {
    if (!iso || typeof iso !== 'string') return ''
    const parts = iso.split('-')
    if (parts.length !== 3) return iso
    return `${parts[2]}/${parts[1]}`
  }

  const getRangeStartDate = (range) => {
    const now = new Date()
    const start = new Date(now)
    if (range === '3m') start.setMonth(now.getMonth() - 3)
    else if (range === '6m') start.setMonth(now.getMonth() - 6)
    else start.setMonth(now.getMonth() - 12)
    return formatDateISO(start)
  }

  const getRangeEndDate = () => formatDateISO(new Date())

  const loadAnalytics = async (range = timeRange) => {
    if (!profile?.id) return

    setLoading(true)
    setError('')
    try {
      const startDate = getRangeStartDate(range)
      const endDate = getRangeEndDate()

      const [summaryRes, statsRes, freqRes, weightRes, adherenceRes, sessionsRes] = await Promise.all([
        analyticsAPI.getSummary(profile.id),
        analyticsAPI.getStats(profile.id, startDate, endDate),
        analyticsAPI.getFrequency(profile.id, 8),
        analyticsAPI.getWeightHistory(profile.id, 60),
        analyticsAPI.getAdherence(profile.id, startDate, endDate),
        sessionsAPI.list(profile.id, 8, 0),
      ])

      setSummary(summaryRes)
      setStatsData(statsRes)
      setFrequency(Array.isArray(freqRes) ? freqRes : [])
      const suggestedExercise = Array.isArray(freqRes) && freqRes.length > 0 ? freqRes[0].exercise : ''
      setSelectedExercise((prev) => prev || suggestedExercise)
      setWeightHistory(Array.isArray(weightRes) ? weightRes : [])
      setAdherence(adherenceRes || { days: [], max_count: 0 })
      setSessions(Array.isArray(sessionsRes) ? sessionsRes : [])
    } catch (e) {
      setError('No pudimos cargar analytics del backend')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!profile?.id) return

    loadAnalytics(timeRange)
  }, [profile?.id, timeRange])

  useEffect(() => {
    if (!profile?.id || !selectedExercise) return

    const loadExerciseProgress = async () => {
      setLoadingExerciseProgress(true)
      try {
        const startDate = getRangeStartDate(timeRange)
        const endDate = getRangeEndDate()
        const data = await analyticsAPI.getExerciseProgress(profile.id, selectedExercise, startDate, endDate, 220)
        setExerciseProgress(data || { exercise_name: selectedExercise, points: [], total_points: 0 })
      } catch {
        setExerciseProgress({ exercise_name: selectedExercise, points: [], total_points: 0 })
      } finally {
        setLoadingExerciseProgress(false)
      }
    }

    loadExerciseProgress()
  }, [profile?.id, selectedExercise, timeRange])

  const handleAddWeight = async () => {
    if (!profile?.id || savingWeight) return

    const numericWeight = Number(newWeight)
    if (!newWeight || Number.isNaN(numericWeight) || numericWeight <= 0) {
      setError('Ingresá un peso válido en kg')
      return
    }

    setSavingWeight(true)
    setError('')
    try {
      await weightAPI.add(profile.id, String(numericWeight), weightDate)
      setNewWeight('')
      await loadAnalytics(timeRange)
    } catch (e) {
      setError('No pudimos guardar el peso corporal')
    } finally {
      setSavingWeight(false)
    }
  }


  const stats = useMemo(() => {
    const totalWorkouts = summary?.total_workouts ?? statsData?.total_workouts ?? 0
    const totalMinutes = statsData?.total_duration_minutes ?? 0
    const avgDurationMinutes = statsData?.average_duration_minutes ?? 0
    const now = new Date()
    const month = `${now.getMonth() + 1}`.padStart(2, '0')
    const year = now.getFullYear()
    const thisMonth = adherence?.days?.filter((d) => d.date?.startsWith(`${year}-${month}`)).reduce((acc, d) => acc + (d.count || 0), 0) || 0

    return {
      totalWorkouts,
      thisMonth,
      totalHours: Math.max(0, Math.round(totalMinutes / 60)),
      avgDuration: `${Math.max(0, Math.round(avgDurationMinutes))}m`,
    }
  }, [summary, statsData, adherence])

  const sessionsView = useMemo(() => sessions.map((session, index) => ({
    id: session.id || session.timestamp || index,
    day: `Día ${session.day_id ?? '-'}`,
    date: session.date || '-',
    duration: session.total_duration ? `${Math.round(session.total_duration / 60)}m` : '0m',
    completed: Number(session.is_completed) === 1,
  })), [sessions])

  const maxWeightChartPoints = useMemo(() => {
    if (timeRange === '3m') return 20
    if (timeRange === '6m') return 18
    return 16
  }, [timeRange])

  const weightChartHistory = useMemo(
    () => weightHistory.slice(-maxWeightChartPoints),
    [weightHistory, maxWeightChartPoints]
  )

  const weightMinMax = useMemo(() => {
    const nums = weightChartHistory.map((w) => Number(w.weight)).filter((w) => !Number.isNaN(w))
    if (nums.length === 0) {
      return { min: 0, max: 0, range: 0, zoomMode: 'none' }
    }

    const min = Math.min(...nums)
    const max = Math.max(...nums)
    const range = Math.max(0.1, max - min)

    return {
      min,
      max,
      range,
      zoomMode: range > 6 ? 'zoomed_out' : 'normal',
    }
  }, [weightChartHistory])

  const latestWeightEntry = useMemo(
    () => (weightHistory.length > 0 ? weightHistory[weightHistory.length - 1] : null),
    [weightHistory]
  )

  const recentWeightEntries = useMemo(
    () => [...weightHistory].slice(-8).reverse(),
    [weightHistory]
  )


  const heatmapColumns = useMemo(() => {
    const dayMap = new Map((adherence?.days || []).map((d) => [d.date, d.count]))
    const end = new Date(adherence?.end_date || getRangeEndDate())
    const start = new Date(adherence?.start_date || getRangeStartDate(timeRange))
    const startAligned = new Date(start)
    const weekday = (startAligned.getDay() + 6) % 7
    startAligned.setDate(startAligned.getDate() - weekday)

    const weeks = []
    const cursor = new Date(startAligned)
    while (cursor <= end) {
      const week = []
      for (let i = 0; i < 7; i += 1) {
        const day = new Date(cursor)
        day.setDate(cursor.getDate() + i)
        const key = formatDateISO(day)
        const inRange = day >= start && day <= end
        week.push({ date: key, count: inRange ? (dayMap.get(key) || 0) : null })
      }
      weeks.push(week)
      cursor.setDate(cursor.getDate() + 7)
    }
    return weeks
  }, [adherence, timeRange])

  const weightChartStartEnd = useMemo(() => {
    if (weightChartHistory.length === 0) return { start: '', end: '' }
    return {
      start: weightChartHistory[0]?.date || '',
      end: weightChartHistory[weightChartHistory.length - 1]?.date || '',
    }
  }, [weightChartHistory])

  const exerciseProgressPoints = exerciseProgress?.points || []

  const maxExercisePlotPoints = 48

  const weightLineData = useMemo(() => {
    const points = weightChartHistory
      .map((p, idx) => {
        const value = Number(p.weight)
        if (Number.isNaN(value)) return null
        return {
          x: p.date,
          y: Number(value.toFixed(2)),
          date: p.date,
        }
      })
      .filter(Boolean)

    if (points.length === 0) return []
    return [
      {
        id: 'Peso corporal',
                      data: points.map((point) => ({ ...point, x: point.date })),
      },
    ]
  }, [weightChartHistory])

  const weightChartInsights = useMemo(() => {
    const values = weightChartHistory
      .map((entry) => ({ date: entry.date, value: Number(entry.weight) }))
      .filter((entry) => !Number.isNaN(entry.value))

    if (values.length === 0) return null

    const latest = values[values.length - 1]
    const min = Math.min(...values.map((entry) => entry.value))
    const max = Math.max(...values.map((entry) => entry.value))

    return {
      latest: latest.value,
      latestDate: latest.date,
      min,
      max,
    }
  }, [weightChartHistory])

  const exerciseTimelineSeries = useMemo(() => {
    const recent = exerciseProgressPoints.slice(-220)
    if (recent.length === 0) {
      return { series: [], dates: [], startDate: '', endDate: '' }
    }

    const byDate = new Map()
    recent.forEach((point) => {
      const key = point.session_date
      if (!key) return

      if (!byDate.has(key)) {
        byDate.set(key, {
          date: key,
          weightValues: [],
          repsValues: [],
          feelingValues: [],
        })
      }

      const bucket = byDate.get(key)
      if (typeof point.actual_weight === 'number') bucket.weightValues.push(Number(point.actual_weight))
      if (typeof point.actual_reps === 'number') bucket.repsValues.push(Number(point.actual_reps))
      if (point.feeling && feelingScoreMap[point.feeling] != null) bucket.feelingValues.push(Number(feelingScoreMap[point.feeling]))
    })

    const dates = Array.from(byDate.keys()).sort()
    const clippedDates = dates.slice(-maxExercisePlotPoints)
    const daily = clippedDates.map((d) => {
      const row = byDate.get(d)

      const avg = (arr) => {
        if (!arr || arr.length === 0) return null
        return arr.reduce((sum, val) => sum + val, 0) / arr.length
      }

      return {
        date: d,
        weightAvg: avg(row.weightValues),
        repsAvg: avg(row.repsValues),
        feelingAvg: avg(row.feelingValues),
      }
    })

    const weightSeries = daily.map((d) => (d.weightAvg != null ? Number(d.weightAvg.toFixed(2)) : null))
    const repsSeries = daily.map((d) => (d.repsAvg != null ? Number(d.repsAvg.toFixed(2)) : null))
    const feelingSeries = daily.map((d) => (d.feelingAvg != null ? Number(d.feelingAvg.toFixed(2)) : null))

    const series = []
    if (progressSeriesVisibility.weight && weightSeries.some((v) => v != null)) {
      series.push({ id: 'Peso real', kind: 'weight', color: colors.secondary, data: weightSeries, yAxisIndex: 0 })
    }
    if (progressSeriesVisibility.reps && repsSeries.some((v) => v != null)) {
      series.push({ id: 'Reps reales', kind: 'reps', color: colors.primary, data: repsSeries, yAxisIndex: 1 })
    }
    if (progressSeriesVisibility.feeling && feelingSeries.some((v) => v != null)) {
      series.push({ id: 'Feeling', kind: 'feeling', color: colors.tertiary, data: feelingSeries, yAxisIndex: 2 })
    }

    return {
      series,
      dates: clippedDates,
      startDate: clippedDates[0] || '',
      endDate: clippedDates[clippedDates.length - 1] || '',
    }
  }, [
    exerciseProgressPoints,
    progressSeriesVisibility,
    feelingScoreMap,
  ])

  const formatOverlayRealValue = (kind, rawValue) => {
    if (rawValue == null || Number.isNaN(Number(rawValue))) return '-'
    const value = Number(rawValue)
    if (kind === 'weight') return `${value.toFixed(2)} kg`
    if (kind === 'reps') return `${value.toFixed(2)} reps`
    if (kind === 'feeling') {
      const rounded = Math.round(value)
      const label = ({ 1: 'failed', 2: 'hard', 3: 'good', 4: 'easy' }[rounded]) || `${value.toFixed(2)}`
      return `${label} (${value.toFixed(2)})`
    }
    return `${value.toFixed(2)}`
  }

  const overlaySeriesInsights = useMemo(() => {
    const series = exerciseTimelineSeries.series || []
    return series
      .map((serie) => {
        const raws = serie.data
          .map((point) => Number(point))
          .filter((val) => !Number.isNaN(val))

        if (raws.length === 0 || serie.data.length === 0) return null

        const latestIndex = [...serie.data].map((v, idx) => ({ v, idx })).reverse().find((item) => item.v != null)?.idx ?? -1
        const latestValue = latestIndex >= 0 ? Number(serie.data[latestIndex]) : null
        const latestDate = latestIndex >= 0 ? exerciseTimelineSeries.dates[latestIndex] : ''
        const min = Math.min(...raws)
        const max = Math.max(...raws)

        return {
          id: serie.id,
          kind: serie.kind,
          latest: latestValue,
          latestDate,
          min,
          max,
        }
      })
      .filter(Boolean)
  }, [exerciseTimelineSeries])

  const weightChartOption = useMemo(() => {
    const dates = weightChartHistory.map((entry) => entry.date)
    const values = weightChartHistory.map((entry) => Number(entry.weight))

    return {
      backgroundColor: 'transparent',
      animation: false,
      grid: { top: 24, right: 16, bottom: 48, left: 56 },
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const p = params?.[0]
          if (!p) return ''
          return `${p.axisValue}<br/><b>Peso:</b> ${Number(p.data).toFixed(2)} kg`
        },
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          color: colors.onSurfaceVariant,
          formatter: (value) => formatShortDate(value),
          interval: Math.max(0, Math.ceil((dates.length || 1) / 6) - 1),
        },
        axisLine: { lineStyle: { color: colors.surfaceContainerHighest } },
      },
      yAxis: {
        type: 'value',
        name: 'Peso (kg)',
        nameTextStyle: { color: colors.onSurfaceVariant },
        axisLabel: { color: colors.onSurfaceVariant },
        splitLine: { lineStyle: { color: colors.surfaceContainerHighest } },
      },
      series: [
        {
          name: 'Peso corporal',
          type: 'line',
          smooth: false,
          showSymbol: true,
          symbolSize: 6,
          connectNulls: false,
          data: values,
          lineStyle: { width: 2, color: colors.secondary },
          itemStyle: { color: colors.secondary },
        },
      ],
    }
  }, [weightChartHistory])

  const exerciseOverlayOption = useMemo(() => {
    const dates = exerciseTimelineSeries.dates || []
    if (dates.length === 0) {
      return {
        backgroundColor: 'transparent',
        animation: false,
        xAxis: { type: 'category', data: [] },
        yAxis: [{ type: 'value' }],
        series: [],
      }
    }

    const series = (exerciseTimelineSeries.series || []).map((serie) => ({
      name: serie.id,
      type: 'line',
      yAxisIndex: serie.yAxisIndex,
      showSymbol: true,
      symbolSize: 6,
      connectNulls: false,
      smooth: false,
      data: serie.data,
      lineStyle: { width: 2, color: serie.color },
      itemStyle: { color: serie.color },
    }))

    return {
      backgroundColor: 'transparent',
      animation: false,
      legend: {
        top: 0,
        textStyle: { color: colors.onSurfaceVariant, fontSize: 11 },
      },
      grid: { top: 36, right: 96, bottom: 50, left: 56 },
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          if (!Array.isArray(params) || params.length === 0) return ''
          const date = params[0].axisValue
          const lines = params
            .filter((p) => p.data != null)
            .map((p) => {
              const kind = p.seriesName === 'Peso real' ? 'weight' : p.seriesName === 'Reps reales' ? 'reps' : 'feeling'
              return `${p.marker} <b>${p.seriesName}:</b> ${formatOverlayRealValue(kind, p.data)}`
            })
          return [date, ...lines].join('<br/>')
        },
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          color: colors.onSurfaceVariant,
          formatter: (value) => formatShortDate(value),
          interval: Math.max(0, Math.ceil((dates.length || 1) / 8) - 1),
        },
        axisLine: { lineStyle: { color: colors.surfaceContainerHighest } },
      },
      yAxis: [
        {
          type: 'value',
          name: 'Peso (kg)',
          position: 'left',
          axisLabel: { color: colors.onSurfaceVariant },
          nameTextStyle: { color: colors.onSurfaceVariant },
          splitLine: { lineStyle: { color: colors.surfaceContainerHighest } },
        },
        {
          type: 'value',
          name: 'Reps',
          position: 'right',
          offset: 0,
          axisLabel: { color: colors.onSurfaceVariant },
          nameTextStyle: { color: colors.onSurfaceVariant },
          splitLine: { show: false },
        },
        {
          type: 'value',
          name: 'Feeling',
          position: 'right',
          offset: 56,
          min: 1,
          max: 4,
          interval: 1,
          axisLabel: {
            color: colors.onSurfaceVariant,
            formatter: (v) => {
              const n = Number(v)
              return ({ 1: 'failed', 2: 'hard', 3: 'good', 4: 'easy' }[n] || `${v}`)
            },
          },
          nameTextStyle: { color: colors.onSurfaceVariant },
          splitLine: { show: false },
        },
      ],
      series,
    }
  }, [exerciseTimelineSeries])

  const getAdherenceCellStyle = (count) => {
    if (count == null) {
      return {
        ...styles.heatCell,
        backgroundColor: 'transparent',
        border: '1px solid transparent',
      }
    }

    if (count <= 0) {
      return {
        ...styles.heatCell,
        backgroundColor: 'transparent',
        border: `1px dashed ${colors.surfaceContainerHighest}`,
      }
    }

    if (count === 1) {
      return {
        ...styles.heatCell,
        backgroundColor: '#7ee787',
        border: '1px solid rgba(126, 231, 135, 0.65)',
      }
    }

    return {
      ...styles.heatCell,
      backgroundColor: '#1f9d3a',
      border: '1px solid rgba(31, 157, 58, 0.95)',
      boxShadow: '0 0 0 1px rgba(31, 157, 58, 0.22) inset',
    }
  }

  const topExercisesOption = useMemo(() => {
    const items = frequency.slice(0, 8)
    return {
      backgroundColor: 'transparent',
      animation: false,
      grid: { top: 14, right: 18, bottom: 48, left: 120 },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: {
        type: 'value',
        axisLabel: { color: colors.onSurfaceVariant },
        splitLine: { lineStyle: { color: colors.surfaceContainerHighest } },
      },
      yAxis: {
        type: 'category',
        data: items.map((item) => item.exercise),
        axisLabel: { color: colors.onSurfaceVariant, width: 110, overflow: 'truncate' },
      },
      series: [
        {
          type: 'bar',
          data: items.map((item) => item.total_sets),
          itemStyle: { color: colors.primary, borderRadius: [0, 4, 4, 0] },
          label: { show: true, position: 'right', color: colors.onSurfaceVariant },
        },
      ],
    }
  }, [frequency])

  const timeRanges = [
    { id: '3m', label: '3M' },
    { id: '6m', label: '6M' },
    { id: '12m', label: '12M' },
  ]

  // =====================
  // DESKTOP VERSION
  // =====================
  const DesktopView = () => (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar profile={profile} activeItem="analytics" onNavigate={onNavigate} />
      
      <main style={styles.desktopMain}>
        <div style={styles.desktopContent}>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>Seguimiento de tu progreso</p>

          <div style={styles.rangeTabs}>
            {timeRanges.map((range) => (
              <button key={range.id} onClick={() => setTimeRange(range.id)} style={timeRange === range.id ? styles.rangeTabActive : styles.rangeTab}>
                {range.label}
              </button>
            ))}
          </div>

          {loading && <div style={styles.infoBox}>Cargando métricas del backend...</div>}
          {error && <div style={styles.errorBox}>{error}</div>}

          {/* Stats Cards */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <span style={styles.statNumber}>{stats.totalWorkouts}</span>
              <span style={styles.statLabel}>Entrenos Totales</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statNumberSecondary}>{stats.thisMonth}</span>
              <span style={styles.statLabel}>Este Mes</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statNumber}>{stats.totalHours}h</span>
              <span style={styles.statLabel}>Horas Totales</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statNumberSecondary}>{stats.avgDuration}</span>
              <span style={styles.statLabel}>Duración Promedio</span>
            </div>
          </div>

          <div style={styles.chartsGrid}>
            <div style={styles.chartCard}>
              <h3 style={styles.sectionTitle}>Peso corporal</h3>
              <div style={styles.weightFormRow}>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder="Peso (kg)"
                  style={styles.weightInput}
                />
                <input
                  type="date"
                  value={weightDate}
                  onChange={(e) => setWeightDate(e.target.value)}
                  style={styles.weightDateInput}
                />
                <button type="button" onClick={handleAddWeight} disabled={savingWeight} style={{ ...styles.weightSaveButton, opacity: savingWeight ? 0.7 : 1 }}>
                  {savingWeight ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
              <div style={styles.nivoChartLarge}>
                {weightLineData.length > 0 ? (
                  <ReactECharts
                    option={weightChartOption}
                    style={{ height: '100%', width: '100%' }}
                    notMerge
                    lazyUpdate
                  />
                ) : (
                  <span style={styles.emptyText}>Sin registros de peso</span>
                )}
              </div>

              {weightChartInsights && (
                <div style={styles.insightGrid}>
                  <div style={styles.insightCard}>
                    <span style={styles.insightLabel}>Último</span>
                    <span style={styles.insightValue}>{weightChartInsights.latest.toFixed(2)} kg</span>
                    <span style={styles.insightMeta}>{weightChartInsights.latestDate}</span>
                  </div>
                  <div style={styles.insightCard}>
                    <span style={styles.insightLabel}>Mínimo</span>
                    <span style={styles.insightValue}>{weightChartInsights.min.toFixed(2)} kg</span>
                  </div>
                  <div style={styles.insightCard}>
                    <span style={styles.insightLabel}>Máximo</span>
                    <span style={styles.insightValue}>{weightChartInsights.max.toFixed(2)} kg</span>
                  </div>
                </div>
              )}

              {weightChartStartEnd.start && (
                <div style={styles.weightChartRangeLabel}>
                  Mostrando últimos {weightChartHistory.length} registros: {weightChartStartEnd.start} → {weightChartStartEnd.end}
                </div>
              )}

              {weightMinMax.zoomMode === 'zoomed_out' && (
                <div style={styles.weightZoomHint}>
                  Zoom ajustado automáticamente por variación alta de peso.
                </div>
              )}

              {latestWeightEntry && (
                <div style={styles.latestWeightBadge}>
                  Último: {latestWeightEntry.weight} kg ({latestWeightEntry.date})
                </div>
              )}

              {recentWeightEntries.length > 0 && (
                <div style={styles.weightList}>
                  {recentWeightEntries.map((entry, idx) => (
                    <div key={`${entry.date}-${idx}`} style={styles.weightListItem}>
                      <span style={styles.weightListDate}>{entry.date}</span>
                      <span style={styles.weightListValue}>{entry.weight} kg</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={styles.chartCard}>
            <h3 style={styles.sectionTitle}>Adherencia</h3>
            <div style={styles.heatmapScroll}>
              <div style={styles.heatmapGrid}>
                {heatmapColumns.map((week, weekIdx) => (
                  <div key={`week-${weekIdx}`} style={styles.heatmapWeekCol}>
                    {week.map((day) => (
                      <div
                        key={day.date}
                        title={day.count == null ? '' : `${day.date} · ${day.count} entreno${day.count === 1 ? '' : 's'}`}
                        style={getAdherenceCellStyle(day.count)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div style={styles.adherenceLegendRow}>
              <span style={styles.adherenceLegendItem}><span style={{ ...styles.adherenceLegendSwatch, backgroundColor: 'transparent', border: `1px dashed ${colors.surfaceContainerHighest}` }} />No entrenó</span>
              <span style={styles.adherenceLegendItem}><span style={{ ...styles.adherenceLegendSwatch, backgroundColor: '#7ee787', border: '1px solid rgba(126, 231, 135, 0.65)' }} />Entrenó</span>
              <span style={styles.adherenceLegendItem}><span style={{ ...styles.adherenceLegendSwatch, backgroundColor: '#1f9d3a', border: '1px solid rgba(31, 157, 58, 0.95)' }} />Entrenó 2+</span>
            </div>
          </div>

          <div style={styles.chartCard}>
            <h3 style={styles.sectionTitle}>Top ejercicios</h3>
            {frequency.length === 0 ? (
              <span style={styles.emptyText}>Sin datos suficientes</span>
            ) : (
              <div style={styles.nivoChartMedium}>
                <ReactECharts option={topExercisesOption} style={{ height: '100%', width: '100%' }} notMerge lazyUpdate />
              </div>
            )}
          </div>

          <div style={styles.chartCard}>
            <h3 style={styles.sectionTitle}>Progreso temporal superpuesto (peso/reps/feeling)</h3>

            <div style={styles.exerciseProgressControls}>
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                style={styles.exerciseSelect}
              >
                {frequency.map((item) => (
                  <option key={item.exercise} value={item.exercise}>{item.exercise}</option>
                ))}
              </select>
              <span style={styles.exerciseProgressMeta}>
                {loadingExerciseProgress ? 'Cargando...' : `${exerciseProgressPoints.length} sets reales`}
              </span>
            </div>

            <div style={styles.seriesToggleRow}>
              <button type="button" onClick={() => setProgressSeriesVisibility((prev) => ({ ...prev, weight: !prev.weight }))} style={progressSeriesVisibility.weight ? styles.seriesToggleActive : styles.seriesToggle}>Peso</button>
              <button type="button" onClick={() => setProgressSeriesVisibility((prev) => ({ ...prev, reps: !prev.reps }))} style={progressSeriesVisibility.reps ? styles.seriesToggleActive : styles.seriesToggle}>Reps</button>
              <button type="button" onClick={() => setProgressSeriesVisibility((prev) => ({ ...prev, feeling: !prev.feeling }))} style={progressSeriesVisibility.feeling ? styles.seriesToggleActive : styles.seriesToggle}>Feeling</button>
            </div>

            <div style={styles.nivoChartLarge}>
              {exerciseTimelineSeries.series.length > 0 ? (
                <ReactECharts
                  option={exerciseOverlayOption}
                  style={{ height: '100%', width: '100%' }}
                  notMerge
                  lazyUpdate
                />
              ) : (
                <span style={styles.emptyText}>No hay suficientes datos reales para armar el gráfico temporal</span>
              )}
            </div>

            <div style={styles.progressHelpText}>
              Escalas independientes en el mismo gráfico: Peso (kg), Reps y Feeling.
            </div>

            {overlaySeriesInsights.length > 0 && (
              <div style={styles.insightGrid}>
                {overlaySeriesInsights.map((insight) => (
                  <div key={insight.id} style={styles.insightCard}>
                    <span style={styles.insightLabel}>{insight.id}</span>
                    <span style={styles.insightValue}>{formatOverlayRealValue(insight.kind, insight.latest)}</span>
                    <span style={styles.insightMeta}>{insight.latestDate}</span>
                    <span style={styles.insightSubMeta}>
                      Rango real: {formatOverlayRealValue(insight.kind, insight.min)} → {formatOverlayRealValue(insight.kind, insight.max)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sessions List */}
            <div style={styles.sessionsList}>
              <h3 style={styles.sectionTitle}>Sesiones Recientes</h3>
              {sessionsView.length === 0 && <span style={styles.emptyText}>Sin sesiones registradas</span>}
              {sessionsView.map((session) => (
                <div key={session.id} style={styles.sessionItem}>
                <div style={styles.sessionLeft}>
                  <Badge label={session.day} variant={session.completed ? 'primary' : 'secondary'} />
                  <span style={styles.sessionDate}>{session.date}</span>
                </div>
                <div style={styles.sessionRight}>
                  <span style={styles.sessionMeta}>{session.duration} • {session.completed ? 'Completado' : 'Incompleto'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )

  // =====================
  // MOBILE VERSION
  // =====================
  const MobileView = () => (
    <div style={{ minHeight: '100vh', backgroundColor: colors.background, fontFamily: typography.fontFamily.body }}>
      <header style={styles.mobileHeader}>
        <span style={styles.mobileTitle}>Dashboard</span>
        <div style={styles.profileIcon}>
          <img src={profile?.image || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=40&h=40&fit=crop&crop=face'} alt="Profile" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
        </div>
      </header>

        <main style={styles.mobileMain}>
          <div style={styles.mobileTabs}>
            {timeRanges.map((range) => (
              <button key={range.id} onClick={() => setTimeRange(range.id)} style={timeRange === range.id ? styles.mobileTabActive : styles.mobileTab}>
                {range.label}
              </button>
            ))}
          </div>

          {loading && <div style={styles.infoBox}>Cargando métricas del backend...</div>}
          {error && <div style={styles.errorBox}>{error}</div>}

          {/* Stats */}
          <div style={styles.mobileStats}>
          <div style={styles.mobileStatCard}>
            <span style={styles.mobileStatNumber}>{stats.totalWorkouts}</span>
            <span style={styles.mobileStatLabel}>Entrenos</span>
          </div>
          <div style={styles.mobileStatCard}>
            <span style={styles.mobileStatNumberSecondary}>{stats.thisMonth}</span>
            <span style={styles.mobileStatLabel}>Este Mes</span>
          </div>
            <div style={styles.mobileStatCard}>
              <span style={styles.mobileStatNumber}>{stats.totalHours}h</span>
              <span style={styles.mobileStatLabel}>Horas</span>
            </div>
          </div>

         <div style={styles.chartCard}>
           <h3 style={styles.sectionTitle}>Adherencia</h3>
           <div style={styles.heatmapScroll}>
             <div style={styles.heatmapGrid}>
               {heatmapColumns.map((week, weekIdx) => (
                 <div key={`mobile-week-${weekIdx}`} style={styles.heatmapWeekCol}>
                   {week.map((day) => (
                     <div
                       key={day.date}
                       title={day.count == null ? '' : `${day.date} · ${day.count} entreno${day.count === 1 ? '' : 's'}`}
                       style={getAdherenceCellStyle(day.count)}
                     />
                   ))}
                 </div>
               ))}
             </div>
           </div>
           <div style={styles.adherenceLegendRow}>
             <span style={styles.adherenceLegendItem}><span style={{ ...styles.adherenceLegendSwatch, backgroundColor: 'transparent', border: `1px dashed ${colors.surfaceContainerHighest}` }} />No entrenó</span>
             <span style={styles.adherenceLegendItem}><span style={{ ...styles.adherenceLegendSwatch, backgroundColor: '#7ee787', border: '1px solid rgba(126, 231, 135, 0.65)' }} />Entrenó</span>
             <span style={styles.adherenceLegendItem}><span style={{ ...styles.adherenceLegendSwatch, backgroundColor: '#1f9d3a', border: '1px solid rgba(31, 157, 58, 0.95)' }} />Entrenó 2+</span>
           </div>
         </div>

         <div style={styles.chartCard}>
           <h3 style={styles.sectionTitle}>Top ejercicios</h3>
           {frequency.length === 0 ? (
             <span style={styles.emptyText}>Sin datos suficientes</span>
           ) : (
             <div style={styles.nivoChartMedium}>
               <ReactECharts option={topExercisesOption} style={{ height: '100%', width: '100%' }} notMerge lazyUpdate />
             </div>
           )}
         </div>

         <div style={styles.chartCard}>
           <h3 style={styles.sectionTitle}>Progreso temporal superpuesto</h3>
           <div style={styles.exerciseProgressControls}>
             <select
               value={selectedExercise}
               onChange={(e) => setSelectedExercise(e.target.value)}
               style={styles.exerciseSelect}
             >
               {frequency.map((item) => (
                 <option key={item.exercise} value={item.exercise}>{item.exercise}</option>
               ))}
             </select>
             <span style={styles.exerciseProgressMeta}>
               {loadingExerciseProgress ? 'Cargando...' : `${exerciseProgressPoints.length} sets reales`}
             </span>
           </div>

            <div style={styles.seriesToggleRow}>
              <button type="button" onClick={() => setProgressSeriesVisibility((prev) => ({ ...prev, weight: !prev.weight }))} style={progressSeriesVisibility.weight ? styles.seriesToggleActive : styles.seriesToggle}>Peso</button>
              <button type="button" onClick={() => setProgressSeriesVisibility((prev) => ({ ...prev, reps: !prev.reps }))} style={progressSeriesVisibility.reps ? styles.seriesToggleActive : styles.seriesToggle}>Reps</button>
              <button type="button" onClick={() => setProgressSeriesVisibility((prev) => ({ ...prev, feeling: !prev.feeling }))} style={progressSeriesVisibility.feeling ? styles.seriesToggleActive : styles.seriesToggle}>Feeling</button>
            </div>

            <div style={styles.nivoChartLarge}>
              {exerciseTimelineSeries.series.length > 0 ? (
                <ReactECharts
                  option={exerciseOverlayOption}
                  style={{ height: '100%', width: '100%' }}
                  notMerge
                  lazyUpdate
                />
              ) : (
                <span style={styles.emptyText}>No hay suficientes datos reales para armar el gráfico temporal</span>
              )}
            </div>

            <div style={styles.progressHelpText}>
              Escalas independientes en el mismo gráfico: Peso (kg), Reps y Feeling.
            </div>

            {overlaySeriesInsights.length > 0 && (
              <div style={styles.insightGrid}>
                {overlaySeriesInsights.map((insight) => (
                  <div key={insight.id} style={styles.insightCard}>
                    <span style={styles.insightLabel}>{insight.id}</span>
                    <span style={styles.insightValue}>{formatOverlayRealValue(insight.kind, insight.latest)}</span>
                    <span style={styles.insightMeta}>{insight.latestDate}</span>
                    <span style={styles.insightSubMeta}>
                      Rango real: {formatOverlayRealValue(insight.kind, insight.min)} → {formatOverlayRealValue(insight.kind, insight.max)}
                    </span>
                  </div>
                ))}
              </div>
            )}
         </div>

         <div style={styles.chartCard}>
           <h3 style={styles.sectionTitle}>Peso corporal</h3>
           <div style={styles.weightFormColumn}>
             <input
               type="number"
               step="0.1"
               min="0"
               value={newWeight}
               onChange={(e) => setNewWeight(e.target.value)}
               placeholder="Peso (kg)"
               style={styles.weightInput}
             />
             <input
               type="date"
               value={weightDate}
               onChange={(e) => setWeightDate(e.target.value)}
               style={styles.weightDateInput}
             />
             <button type="button" onClick={handleAddWeight} disabled={savingWeight} style={{ ...styles.weightSaveButton, opacity: savingWeight ? 0.7 : 1 }}>
               {savingWeight ? 'Guardando...' : 'Guardar'}
             </button>
           </div>

            <div style={styles.nivoChartMedium}>
               {weightLineData.length > 0 ? (
                 <ReactECharts
                  option={weightChartOption}
                  style={{ height: '100%', width: '100%' }}
                  notMerge
                  lazyUpdate
                />
              ) : (
                <span style={styles.emptyText}>Sin registros de peso</span>
              )}
            </div>

            {weightChartInsights && (
              <div style={styles.insightGrid}>
                <div style={styles.insightCard}>
                  <span style={styles.insightLabel}>Último</span>
                  <span style={styles.insightValue}>{weightChartInsights.latest.toFixed(2)} kg</span>
                  <span style={styles.insightMeta}>{weightChartInsights.latestDate}</span>
                </div>
                <div style={styles.insightCard}>
                  <span style={styles.insightLabel}>Mínimo</span>
                  <span style={styles.insightValue}>{weightChartInsights.min.toFixed(2)} kg</span>
                </div>
                <div style={styles.insightCard}>
                  <span style={styles.insightLabel}>Máximo</span>
                  <span style={styles.insightValue}>{weightChartInsights.max.toFixed(2)} kg</span>
                </div>
              </div>
            )}

            {latestWeightEntry && (
              <div style={styles.latestWeightBadgeMobile}>
                Último: {latestWeightEntry.weight} kg ({latestWeightEntry.date})
              </div>
            )}

            {recentWeightEntries.length > 0 && (
              <div style={styles.weightListMobile}>
                {recentWeightEntries.map((entry, idx) => (
                  <div key={`mobile-${entry.date}-${idx}`} style={styles.weightListItem}>
                    <span style={styles.weightListDate}>{entry.date}</span>
                    <span style={styles.weightListValue}>{entry.weight} kg</span>
                  </div>
                ))}
              </div>
            )}
         </div>

        {/* Sessions */}
         <div style={styles.mobileSessions}>
          {sessionsView.length === 0 && <span style={styles.emptyText}>Sin sesiones registradas</span>}
          {sessionsView.map((session) => (
            <div key={session.id} style={styles.mobileSessionItem}>
              <div style={styles.mobileSessionLeft}>
                <span style={styles.mobileDayNumber}>{session.day}</span>
              </div>
              <div style={styles.mobileSessionInfo}>
                <span style={styles.mobileSessionDate}>{session.date}</span>
                <span style={styles.mobileSessionMeta}>{session.duration} • {session.completed ? 'Completado' : 'Incompleto'}</span>
              </div>
            </div>
          ))}
        </div>
      </main>

      <BottomNav activeItem="analytics" onNavigate={onNavigate} />
    </div>
  )

  return (
    <div className="analytics-container">
      {isDesktop ? DesktopView() : MobileView()}
    </div>
  )
}

const styles = {
  // Shared
  title: { fontSize: '3rem', fontFamily: typography.fontFamily.heading, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '0.5rem' },
  subtitle: { color: colors.onSurfaceVariant, fontSize: '1rem', marginBottom: '2rem' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' },
  statCard: { backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.lg, padding: '1.25rem', textAlign: 'center' },
  statNumber: { fontSize: '2.5rem', fontFamily: typography.fontFamily.heading, fontWeight: 900, color: colors.primary, display: 'block' },
  statNumberSecondary: { fontSize: '2.5rem', fontFamily: typography.fontFamily.heading, fontWeight: 900, color: colors.secondary, display: 'block' },
  statLabel: { fontSize: '0.75rem', color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.05em' },
  chartsGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1rem' },
  chartCard: { backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.lg, padding: '1rem', marginBottom: '1rem' },
  nivoChartLarge: { height: '360px', backgroundColor: colors.surfaceContainerHigh, border: `1px solid ${colors.surfaceContainerHighest}`, borderRadius: borderRadius.md, padding: '0.35rem' },
  nivoChartMedium: { height: '300px', backgroundColor: colors.surfaceContainerHigh, border: `1px solid ${colors.surfaceContainerHighest}`, borderRadius: borderRadius.md, padding: '0.35rem' },
  adherenceLegendRow: { marginTop: '0.55rem', display: 'flex', alignItems: 'center', gap: '0.7rem', flexWrap: 'wrap' },
  adherenceLegendItem: { display: 'inline-flex', alignItems: 'center', gap: '0.28rem', fontSize: '0.67rem', color: colors.onSurfaceVariant },
  adherenceLegendSwatch: { width: '12px', height: '12px', borderRadius: '3px', border: '1px solid transparent', display: 'inline-block' },
  nivoChartSmall: { height: '220px', backgroundColor: colors.surfaceContainerLow, border: `1px solid ${colors.surfaceContainerHighest}`, borderRadius: borderRadius.sm, padding: '0.2rem' },
  nivoTooltip: { backgroundColor: colors.surfaceContainerHigh, border: `1px solid ${colors.surfaceContainerHighest}`, borderRadius: borderRadius.sm, padding: '0.4rem 0.55rem', fontSize: '0.74rem', color: colors.onSurface },
  weightChartRangeLabel: { marginTop: '0.55rem', fontSize: '0.68rem', color: colors.onSurfaceVariant },
  weightZoomHint: { marginTop: '0.2rem', fontSize: '0.65rem', color: colors.secondary, fontWeight: 600 },
  weightFormRow: { display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.5rem', marginBottom: '0.75rem' },
  weightFormColumn: { display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' },
  weightInput: { backgroundColor: colors.surfaceContainerHigh, border: `1px solid ${colors.surfaceContainerHighest}`, borderRadius: borderRadius.md, padding: '0.55rem 0.7rem', color: colors.onSurface, fontSize: '0.82rem', outline: 'none' },
  weightDateInput: { backgroundColor: colors.surfaceContainerHigh, border: `1px solid ${colors.surfaceContainerHighest}`, borderRadius: borderRadius.md, padding: '0.55rem 0.7rem', color: colors.onSurface, fontSize: '0.82rem', outline: 'none' },
  weightSaveButton: { border: 'none', borderRadius: borderRadius.md, backgroundColor: colors.primary, color: colors.onPrimaryFixed, padding: '0.55rem 0.85rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' },
  latestWeightBadge: { marginTop: '0.75rem', fontSize: '0.75rem', color: colors.onSurface, backgroundColor: colors.surfaceContainerHigh, border: `1px solid ${colors.surfaceContainerHighest}`, borderRadius: borderRadius.full, padding: '0.35rem 0.6rem', display: 'inline-block' },
  latestWeightBadgeMobile: { marginTop: '0.75rem', fontSize: '0.74rem', color: colors.onSurface, backgroundColor: colors.surfaceContainerHigh, border: `1px solid ${colors.surfaceContainerHighest}`, borderRadius: borderRadius.full, padding: '0.35rem 0.6rem', display: 'inline-block' },
  weightList: { marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' },
  weightListMobile: { marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr', gap: '0.45rem' },
  weightListItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surfaceContainerHigh, border: `1px solid ${colors.surfaceContainerHighest}`, borderRadius: borderRadius.md, padding: '0.4rem 0.55rem' },
  weightListDate: { fontSize: '0.7rem', color: colors.onSurfaceVariant },
  weightListValue: { fontSize: '0.78rem', color: colors.onSurface, fontWeight: 700 },
  topExercisesList: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  topExerciseItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.6rem', borderRadius: borderRadius.md, backgroundColor: colors.surfaceContainerHigh },
  topExerciseName: { fontSize: '0.8rem', color: colors.onSurface },
  topExerciseCount: { fontSize: '0.75rem', color: colors.onSurfaceVariant, fontWeight: 700 },
  exerciseProgressControls: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.7rem', marginBottom: '0.75rem', flexWrap: 'wrap' },
  exerciseSelect: { backgroundColor: colors.surfaceContainerHigh, border: `1px solid ${colors.surfaceContainerHighest}`, borderRadius: borderRadius.md, padding: '0.5rem 0.65rem', color: colors.onSurface, fontSize: '0.78rem', minWidth: '220px', maxWidth: '100%' },
  exerciseProgressMeta: { fontSize: '0.72rem', color: colors.onSurfaceVariant, fontWeight: 600 },
  exerciseChartsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' },
  exerciseMiniChartCard: { backgroundColor: colors.surfaceContainerHigh, border: `1px solid ${colors.surfaceContainerHighest}`, borderRadius: borderRadius.md, padding: '0.65rem', marginBottom: '0.6rem' },
  exerciseMiniChartTitle: { fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: colors.onSurfaceVariant, marginBottom: '0.45rem', fontWeight: 700 },
  insightGrid: { marginTop: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.5rem' },
  insightCard: { display: 'flex', flexDirection: 'column', gap: '0.2rem', backgroundColor: colors.surfaceContainerHigh, border: `1px solid ${colors.surfaceContainerHighest}`, borderRadius: borderRadius.md, padding: '0.52rem 0.62rem' },
  insightLabel: { fontSize: '0.66rem', color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 },
  insightValue: { fontSize: '0.8rem', color: colors.onSurface, fontWeight: 800 },
  insightMeta: { fontSize: '0.68rem', color: colors.onSurfaceVariant },
  insightSubMeta: { fontSize: '0.66rem', color: colors.onSurfaceVariant },
  seriesToggleRow: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.55rem' },
  seriesToggle: { border: 'none', borderRadius: borderRadius.full, backgroundColor: colors.surfaceContainerLow, color: colors.onSurfaceVariant, padding: '0.32rem 0.58rem', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' },
  seriesToggleActive: { border: 'none', borderRadius: borderRadius.full, backgroundColor: colors.primary, color: colors.onPrimaryFixed, padding: '0.32rem 0.58rem', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' },
  progressHelpText: { marginTop: '0.45rem', fontSize: '0.68rem', color: colors.onSurfaceVariant },
  heatmapScroll: { overflowX: 'auto', paddingBottom: '0.25rem' },
  heatmapGrid: { display: 'flex', gap: '0.22rem', minWidth: 'fit-content' },
  heatmapWeekCol: { display: 'grid', gridTemplateRows: 'repeat(7, 14px)', gap: '0.22rem' },
  heatCell: { width: '14px', height: '14px', borderRadius: '3px' },
  heatLegend: { marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', justifyContent: 'flex-end' },
  heatLegendItem: { display: 'inline-flex', alignItems: 'center', gap: '0.25rem' },
  legendText: { fontSize: '0.65rem', color: colors.onSurfaceVariant },
  legendCell: { width: '10px', height: '10px', borderRadius: '2px' },
  emptyText: { fontSize: '0.75rem', color: colors.onSurfaceVariant },
  infoBox: { backgroundColor: colors.surfaceContainerLow, border: `1px solid ${colors.surfaceContainerHighest}`, color: colors.onSurfaceVariant, borderRadius: borderRadius.md, padding: '0.75rem 0.9rem', marginBottom: '1rem', fontSize: '0.82rem' },
  errorBox: { backgroundColor: '#3b0f1a', border: '1px solid #772038', color: '#ffb4c8', borderRadius: borderRadius.md, padding: '0.75rem 0.9rem', marginBottom: '1rem', fontSize: '0.82rem' },
  rangeTabs: { display: 'flex', gap: '0.5rem', marginBottom: '1rem' },
  rangeTab: { border: 'none', borderRadius: borderRadius.full, backgroundColor: colors.surfaceContainerLow, color: colors.onSurfaceVariant, padding: '0.4rem 0.8rem', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' },
  rangeTabActive: { border: 'none', borderRadius: borderRadius.full, backgroundColor: colors.primary, color: colors.onPrimaryFixed, padding: '0.4rem 0.8rem', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' },
  sectionTitle: { fontSize: '0.875rem', fontFamily: typography.fontFamily.heading, fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' },
  sessionsList: { marginBottom: '2rem' },
  sessionItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.md, marginBottom: '0.75rem' },
  sessionLeft: { display: 'flex', alignItems: 'center', gap: '1rem' },
  sessionDate: { fontSize: '0.875rem', color: colors.onSurfaceVariant },
  sessionRight: { display: 'flex', alignItems: 'center' },
  sessionMeta: { fontSize: '0.75rem', color: colors.onSurfaceVariant },

  // Desktop
  desktopMain: { marginLeft: '280px', flex: 1, minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '2rem' },
  desktopContent: { maxWidth: '900px', width: '100%' },

  // Mobile
  mobileHeader: { position: 'fixed', top: 0, left: 0, right: 0, height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem', backgroundColor: colors.background, borderBottom: `1px solid ${colors.surfaceContainerHighest}`, zIndex: 50 },
  mobileTitle: { fontFamily: typography.fontFamily.heading, fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: colors.onSurface },
  profileIcon: { width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: `2px solid ${colors.surfaceContainerHighest}` },
  mobileMain: { padding: '80px 1rem 100px' },
  mobileStats: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' },
  mobileStatCard: { backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.md, padding: '1rem', textAlign: 'center' },
  mobileStatNumber: { fontSize: '1.5rem', fontFamily: typography.fontFamily.heading, fontWeight: 900, color: colors.primary, display: 'block' },
  mobileStatNumberSecondary: { fontSize: '1.5rem', fontFamily: typography.fontFamily.heading, fontWeight: 900, color: colors.secondary, display: 'block' },
  mobileStatLabel: { fontSize: '0.625rem', color: colors.onSurfaceVariant, textTransform: 'uppercase' },
  mobileTabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto' },
  mobileTab: { padding: '0.5rem 1rem', background: 'none', border: 'none', color: colors.onSurfaceVariant, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', borderRadius: borderRadius.full, backgroundColor: colors.surfaceContainerLow },
  mobileTabActive: { padding: '0.5rem 1rem', background: colors.primary, border: 'none', color: colors.onPrimaryFixed, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', borderRadius: borderRadius.full },
  mobileSessions: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  mobileSessionItem: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.md },
  mobileSessionLeft: { minWidth: '60px' },
  mobileDayNumber: { fontSize: '1rem', fontFamily: typography.fontFamily.heading, fontWeight: 700, color: colors.primary },
  mobileSessionInfo: { flex: 1 },
  mobileSessionDate: { fontSize: '0.875rem', fontWeight: 600, display: 'block' },
  mobileSessionMeta: { fontSize: '0.75rem', color: colors.onSurfaceVariant },
}

export default Analytics
