import { useRef } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Shield,
  Activity,
  Camera,
  FileText,
  BarChart3,
  BrainCircuit,
  Bell,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Layers,
  Github,
  Twitter,
  Linkedin,
  Mail,
} from 'lucide-react'

/* ═══════════════════════════════════════════
   COLOR TOKENS  (Black / Violet / Lime / White)
   ═══════════════════════════════════════════ */
const C = {
  black: '#000000',
  violet: '#7D39EB',
  violetLight: '#9B6BF0',
  violetDark: '#5A1FBF',
  lime: '#C6FF33',
  limeDark: '#A3D92B',
  white: '#FFFFFF',
}

/* ──────────────────────────────────────────
   Animation helpers
   ────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
}

const scaleUp = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
}

function AnimatedSection({ children, className = '', threshold = 0.15 }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: threshold })
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ──────────────────────────────────────────
   Floating particle orbs (violet + lime)
   ────────────────────────────────────────── */
function FloatingOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {[
        { size: 600, x: '-10%', y: '-20%', color: 'rgba(125,57,235,0.10)', delay: 0 },
        { size: 500, x: '70%', y: '10%', color: 'rgba(198,255,51,0.06)', delay: 2 },
        { size: 400, x: '30%', y: '60%', color: 'rgba(125,57,235,0.06)', delay: 4 },
        { size: 350, x: '80%', y: '70%', color: 'rgba(198,255,51,0.04)', delay: 1 },
      ].map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            filter: 'blur(60px)',
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            delay: orb.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

/* ──────────────────────────────────────────
   Grid pattern overlay
   ────────────────────────────────────────── */
function GridOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.035]"
      aria-hidden
      style={{
        backgroundImage:
          `linear-gradient(rgba(125,57,235,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(125,57,235,0.4) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }}
    />
  )
}

/* ══════════════════════════════════════════
   NAVBAR
   ══════════════════════════════════════════ */
function Navbar() {
  const navigate = useNavigate()
  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div
          className="flex items-center justify-between rounded-2xl px-6 py-3 border"
          style={{
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderColor: 'rgba(125,57,235,0.12)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="relative w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${C.violet}, ${C.violetDark})`,
                boxShadow: `0 0 20px rgba(125,57,235,0.4)`,
              }}
            >
              <Shield className="h-5 w-5 text-white" />
              <div
                className="absolute inset-0 rounded-xl animate-pulse"
                style={{ background: 'rgba(125,57,235,0.2)' }}
              />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight">BuildGuard</span>
              <span className="text-sm font-bold ml-0.5" style={{ color: C.lime }}>AI</span>
            </div>
          </div>

          {/* Links */}
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'About'].map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase()}`}
                className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
              >
                {link}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all hover:scale-[1.03]"
              style={{
                background: `linear-gradient(135deg, ${C.violet}, ${C.violetDark})`,
                color: C.white,
                boxShadow: `0 4px 20px rgba(125,57,235,0.4)`,
              }}
            >
              Open Dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}

/* ══════════════════════════════════════════
   HERO SECTION
   ══════════════════════════════════════════ */
function HeroSection() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [0, 200])
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const navigate = useNavigate()

  return (
    <section
      ref={ref}
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-28 pb-20"
    >
      <FloatingOrbs />
      <GridOverlay />

      {/* Radial gradient spotlight */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px]"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(125,57,235,0.14) 0%, transparent 70%)',
        }}
        aria-hidden
      />

      <motion.div style={{ y, opacity }} className="relative z-10 text-center max-w-5xl mx-auto px-6">
        {/* Badge */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
          style={{
            background: 'rgba(125,57,235,0.12)',
            border: '1px solid rgba(125,57,235,0.25)',
          }}
        >
          <Sparkles className="h-4 w-4" style={{ color: C.lime }} />
          <span className="text-xs font-medium tracking-wide uppercase" style={{ color: C.violetLight }}>
            AI-Powered Structural Monitoring
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight"
        >
          <span className="text-white">Detect Structural </span>
          <br className="hidden sm:block" />
          <span className="text-white">Damage with </span>
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: `linear-gradient(135deg, ${C.violet}, ${C.lime})` }}
          >
            AI Precision
          </span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
        >
          Analyze sensor data and building images using deep learning to identify cracks,
          corrosion, and structural anomalies — all from a single dashboard.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-3.5 rounded-2xl text-base font-semibold flex items-center gap-2 group transition-all hover:scale-[1.03]"
            style={{
              background: `linear-gradient(135deg, ${C.violet}, ${C.violetDark})`,
              color: C.white,
              boxShadow: `0 6px 30px rgba(125,57,235,0.4)`,
            }}
          >
            Go to Dashboard
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <a
            href="#features"
            className="px-8 py-3.5 rounded-2xl text-base font-medium text-gray-300 border border-white/10 hover:border-white/20 hover:bg-white/[0.03] transition-all flex items-center gap-2"
          >
            Explore Features
            <ChevronRight className="h-4 w-4" />
          </a>
        </motion.div>

        {/* Dashboard Mockup Preview */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={4}
          className="mt-20 relative"
        >
          <div
            className="relative mx-auto max-w-4xl rounded-2xl overflow-hidden p-1"
            style={{
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(125,57,235,0.15)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div className="rounded-xl p-5 sm:p-6" style={{ background: 'rgba(10,10,20,0.9)' }}>
              {/* Top bar */}
              <div className="flex items-center gap-2 mb-5">
                <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(248,113,113,0.6)' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(251,191,36,0.6)' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: `rgba(198,255,51,0.6)` }} />
                <div className="ml-4 flex items-center gap-2">
                  <div className="h-4 w-4 rounded" style={{ background: `linear-gradient(135deg, ${C.violet}, ${C.violetDark})` }} />
                  <span className="text-[11px] font-semibold text-gray-400 tracking-wide">BuildGuard AI — Structural Health Overview</span>
                </div>
              </div>

              {/* Stat cards with real data */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'Total Analyses', value: '245', icon: '⚡', bg: `rgba(125,57,235,0.12)`, border: `rgba(125,57,235,0.2)`, valColor: C.violetLight },
                  { label: 'Healthy', value: '18', icon: '✓', bg: `rgba(52,211,153,0.08)`, border: `rgba(52,211,153,0.15)`, valColor: '#34d399' },
                  { label: 'Warnings', value: '4', icon: '⚠', bg: `rgba(251,191,36,0.08)`, border: `rgba(251,191,36,0.15)`, valColor: '#fbbf24' },
                  { label: 'Critical', value: '2', icon: '●', bg: `rgba(248,113,113,0.08)`, border: `rgba(248,113,113,0.15)`, valColor: '#f87171' },
                ].map((card, ci) => (
                  <motion.div
                    key={card.label}
                    className="rounded-xl p-3 sm:p-4"
                    style={{ background: card.bg, border: `1px solid ${card.border}` }}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + ci * 0.08, duration: 0.5 }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wider font-medium">{card.label}</p>
                      <span className="text-xs" style={{ color: card.valColor }}>{card.icon}</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold mt-1 font-mono" style={{ color: card.valColor }}>{card.value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Bottom grid: Chart + Activity feed */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {/* Area chart mockup */}
                <div
                  className="sm:col-span-3 rounded-xl p-4"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Monthly Trend</span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#34d399' }} /><span className="text-[9px] text-gray-600">Healthy</span></span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#fbbf24' }} /><span className="text-[9px] text-gray-600">Warning</span></span>
                    </div>
                  </div>
                  {/* SVG area chart */}
                  <svg viewBox="0 0 300 100" className="w-full h-24 sm:h-32" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="heroGradGreen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="heroGradYellow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Grid lines */}
                    {[25, 50, 75].map(y => (
                      <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                    ))}
                    {/* Healthy area */}
                    <motion.path
                      d="M0,70 L50,60 L100,50 L150,55 L200,38 L250,42 L300,35 L300,100 L0,100 Z"
                      fill="url(#heroGradGreen)"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1, duration: 0.8 }}
                    />
                    <motion.path
                      d="M0,70 L50,60 L100,50 L150,55 L200,38 L250,42 L300,35"
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="1.5"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.8, duration: 1.2, ease: 'easeInOut' }}
                    />
                    {/* Warning area */}
                    <motion.path
                      d="M0,88 L50,85 L100,80 L150,82 L200,78 L250,80 L300,76 L300,100 L0,100 Z"
                      fill="url(#heroGradYellow)"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.1, duration: 0.8 }}
                    />
                    <motion.path
                      d="M0,88 L50,85 L100,80 L150,82 L200,78 L250,80 L300,76"
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="1.5"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.9, duration: 1.2, ease: 'easeInOut' }}
                    />
                    {/* Data dots on healthy line */}
                    {[[0,70],[50,60],[100,50],[150,55],[200,38],[250,42],[300,35]].map(([cx,cy], di) => (
                      <motion.circle
                        key={`hd-${di}`}
                        cx={cx} cy={cy} r="2.5"
                        fill="#0a0a14" stroke="#34d399" strokeWidth="1"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.2 + di * 0.06 }}
                      />
                    ))}
                    {/* X axis labels */}
                    {['Oct','Nov','Dec','Jan','Feb','Mar'].map((m, mi) => (
                      <text key={m} x={mi * 60} y="98" fill="rgba(148,163,184,0.5)" fontSize="6" textAnchor="start">{m}</text>
                    ))}
                  </svg>
                </div>

                {/* Mini activity feed */}
                <div
                  className="sm:col-span-2 rounded-xl p-4"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block mb-3">Recent Assessments</span>
                  <div className="space-y-2">
                    {[
                      { name: 'Central Tower', type: 'Sensor', status: 'Healthy', color: '#34d399', time: '2m ago' },
                      { name: 'Bridge Alpha', type: 'Sensor', status: 'Warning', color: '#fbbf24', time: '1h ago' },
                      { name: 'Parking Deck B', type: 'Image', status: 'Healthy', color: '#34d399', time: '2h ago' },
                      { name: 'Highway Overpass', type: 'Sensor', status: 'Critical', color: '#f87171', time: '3h ago' },
                      { name: 'Office Complex C', type: 'Image', status: 'Healthy', color: '#34d399', time: '4h ago' },
                    ].map((item, ai) => (
                      <motion.div
                        key={item.name}
                        className="flex items-center justify-between py-1.5 px-2 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.015)' }}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 + ai * 0.08 }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                          <div className="min-w-0">
                            <p className="text-[10px] text-gray-300 truncate">{item.name}</p>
                            <p className="text-[8px] text-gray-600">{item.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className="text-[8px] font-medium px-1.5 py-0.5 rounded-full"
                            style={{
                              color: item.color,
                              background: `${item.color}15`,
                            }}
                          >
                            {item.status}
                          </span>
                          <span className="text-[8px] text-gray-600 tabular-nums">{item.time}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Glow under mockup */}
          <div
            className="pointer-events-none absolute -bottom-20 left-1/2 -translate-x-1/2 w-[80%] h-40 rounded-full"
            style={{
              background: 'radial-gradient(ellipse, rgba(125,57,235,0.18) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />
        </motion.div>
      </motion.div>
    </section>
  )
}

/* ══════════════════════════════════════════
   FEATURES SECTION
   ══════════════════════════════════════════ */
const features = [
  {
    icon: BrainCircuit,
    title: 'AI Damage Detection',
    description:
      'Deep learning models analyze structural images to detect cracks, corrosion, and deformation with high accuracy.',
    color: 'violet',
  },
  {
    icon: Activity,
    title: 'Sensor Data Analysis',
    description:
      'Input vibration, strain, and displacement sensor readings for instant structural health assessment and risk scoring.',
    color: 'lime',
  },
  {
    icon: Camera,
    title: 'Image-Based Inspection',
    description:
      'Upload building photographs and receive AI-generated damage classifications with annotated regions.',
    color: 'violet',
  },
  {
    icon: Bell,
    title: 'Risk Alerts',
    description:
      'Automatic severity classification flags critical structural issues so you can prioritize inspections effectively.',
    color: 'lime',
  },
  {
    icon: BarChart3,
    title: 'Visual Analytics',
    description:
      'Interactive charts and dashboards visualize sensor trends, anomaly patterns, and historical analysis results.',
    color: 'violet',
  },
  {
    icon: FileText,
    title: 'Report Generation',
    description:
      'Create structured inspection reports with AI-powered summaries, risk scores, and recommended remediation steps.',
    color: 'lime',
  },
]

function FeaturesSection() {
  const colorMap = {
    violet: {
      gradient: `linear-gradient(135deg, rgba(125,57,235,0.18), rgba(125,57,235,0.04))`,
      iconBg: `linear-gradient(135deg, rgba(125,57,235,0.25), rgba(125,57,235,0.08))`,
      iconBorder: 'rgba(125,57,235,0.3)',
      iconColor: C.violetLight,
      hoverGlow: 'rgba(125,57,235,0.08)',
    },
    lime: {
      gradient: `linear-gradient(135deg, rgba(198,255,51,0.10), rgba(198,255,51,0.02))`,
      iconBg: `linear-gradient(135deg, rgba(198,255,51,0.20), rgba(198,255,51,0.06))`,
      iconBorder: 'rgba(198,255,51,0.25)',
      iconColor: C.lime,
      hoverGlow: 'rgba(198,255,51,0.06)',
    },
  }

  return (
    <section id="features" className="relative py-28 overflow-hidden">
      <GridOverlay />
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <AnimatedSection className="text-center mb-16">
          <motion.div
            variants={fadeUp}
            custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
            style={{
              background: 'rgba(198,255,51,0.08)',
              border: '1px solid rgba(198,255,51,0.2)',
            }}
          >
            <Layers className="h-4 w-4" style={{ color: C.lime }} />
            <span className="text-xs font-medium tracking-wide uppercase" style={{ color: C.lime }}>
              Capabilities
            </span>
          </motion.div>
          <motion.h2 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Powerful Tools for
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(135deg, ${C.lime}, ${C.violet})` }}
            >
              Structural Health Monitoring
            </span>
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="mt-5 text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
            From sensor analysis to image-based inspections — BuildGuard AI gives you the complete
            toolkit to assess and monitor structural integrity.
          </motion.p>
        </AnimatedSection>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const c = colorMap[feature.color]
            return (
              <AnimatedSection key={feature.title} threshold={0.1}>
                <motion.div
                  variants={scaleUp}
                  custom={i}
                  className="group relative rounded-2xl p-7 h-full cursor-default transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: 'rgba(10,10,20,0.7)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(125,57,235,0.1)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
                  }}
                  whileHover={{
                    borderColor: feature.color === 'violet' ? 'rgba(125,57,235,0.25)' : 'rgba(198,255,51,0.2)',
                    boxShadow: `0 12px 40px rgba(0,0,0,0.4), 0 0 20px ${c.hoverGlow}`,
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-shadow"
                    style={{
                      background: c.iconBg,
                      border: `1px solid ${c.iconBorder}`,
                    }}
                  >
                    <feature.icon className="h-6 w-6" style={{ color: c.iconColor }} />
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>

                  {/* Hover corner glow */}
                  <div
                    className="absolute top-0 right-0 w-32 h-32 rounded-tr-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at top right, ${c.hoverGlow} 0%, transparent 70%)`,
                    }}
                  />
                </motion.div>
              </AnimatedSection>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════
   HOW IT WORKS SECTION (replaces pricing)
   ══════════════════════════════════════════ */
