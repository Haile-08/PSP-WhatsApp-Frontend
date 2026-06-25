import {
  Users,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  CalendarCheck,
  Truck,
  TrendingUp,
} from 'lucide-react'
import { useAdminStatsQuery } from './adminApi'

const FONT = '"Segoe UI", Helvetica, Arial, sans-serif'
const ACCENT = '#5FBA82'

// Phase 1..8 short labels (mirror app/core/.../onboarding/phases.py).
const PHASE_LABELS = {
  1: 'Registration',
  2: 'Pre-Verify',
  3: 'Clinical',
  4: 'Consent',
  5: 'Scheduling',
  6: 'Broker/Ship',
  7: 'Claim',
  8: 'Benefits',
}

// Rotating palette for categorical slices (insurance status, etc.).
const SLICE_COLORS = ['#5FBA82', '#38bdf8', '#fbbf24', '#f87171', '#c084fc', '#34d399']

const INSURANCE_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  not_supported: 'Not supported',
}

function humanize(value) {
  if (!value) return 'Unknown'
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function Card({ children, style }) {
  return (
    <div
      style={{
        backgroundColor: '#151815',
        border: '1px solid #262b27',
        borderRadius: '14px',
        padding: '18px',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div
      style={{
        fontFamily: FONT,
        fontSize: '14px',
        fontWeight: 600,
        color: '#e9edec',
        marginBottom: '16px',
      }}
    >
      {children}
    </div>
  )
}

function KpiCard(props) {
  const { icon: Icon, label, value, sub, accent = ACCENT } = props
  return (
    <Card style={{ flex: '1 1 180px', minWidth: '180px' }}>
      <div className="flex items-center justify-between">
        <span
          style={{
            fontFamily: FONT,
            fontSize: '13px',
            color: '#8a958f',
          }}
        >
          {label}
        </span>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '9px',
            backgroundColor: '#1e221e',
            color: accent,
          }}
        >
          <Icon size={18} />
        </span>
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: '30px',
          fontWeight: 600,
          color: '#e9edec',
          lineHeight: '38px',
          marginTop: '10px',
        }}
      >
        {value}
      </div>
      {sub != null && (
        <div style={{ fontFamily: FONT, fontSize: '12px', color: '#8a958f', marginTop: '2px' }}>
          {sub}
        </div>
      )}
    </Card>
  )
}

