import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { colors, typography, borderRadius } from '../../styles/tokens'
import { Sidebar, BottomNav } from '../../components/navigation'
import { Badge } from '../../components/ui'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { analyticsAPI, sessionsAPI, weightAPI } from '../../utils/api'
import ReactECharts from 'echarts-for-react'

const Analytics = ({ onBack, onNavigate }) => {
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

      const results = await Promise.allSettled([
        analyticsAPI.getSummary(profile.id),
        analyticsAPI.getStats(profile.id, startDate, endDate),
        analyticsAPI.getFrequency(profile.id, 8),
        analyticsAPI.getWeightHistory(profile.id, 60),
        analyticsAPI.getAdherence(profile.id, startDate, endDate),
        sessionsAPI.list(profile.id, 8, 0),
      ])

      const [
        summaryRes,
        statsRes,
        freqRes,
        weightRes,
        adherenceRes,
        sessionsRes,
      ] = results.map((r) => (r.status === 'fulfilled' ? r.value : undefined))

      results.forEach((r) => {
        if (r.status === 'rejected') {
          console.warn('[Analytics]', r.reason)
        }
      })

      const allRejected = results.every((r) => r.status === 'rejected')
      if (allRejected) {
        setError('No pudimos cargar analytics del backend')
      }

      if (summaryRes !== undefined) setSummary(summaryRes)
      if (statsRes !== undefined) setStatsData(statsRes)
      if (freqRes !== undefined) {
        setFrequency(Array.isArray(freqRes) ? freqRes : [])
        const suggestedExercise = Array.isArray(freqRes) && freqRes.length > 0 ? freqRes[0].exercise : ''
        setSelectedExercise((prev) => prev || suggestedExercise)
      }
      if (weightRes !== undefined) setWeightHistory(Array.isArray(weightRes) ? weightRes : [])
      if (adherenceRes !== undefined) setAdherence(adherenceRes || { days: [], max_count: 0 })
      if (sessionsRes !== undefined) setSessions(Array.isArray(sessionsRes) ? sessionsRes : [])
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
      return { dates: [], weightSeries: [], repsSeries: [], feelingSeries: [], expectedRepsSeries: [], startDate: '', endDate: '' }
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
          expectedRepsValues: [],
        })
      }

      const bucket = byDate.get(key)
      if (typeof point.actual_weight === 'number') bucket.weightValues.push(Number(point.actual_weight))
      if (typeof point.actual_reps === 'number') bucket.repsValues.push(Number(point.actual_reps))
      if (point.feeling && feelingScoreMap[point.feeling] != null) bucket.feelingValues.push(Number(feelingScoreMap[point.feeling]))
      if (typeof point.planned_reps === 'number') bucket.expectedRepsValues.push(Number(point.planned_reps))
    })

    const dates = Array.from(byDate.keys()).sort()
    const clippedDates = dates.slice(-maxExercisePlotPoints)
    const daily = clippedDates.map((d) => {
      const row = byDate.get(d)

      const avg = (arr) => {
        if (!arr || arr.length === 0) return null
        return arr.reduce((sum, val) => sum + val, 0) / arr.length
      }

      // For planned_reps, use the mode (most common value) since it's same across sets
      const mode = (arr) => {
        if (!arr || arr.length === 0) return null
        const freq = {}
        let maxFreq = 0
        let modeVal = arr[0]
        arr.forEach((v) => {
          freq[v] = (freq[v] || 0) + 1
          if (freq[v] > maxFreq) { maxFreq = freq[v]; modeVal = v }
        })
        return modeVal
      }

      return {
        date: d,
        weightAvg: avg(row.weightValues),
        repsAvg: avg(row.repsValues),
        feelingAvg: avg(row.feelingValues),
        expectedReps: mode(row.expectedRepsValues),
      }
    })

    const weightSeries = daily.map((d) => (d.weightAvg != null ? Number(d.weightAvg.toFixed(2)) : null))
    const repsSeries = daily.map((d) => (d.repsAvg != null ? Number(d.repsAvg.toFixed(2)) : null))
    const feelingSeries = daily.map((d) => (d.feelingAvg != null ? Number(d.feelingAvg.toFixed(2)) : null))
    const expectedRepsSeries = daily.map((d) => (d.expectedReps != null ? Number(d.expectedReps) : null))

    return {
      dates: clippedDates,
      weightSeries,
      repsSeries,
      feelingSeries,
      expectedRepsSeries,
      startDate: clippedDates[0] || '',
      endDate: clippedDates[clippedDates.length - 1] || '',
    }
  }, [
    exerciseProgressPoints,
    feelingScoreMap,
  ])

  const formatInsightValue = (kind, rawValue) => {
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

  const computeInsights = (data, dates, label, kind) => {
    const raws = data.map(Number).filter((v) => !Number.isNaN(v))
    if (raws.length === 0) return null
    const latestIndex = [...data].map((v, idx) => ({ v, idx })).reverse().find((item) => item.v != null)?.idx ?? -1
    const latestValue = latestIndex >= 0 ? Number(data[latestIndex]) : null
    const latestDate = latestIndex >= 0 ? dates[latestIndex] : ''
    return {
      label,
      kind,
      latest: latestValue,
      latestDate,
      min: Math.min(...raws),
      max: Math.max(...raws),
    }
  }

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

  const chartWeightRepsOption = useMemo(() => {
    const dates = exerciseTimelineSeries.dates || []
    const hasWeight = exerciseTimelineSeries.weightSeries.some((v) => v != null)
    const hasReps = exerciseTimelineSeries.repsSeries.some((v) => v != null)
    if (dates.length === 0) {
      return {
        backgroundColor: 'transparent',
        animation: false,
        xAxis: { type: 'category', data: [] },
        yAxis: [{ type: 'value' }, { type: 'value' }],
        series: [],
      }
    }

    const series = []
    if (hasWeight) {
      series.push({
        name: 'Peso real',
        type: 'line',
        yAxisIndex: 0,
        showSymbol: true,
        symbolSize: 6,
        connectNulls: false,
        smooth: false,
        data: exerciseTimelineSeries.weightSeries,
        lineStyle: { width: 2, color: colors.secondary },
        itemStyle: { color: colors.secondary },
      })
    }
    if (hasReps) {
      series.push({
        name: 'Reps reales',
        type: 'line',
        yAxisIndex: 1,
        showSymbol: true,
        symbolSize: 6,
        connectNulls: false,
        smooth: false,
        data: exerciseTimelineSeries.repsSeries,
        lineStyle: { width: 2, color: colors.primary },
        itemStyle: { color: colors.primary },
      })
    }

    return {
      backgroundColor: 'transparent',
      animation: false,
      grid: { top: 24, right: 56, bottom: 48, left: 56 },
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          if (!Array.isArray(params) || params.length === 0) return ''
          const date = params[0].axisValue
          const lines = params
            .filter((p) => p.data != null)
            .map((p) => {
              const kind = p.seriesName === 'Peso real' ? 'weight' : 'reps'
              return `${p.marker} <b>${p.seriesName}:</b> ${formatInsightValue(kind, p.data)}`
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
          axisLabel: { color: colors.onSurfaceVariant },
          nameTextStyle: { color: colors.onSurfaceVariant },
          splitLine: { show: false },
        },
      ],
      series,
    }
  }, [exerciseTimelineSeries])

  const chartRepsExpectedOption = useMemo(() => {
    const dates = exerciseTimelineSeries.dates || []
    const hasReps = exerciseTimelineSeries.repsSeries.some((v) => v != null)
    const hasExpected = exerciseTimelineSeries.expectedRepsSeries.some((v) => v != null)
    if (dates.length === 0) {
      return {
        backgroundColor: 'transparent',
        animation: false,
        xAxis: { type: 'category', data: [] },
        yAxis: [{ type: 'value' }, { type: 'value' }],
        series: [],
      }
    }

    const series = []
    if (hasReps) {
      series.push({
        name: 'Reps reales',
        type: 'line',
        yAxisIndex: 0,
        showSymbol: true,
        symbolSize: 6,
        connectNulls: false,
        smooth: false,
        data: exerciseTimelineSeries.repsSeries,
        lineStyle: { width: 2, color: colors.primary },
        itemStyle: { color: colors.primary },
      })
    }
    if (hasExpected) {
      series.push({
        name: 'Reps esperadas',
        type: 'line',
        yAxisIndex: 1,
        showSymbol: true,
        symbolSize: 6,
        connectNulls: false,
        smooth: false,
        data: exerciseTimelineSeries.expectedRepsSeries,
        lineStyle: { width: 2, color: colors.secondary, type: 'dashed' },
        itemStyle: { color: colors.secondary },
      })
    }

    return {
      backgroundColor: 'transparent',
      animation: false,
      grid: { top: 24, right: 56, bottom: 48, left: 56 },
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          if (!Array.isArray(params) || params.length === 0) return ''
          const date = params[0].axisValue
          const lines = params
            .filter((p) => p.data != null)
            .map((p) => `${p.marker} <b>${p.seriesName}:</b> ${formatInsightValue('reps', p.data)}`)
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
          name: 'Reps',
          position: 'left',
          axisLabel: { color: colors.onSurfaceVariant },
          nameTextStyle: { color: colors.onSurfaceVariant },
          splitLine: { lineStyle: { color: colors.surfaceContainerHighest } },
        },
        {
          type: 'value',
          name: 'Reps esperadas',
          position: 'right',
          axisLabel: { color: colors.onSurfaceVariant },
          nameTextStyle: { color: colors.onSurfaceVariant },
          splitLine: { show: false },
        },
      ],
      series,
    }
  }, [exerciseTimelineSeries])

  const chartRepsFeelingOption = useMemo(() => {
    const dates = exerciseTimelineSeries.dates || []
    const hasReps = exerciseTimelineSeries.repsSeries.some((v) => v != null)
    const hasFeeling = exerciseTimelineSeries.feelingSeries.some((v) => v != null)
    if (dates.length === 0) {
      return {
        backgroundColor: 'transparent',
        animation: false,
        xAxis: { type: 'category', data: [] },
        yAxis: [{ type: 'value' }, { type: 'value' }],
        series: [],
      }
    }

    const series = []
    if (hasReps) {
      series.push({
        name: 'Reps reales',
        type: 'line',
        yAxisIndex: 0,
        showSymbol: true,
        symbolSize: 6,
        connectNulls: false,
        smooth: false,
        data: exerciseTimelineSeries.repsSeries,
        lineStyle: { width: 2, color: colors.primary },
        itemStyle: { color: colors.primary },
      })
    }
    if (hasFeeling) {
      series.push({
        name: 'Feeling',
        type: 'line',
        yAxisIndex: 1,
        showSymbol: true,
        symbolSize: 6,
        connectNulls: false,
        smooth: false,
        data: exerciseTimelineSeries.feelingSeries,
        lineStyle: { width: 2, color: colors.tertiary },
        itemStyle: { color: colors.tertiary },
      })
    }

    return {
      backgroundColor: 'transparent',
      animation: false,
      grid: { top: 24, right: 56, bottom: 48, left: 56 },
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          if (!Array.isArray(params) || params.length === 0) return ''
          const date = params[0].axisValue
          const lines = params
            .filter((p) => p.data != null)
            .map((p) => {
              const kind = p.seriesName === 'Feeling' ? 'feeling' : 'reps'
              return `${p.marker} <b>${p.seriesName}:</b> ${formatInsightValue(kind, p.data)}`
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
          name: 'Reps',
          position: 'left',
          axisLabel: { color: colors.onSurfaceVariant },
          nameTextStyle: { color: colors.onSurfaceVariant },
          splitLine: { lineStyle: { color: colors.surfaceContainerHighest } },
        },
        {
          type: 'value',
          name: 'Feeling',
          position: 'right',
          min: 0.5,
          max: 4.5,
          interval: 1,
          axisLabel: {
            color: colors.onSurfaceVariant,
            formatter: (v) => {
              const n = Math.round(Number(v))
              return ({ 1: 'failed', 2: 'hard', 3: 'good', 4: 'easy' }[n] || '')
            },
          },
          nameTextStyle: { color: colors.onSurfaceVariant },
          splitLine: { show: false },
        },
      ],
      series,
    }
  }, [exerciseTimelineSeries])

  const chart1Insights = useMemo(() => {
    const { dates, weightSeries, repsSeries } = exerciseTimelineSeries
    const result = []
    const w = computeInsights(weightSeries, dates, 'Peso real', 'weight')
    if (w) result.push(w)
    const r = computeInsights(repsSeries, dates, 'Reps reales', 'reps')
    if (r) result.push(r)
    return result
  }, [exerciseTimelineSeries])

  const chart2Insights = useMemo(() => {
    const { dates, repsSeries, expectedRepsSeries } = exerciseTimelineSeries
    const result = []
    const r = computeInsights(repsSeries, dates, 'Reps reales', 'reps')
    if (r) result.push(r)
    const e = computeInsights(expectedRepsSeries, dates, 'Reps esperadas', 'reps')
    if (e) result.push(e)
    return result
  }, [exerciseTimelineSeries])

  const chart3Insights = useMemo(() => {
    const { dates, repsSeries, feelingSeries } = exerciseTimelineSeries
    const result = []
    const r = computeInsights(repsSeries, dates, 'Reps reales', 'reps')
    if (r) result.push(r)
    const f = computeInsights(feelingSeries, dates, 'Feeling', 'feeling')
    if (f) result.push(f)
    return result
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
          <div style={styles.desktopBackRow}>
            <button type="button" onClick={onBack} style={styles.desktopBackButton}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
              Volver al menú
            </button>
          </div>

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
            <h3 style={styles.sectionTitle}>Progreso temporal</h3>

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

            {/* Chart 1: Weight vs Real Reps */}
            <div style={styles.subChartCard}>
              <h4 style={styles.subChartTitle}>Peso vs Reps</h4>
              <div style={styles.nivoChartMedium}>
                {exerciseTimelineSeries.dates.length > 0 && exerciseTimelineSeries.weightSeries.some((v) => v != null) ? (
                  <ReactECharts
                    option={chartWeightRepsOption}
                    style={{ height: '100%', width: '100%' }}
                    notMerge
                    lazyUpdate
                  />
                ) : (
                  <span style={styles.emptyText}>Sin datos de peso para este ejercicio</span>
                )}
              </div>
              {chart1Insights.length > 0 && (
                <div style={styles.insightGrid}>
                  {chart1Insights.map((insight, idx) => (
                    <div key={`c1-${idx}`} style={styles.insightCard}>
                      <span style={styles.insightLabel}>{insight.label}</span>
                      <span style={styles.insightValue}>{formatInsightValue(insight.kind, insight.latest)}</span>
                      <span style={styles.insightMeta}>{insight.latestDate}</span>
                      <span style={styles.insightSubMeta}>
                        Rango: {formatInsightValue(insight.kind, insight.min)} → {formatInsightValue(insight.kind, insight.max)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chart 2: Real Reps vs Expected Reps */}
            <div style={styles.subChartCard}>
              <h4 style={styles.subChartTitle}>Reps reales vs Esperadas</h4>
              <div style={styles.nivoChartMedium}>
                {exerciseTimelineSeries.dates.length > 0 ? (
                  <ReactECharts
                    option={chartRepsExpectedOption}
                    style={{ height: '100%', width: '100%' }}
                    notMerge
                    lazyUpdate
                  />
                ) : (
                  <span style={styles.emptyText}>No hay suficientes datos reales para armar el gráfico temporal</span>
                )}
              </div>
              {!exerciseTimelineSeries.expectedRepsSeries.some((v) => v != null) && (
                <div style={styles.noExpectedNote}>
                  Las reps esperadas no están disponibles para este ejercicio en el período seleccionado.
                </div>
              )}
              {chart2Insights.length > 0 && (
                <div style={styles.insightGrid}>
                  {chart2Insights.map((insight, idx) => (
                    <div key={`c2-${idx}`} style={styles.insightCard}>
                      <span style={styles.insightLabel}>{insight.label}</span>
                      <span style={styles.insightValue}>{formatInsightValue(insight.kind, insight.latest)}</span>
                      <span style={styles.insightMeta}>{insight.latestDate}</span>
                      <span style={styles.insightSubMeta}>
                        Rango: {formatInsightValue(insight.kind, insight.min)} → {formatInsightValue(insight.kind, insight.max)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chart 3: Real Reps vs Feeling */}
            <div style={styles.subChartCard}>
              <h4 style={styles.subChartTitle}>Reps vs Feeling</h4>
              <div style={styles.nivoChartMedium}>
                {exerciseTimelineSeries.dates.length > 0 && exerciseTimelineSeries.repsSeries.some((v) => v != null) ? (
                  <ReactECharts
                    option={chartRepsFeelingOption}
                    style={{ height: '100%', width: '100%' }}
                    notMerge
                    lazyUpdate
                  />
                ) : (
                  <span style={styles.emptyText}>No hay suficientes datos reales para armar el gráfico temporal</span>
                )}
              </div>
              {chart3Insights.length > 0 && (
                <div style={styles.insightGrid}>
                  {chart3Insights.map((insight, idx) => (
                    <div key={`c3-${idx}`} style={styles.insightCard}>
                      <span style={styles.insightLabel}>{insight.label}</span>
                      <span style={styles.insightValue}>{formatInsightValue(insight.kind, insight.latest)}</span>
                      <span style={styles.insightMeta}>{insight.latestDate}</span>
                      <span style={styles.insightSubMeta}>
                        Rango: {formatInsightValue(insight.kind, insight.min)} → {formatInsightValue(insight.kind, insight.max)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
        <button onClick={onBack} style={styles.mobileBackButton}>
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>arrow_back</span>
        </button>
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
            <h3 style={styles.sectionTitle}>Progreso temporal</h3>

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

            {/* Chart 1: Weight vs Real Reps */}
            <div style={styles.subChartCard}>
              <h4 style={styles.subChartTitle}>Peso vs Reps</h4>
              <div style={styles.nivoChartSmall}>
                {exerciseTimelineSeries.dates.length > 0 && exerciseTimelineSeries.weightSeries.some((v) => v != null) ? (
                  <ReactECharts
                    option={chartWeightRepsOption}
                    style={{ height: '100%', width: '100%' }}
                    notMerge
                    lazyUpdate
                  />
                ) : (
                  <span style={styles.emptyText}>Sin datos de peso para este ejercicio</span>
                )}
              </div>
              {chart1Insights.length > 0 && (
                <div style={styles.insightGrid}>
                  {chart1Insights.map((insight, idx) => (
                    <div key={`c1-${idx}`} style={styles.insightCard}>
                      <span style={styles.insightLabel}>{insight.label}</span>
                      <span style={styles.insightValue}>{formatInsightValue(insight.kind, insight.latest)}</span>
                      <span style={styles.insightMeta}>{insight.latestDate}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chart 2: Real Reps vs Expected Reps */}
            <div style={styles.subChartCard}>
              <h4 style={styles.subChartTitle}>Reps reales vs Esperadas</h4>
              <div style={styles.nivoChartSmall}>
                {exerciseTimelineSeries.dates.length > 0 ? (
                  <ReactECharts
                    option={chartRepsExpectedOption}
                    style={{ height: '100%', width: '100%' }}
                    notMerge
                    lazyUpdate
                  />
                ) : (
                  <span style={styles.emptyText}>No hay suficientes datos reales para armar el gráfico temporal</span>
                )}
              </div>
              {!exerciseTimelineSeries.expectedRepsSeries.some((v) => v != null) && (
                <div style={styles.noExpectedNoteMobile}>
                  Las reps esperadas no están disponibles para este ejercicio.
                </div>
              )}
              {chart2Insights.length > 0 && (
                <div style={styles.insightGrid}>
                  {chart2Insights.map((insight, idx) => (
                    <div key={`c2-${idx}`} style={styles.insightCard}>
                      <span style={styles.insightLabel}>{insight.label}</span>
                      <span style={styles.insightValue}>{formatInsightValue(insight.kind, insight.latest)}</span>
                      <span style={styles.insightMeta}>{insight.latestDate}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chart 3: Real Reps vs Feeling */}
            <div style={styles.subChartCard}>
              <h4 style={styles.subChartTitle}>Reps vs Feeling</h4>
              <div style={styles.nivoChartSmall}>
                {exerciseTimelineSeries.dates.length > 0 && exerciseTimelineSeries.repsSeries.some((v) => v != null) ? (
                  <ReactECharts
                    option={chartRepsFeelingOption}
                    style={{ height: '100%', width: '100%' }}
                    notMerge
                    lazyUpdate
                  />
                ) : (
                  <span style={styles.emptyText}>No hay suficientes datos reales para armar el gráfico temporal</span>
                )}
              </div>
              {chart3Insights.length > 0 && (
                <div style={styles.insightGrid}>
                  {chart3Insights.map((insight, idx) => (
                    <div key={`c3-${idx}`} style={styles.insightCard}>
                      <span style={styles.insightLabel}>{insight.label}</span>
                      <span style={styles.insightValue}>{formatInsightValue(insight.kind, insight.latest)}</span>
                      <span style={styles.insightMeta}>{insight.latestDate}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
  desktopBackRow: { marginBottom: '0.75rem', display: 'flex', alignItems: 'center' },
  desktopBackButton: { border: 'none', borderRadius: borderRadius.full, backgroundColor: colors.surfaceContainerLow, color: colors.onSurfaceVariant, padding: '0.42rem 0.72rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' },
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
  subChartCard: { backgroundColor: colors.surfaceContainerHigh, border: `1px solid ${colors.surfaceContainerHighest}`, borderRadius: borderRadius.md, padding: '0.65rem', marginBottom: '0.75rem' },
  subChartTitle: { fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: colors.onSurfaceVariant, marginBottom: '0.45rem', fontWeight: 700 },
  noExpectedNote: { marginTop: '0.35rem', fontSize: '0.65rem', color: colors.onSurfaceVariant, fontStyle: 'italic' },
  noExpectedNoteMobile: { marginTop: '0.25rem', fontSize: '0.6rem', color: colors.onSurfaceVariant, fontStyle: 'italic' },
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
  mobileBackButton: { width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: 'none', color: colors.onSurface, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
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