function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Input Sensor Data',
      description: 'Enter real-time vibration, strain, temperature, and displacement readings from structural sensors.',
    },
    {
      number: '02',
      title: 'Upload Images',
      description: 'Capture and upload building photographs for AI-powered visual damage classification.',
    },
    {
      number: '03',
      title: 'Get AI Analysis',
      description: 'Our deep learning models process your data and return health scores, risk levels, and damage annotations.',
    },
    {
      number: '04',
      title: 'Generate Reports',
      description: 'Create detailed inspection reports with findings, severity ratings, and recommended next steps.',
    },
  ]

  return (
    <section id="about" className="relative py-28 overflow-hidden">
      {/* Subtle gradient band */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, rgba(125,57,235,0.05) 0%, rgba(198,255,51,0.03) 50%, rgba(125,57,235,0.05) 100%)`,
        }}
      />
      <div className="absolute inset-0 border-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }} />

      <div className="relative max-w-6xl mx-auto px-6">
        <AnimatedSection className="text-center mb-16">
          <motion.div
            variants={fadeUp}
            custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
            style={{
              background: 'rgba(125,57,235,0.1)',
              border: '1px solid rgba(125,57,235,0.2)',
            }}
          >
            <Sparkles className="h-4 w-4" style={{ color: C.violetLight }} />
            <span className="text-xs font-medium tracking-wide uppercase" style={{ color: C.violetLight }}>
              How It Works
            </span>
          </motion.div>
          <motion.h2 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Simple Workflow,
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(135deg, ${C.violet}, ${C.lime})` }}
            >
              Powerful Results
            </span>
          </motion.h2>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <AnimatedSection key={step.number} threshold={0.1}>
              <motion.div
                variants={fadeUp}
                custom={i}
                className="relative rounded-2xl p-6 h-full"
                style={{
                  background: 'rgba(10,10,20,0.6)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(125,57,235,0.1)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                <span
                  className="text-5xl font-black block mb-4"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${C.violet}, ${C.lime})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    opacity: 0.7,
                  }}
                >
                  {step.number}
                </span>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════
   CTA SECTION
   ══════════════════════════════════════════ */