// Vertical bar chart — patients per onboarding phase.
function PhaseBars({ data }) {
  const max = Math.max(1, ...data.map((d) => d.count))
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '10px',
        height: '200px',
        paddingTop: '8px',
      }}
    >
      {data.map((d) => {
        const h = (d.count / max) * 160
        return (
          <div
            key={d.phase}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              height: '100%',
              justifyContent: 'flex-end',
            }}
          >
            <span style={{ fontFamily: FONT, fontSize: '12px', color: '#e9edec' }}>
              {d.count}
            </span>
            <div
              title={`${d.count} patient(s)`}
              style={{
                width: '100%',
                maxWidth: '34px',
                height: `${Math.max(h, 3)}px`,
                borderRadius: '6px 6px 2px 2px',
                background: `linear-gradient(180deg, ${ACCENT}, #3a8159)`,
              }}
            />
            <span
              style={{
                fontFamily: FONT,
                fontSize: '10px',
                color: '#8a958f',
                textAlign: 'center',
                lineHeight: '12px',
              }}
            >
              {PHASE_LABELS[d.phase] || `P${d.phase}`}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// Area + line chart — signups per day.
function SignupArea({ data }) {
  const W = 560
  const H = 180
  const PAD = 8
  const max = Math.max(1, ...data.map((d) => d.count))
  const n = data.length
  const x = (i) => (n <= 1 ? PAD : PAD + (i * (W - 2 * PAD)) / (n - 1))
  const y = (v) => H - PAD - (v / max) * (H - 2 * PAD)

  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.count)}`).join(' ')
  const area = `${line} L ${x(n - 1)} ${H - PAD} L ${x(0)} ${H - PAD} Z`
  const total = data.reduce((s, d) => s + d.count, 0)

  return (
    <div>
      <div style={{ fontFamily: FONT, fontSize: '12px', color: '#8a958f', marginBottom: '6px' }}>
        {total} new patient{total === 1 ? '' : 's'} in the last {n} days
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
        <defs>
          <linearGradient id="signupFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT} stopOpacity="0.35" />
            <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#signupFill)" />
        <path d={line} fill="none" stroke={ACCENT} strokeWidth="2" strokeLinejoin="round" />
        {data.map((d, i) => (
          <circle key={d.date} cx={x(i)} cy={y(d.count)} r="2.5" fill={ACCENT}>
            <title>{`${d.date}: ${d.count}`}</title>
          </circle>
        ))}
      </svg>
    </div>
  )
}

// Donut — categorical breakdown (insurance status).
function Donut({ data, labels }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  const R = 54
  const C = 2 * Math.PI * R
  let offset = 0
  return (
    <div className="flex items-center" style={{ gap: '20px', flexWrap: 'wrap' }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={R} fill="none" stroke="#1e221e" strokeWidth="16" />
        {total > 0 &&
          data.map((d, i) => {
            const frac = d.count / total
            const dash = frac * C
            const seg = (
              <circle
                key={d.status || i}
                cx="70"
                cy="70"
                r={R}
                fill="none"
                stroke={SLICE_COLORS[i % SLICE_COLORS.length]}
                strokeWidth="16"
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 70 70)"
              >
                <title>{`${labels(d) }: ${d.count}`}</title>
              </circle>
            )
            offset += dash
            return seg
          })}
        <text
          x="70"
          y="66"
          textAnchor="middle"
          fill="#e9edec"
          fontFamily={FONT}
          fontSize="24"
          fontWeight="600"
        >
          {total}
        </text>
        <text x="70" y="86" textAnchor="middle" fill="#8a958f" fontFamily={FONT} fontSize="11">
          total
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.map((d, i) => (
          <div key={d.status || i} className="flex items-center" style={{ gap: '8px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '3px',
                backgroundColor: SLICE_COLORS[i % SLICE_COLORS.length],
              }}
            />
            <span style={{ fontFamily: FONT, fontSize: '13px', color: '#e9edec' }}>
              {labels(d)}
            </span>
            <span style={{ fontFamily: FONT, fontSize: '13px', color: '#8a958f' }}>
              {d.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Horizontal bars — open escalations by reason.
function HBarList({ data, labelOf }) {
  if (data.length === 0) {
    return (
      <div style={{ fontFamily: FONT, fontSize: '13px', color: '#8a958f' }}>
        No open escalations — everything is on track.
      </div>
    )
  }
  const max = Math.max(1, ...data.map((d) => d.count))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex items-center justify-between" style={{ marginBottom: '4px' }}>
            <span style={{ fontFamily: FONT, fontSize: '13px', color: '#e9edec' }}>
              {labelOf(d)}
            </span>
            <span style={{ fontFamily: FONT, fontSize: '13px', color: '#8a958f' }}>
              {d.count}
            </span>
          </div>
          <div style={{ height: '8px', borderRadius: '4px', backgroundColor: '#1e221e' }}>
            <div
              style={{
                width: `${(d.count / max) * 100}%`,
                height: '100%',
                borderRadius: '4px',
                backgroundColor: '#f87171',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function DashboardView() {
  const { data, isLoading, isError } = useAdminStatsQuery()

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ flex: 1, height: '100%', color: '#8a958f', fontFamily: FONT, gap: '10px' }}
      >
        <Loader2 size={20} className="animate-spin" />
        Loading live metrics…
      </div>
    )
  }
  if (isError || !data) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ flex: 1, height: '100%', color: '#f87171', fontFamily: FONT }}
      >
        Couldn’t load dashboard metrics.
      </div>
    )
  }

  const t = data.totals
  return (
    <div style={{ flex: 1, height: '100%', overflowY: 'auto', backgroundColor: '#0c0e0d' }}>
      <div
        style={{
          height: '60px',
          backgroundColor: '#151815',
          borderBottom: '1px solid #262b27',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
        }}
      >
        <div>
          <div style={{ fontFamily: FONT, fontSize: '16px', fontWeight: 600, color: '#e9edec' }}>
            Dashboard
          </div>
          <div style={{ fontFamily: FONT, fontSize: '12px', color: '#8a958f' }}>
            Live patient onboarding metrics
          </div>
        </div>
        <span
          className="flex items-center"
          style={{ marginLeft: 'auto', gap: '6px', fontFamily: FONT, fontSize: '12px', color: '#8a958f' }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: ACCENT }} />
          Live
        </span>
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* KPI cards */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          <KpiCard icon={Users} label="Total patients" value={t.patients} />
          <KpiCard
            icon={CheckCircle2}
            label="Onboarding complete"
            value={t.completed}
            sub={`${t.completion_rate}% completion rate`}
          />
          <KpiCard icon={TrendingUp} label="In progress" value={t.in_progress} accent="#38bdf8" />
          <KpiCard
            icon={AlertTriangle}
            label="Open escalations"
            value={t.open_escalations}
            accent="#f87171"
          />
          <KpiCard
            icon={CalendarCheck}
            label="Appointments confirmed"
            value={t.appointments_confirmed}
            sub={`${t.appointments_booked} awaiting`}
            accent="#fbbf24"
          />
          <KpiCard icon={Truck} label="Shipments dispatched" value={t.shipments_dispatched} accent="#c084fc" />
        </div>

        {/* Phase distribution + signups */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Card style={{ flex: '2 1 420px' }}>
            <SectionTitle>Patients by onboarding phase</SectionTitle>
            <PhaseBars data={data.phase_distribution} />
          </Card>
          <Card style={{ flex: '2 1 420px' }}>
            <SectionTitle>New registrations</SectionTitle>
            <SignupArea data={data.signups_by_day} />
          </Card>
        </div>

        {/* Insurance donut + escalations */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Card style={{ flex: '1 1 320px' }}>
            <SectionTitle>Insurance status</SectionTitle>
            <Donut
              data={data.insurance_status}
              labels={(d) => INSURANCE_LABELS[d.status] || humanize(d.status)}
            />
          </Card>
          <Card style={{ flex: '1 1 320px' }}>
            <SectionTitle>Open escalations by reason</SectionTitle>
            <HBarList data={data.escalations_by_reason} labelOf={(d) => humanize(d.reason)} />
          </Card>
        </div>
      </div>
    </div>
  )
}