function CTASection() {
  const navigate = useNavigate()
  return (
    <section className="relative py-28 overflow-hidden">
      <div className="max-w-4xl mx-auto px-6">
        <AnimatedSection className="text-center">
          <motion.div
            variants={fadeUp}
            custom={0}
            className="relative rounded-3xl p-12 sm:p-16 overflow-hidden"
            style={{
              background: 'rgba(10,10,20,0.7)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(125,57,235,0.15)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
            }}
          >
            {/* Background glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(125,57,235,0.10) 0%, transparent 60%)',
              }}
            />
            <div className="relative z-10">
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                Ready to Analyze
                <br />
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: `linear-gradient(135deg, ${C.violet}, ${C.lime})` }}
                >
                  Your Structures?
                </span>
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="mt-5 text-gray-400 max-w-xl mx-auto text-lg">
                Open the dashboard to start analyzing sensor data, inspect building images,
                and generate comprehensive structural health reports.
              </motion.p>
              <motion.div variants={fadeUp} custom={3} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-8 py-3.5 rounded-2xl text-base font-semibold flex items-center gap-2 group transition-all hover:scale-[1.03]"
                  style={{
                    background: `linear-gradient(135deg, ${C.violet}, ${C.violetDark})`,
                    color: C.white,
                    boxShadow: `0 6px 30px rgba(125,57,235,0.4)`,
                  }}
                >
                  Open Dashboard
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <a
                  href="#features"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Learn More →
                </a>
              </motion.div>
            </div>
          </motion.div>
        </AnimatedSection>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════
   FOOTER
   ══════════════════════════════════════════ */
function Footer() {
  const footerLinks = {
    Platform: ['Dashboard', 'Sensor Analysis', 'Image Analysis', 'Reports'],
    Resources: ['Documentation', 'API Reference', 'Help Center'],
    Project: ['About', 'Contact', 'GitHub'],
  }
  return (
    <footer className="relative" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-1 mb-4 sm:mb-0">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${C.violet}, ${C.violetDark})`,
                }}
              >
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-sm font-bold text-white">BuildGuard</span>
                <span className="text-sm font-bold ml-0.5" style={{ color: C.lime }}>AI</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed max-w-[260px]">
              AI-powered structural health monitoring for safer, smarter infrastructure.
            </p>
            {/* Social */}
            <div className="flex items-center gap-3 mt-5">
              {[Github, Twitter, Linkedin, Mail].map((Icon, idx) => (
                <a
                  key={idx}
                  href="#"
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = C.lime
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#6b7280'
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  }}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-white mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} BuildGuard AI. All rights reserved.
          </p>
          <p className="text-xs text-gray-600">
            Built with <span style={{ color: C.lime }}>♥</span> for safer structures.
          </p>
        </div>
      </div>
    </footer>
  )
}

/* ══════════════════════════════════════════
   LANDING PAGE (composed)
   ══════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div className="min-h-screen text-gray-200 overflow-x-hidden" style={{ background: C.black }}>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
      <Footer />
    </div>
  )
}
