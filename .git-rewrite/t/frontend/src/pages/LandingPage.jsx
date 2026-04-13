import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Shield,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Send,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════
   DESIGN TOKENS — Monochromatic + Terracotta accent
   ═══════════════════════════════════════════════════════════════ */
const T = {
  white: '#FFFFFF',
  offWhite: '#F8F7F5',
  charcoal: '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E5E5',
  borderLight: '#F0F0F0',
  terra: '#C2644A',
  terraHover: '#A84E36',
  terraLight: 'rgba(194, 100, 74, 0.08)',
}

/* ═══════════════════════════════════════════════════════════════
   ANIMATION HELPERS
   ═══════════════════════════════════════════════════════════════ */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
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

/* ═══════════════════════════════════════════════════════════════
   SVG DEFECT ILLUSTRATIONS — Pure geometric line art
   ═══════════════════════════════════════════════════════════════ */

/* Shear crack pattern in brick/masonry */
function CrackSVG() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Brick grid pattern */}
      {[0, 40, 80, 120, 160].map((y, i) => (
        <g key={`row-${i}`}>
          <line x1="0" y1={y} x2="200" y2={y} stroke={T.borderLight} strokeWidth="0.5" />
          {(i % 2 === 0 ? [50, 100, 150] : [25, 75, 125, 175]).map((x, j) => (
            <line key={`v-${i}-${j}`} x1={x} y1={y} x2={x} y2={y + 40} stroke={T.borderLight} strokeWidth="0.5" />
          ))}
        </g>
      ))}
      <line x1="0" y1="200" x2="200" y2="200" stroke={T.borderLight} strokeWidth="0.5" />
      {/* Diagonal shear crack */}
      <motion.path
        d="M 30 10 L 45 35 L 38 55 L 55 80 L 48 105 L 65 130 L 58 155 L 75 180 L 70 200"
        stroke={T.terra}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.3 }}
      />
      {/* Hairline offshoots */}
      <motion.path
        d="M 45 35 L 60 42 M 55 80 L 70 75 M 65 130 L 80 135"
        stroke={T.terra}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 1 }}
      />
    </svg>
  )
}

/* Foundation settling — tilted structure */
function FoundationSVG() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Ground line */}
      <line x1="0" y1="160" x2="200" y2="160" stroke={T.border} strokeWidth="1" />
      {/* Hatched ground */}
      {[10, 30, 50, 70, 90, 110, 130, 150, 170, 190].map((x, i) => (
        <line key={`h-${i}`} x1={x} y1="160" x2={x - 12} y2="175" stroke={T.border} strokeWidth="0.5" />
      ))}
      {/* Building — slightly tilted */}
      <motion.g
        initial={{ rotate: 0 }}
        animate={{ rotate: 2.5 }}
        transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.5 }}
        style={{ transformOrigin: '100px 160px' }}
      >
        <rect x="55" y="40" width="90" height="120" stroke={T.charcoal} strokeWidth="1.5" fill="none" rx="1" />
        {/* Windows */}
        {[55, 85, 115].map((wy) => (
          <g key={`win-${wy}`}>
            <rect x="70" y={wy} width="18" height="16" stroke={T.border} strokeWidth="1" fill="none" />
            <rect x="112" y={wy} width="18" height="16" stroke={T.border} strokeWidth="1" fill="none" />
          </g>
        ))}
        {/* Door */}
        <rect x="90" y="130" width="20" height="30" stroke={T.border} strokeWidth="1" fill="none" />
      </motion.g>
      {/* Settling gap indicator */}
      <motion.path
        d="M 140 155 L 155 155"
        stroke={T.terra}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.5 }}
      />
      <motion.path
        d="M 147 152 L 147 158"
        stroke={T.terra}
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.5 }}
      />
    </svg>
  )
}

/* Concrete spalling — surface peeling */
function SpallingSVG() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Concrete slab */}
      <rect x="20" y="30" width="160" height="140" stroke={T.border} strokeWidth="1" fill="none" rx="2" />
      {/* Surface texture lines */}
      {[50, 70, 90, 110, 130, 150].map((y, i) => (
        <line key={`t-${i}`} x1="25" y1={y} x2="175" y2={y} stroke={T.borderLight} strokeWidth="0.3" />
      ))}
      {/* Rebar exposed */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
      >
        <line x1="60" y1="85" x2="150" y2="85" stroke={T.terra} strokeWidth="1.5" strokeDasharray="4 3" />
        <line x1="60" y1="95" x2="145" y2="95" stroke={T.terra} strokeWidth="1.5" strokeDasharray="4 3" />
      </motion.g>
      {/* Spalling outline — irregular peeling area */}
      <motion.path
        d="M 55 65 C 65 58, 85 55, 105 60 C 125 65, 145 58, 155 65 L 155 110 C 145 118, 125 115, 105 110 C 85 105, 65 112, 55 110 Z"
        stroke={T.terra}
        strokeWidth="1.5"
        fill={T.terraLight}
        strokeLinecap="round"
        initial={{ pathLength: 0, fillOpacity: 0 }}
        animate={{ pathLength: 1, fillOpacity: 1 }}
        transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.3 }}
      />
      {/* Debris fragments */}
      <motion.g
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 0.6, y: 0 }}
        transition={{ delay: 1.5, duration: 0.6 }}
      >
        <rect x="80" y="135" width="8" height="6" stroke={T.textMuted} strokeWidth="0.5" fill="none" transform="rotate(15 84 138)" />
        <rect x="110" y="140" width="6" height="5" stroke={T.textMuted} strokeWidth="0.5" fill="none" transform="rotate(-10 113 142)" />
        <rect x="95" y="145" width="5" height="4" stroke={T.textMuted} strokeWidth="0.5" fill="none" transform="rotate(25 97 147)" />
      </motion.g>
    </svg>
  )
}

/* Steel corrosion — rusting I-beam */
function SteelSVG() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* I-beam cross section */}
      <motion.path
        d="M 50 40 L 150 40 L 150 55 L 115 55 L 115 145 L 150 145 L 150 160 L 50 160 L 50 145 L 85 145 L 85 55 L 50 55 Z"
        stroke={T.charcoal}
        strokeWidth="1"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
      />
      {/* Corrosion patches */}
      <motion.ellipse cx="100" cy="80" rx="18" ry="10" fill={T.terraLight} stroke={T.terra} strokeWidth="1"
        initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1, duration: 0.8 }} />
      <motion.ellipse cx="95" cy="120" rx="14" ry="8" fill={T.terraLight} stroke={T.terra} strokeWidth="1"
        initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.3, duration: 0.8 }} />
      {/* Rust flaking indicators */}
      {[[108, 95], [88, 105], [102, 130], [112, 75]].map(([cx, cy], i) => (
        <motion.circle key={`rust-${i}`} cx={cx} cy={cy} r="2" fill={T.terra}
          initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 0.6, scale: 1 }}
          transition={{ delay: 1.8 + i * 0.15 }} />
      ))}
      {/* Section loss indicator lines */}
      <motion.path d="M 85 70 L 80 70 M 85 90 L 78 90 M 115 110 L 120 110 M 115 130 L 122 130"
        stroke={T.terra} strokeWidth="1" strokeLinecap="round" opacity="0.5"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 2, duration: 0.6 }} />
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════════
   DEFECT DATA — Content for the library
   ═══════════════════════════════════════════════════════════════ */
const DEFECT_DATA = {
  Concrete: [
    {
      id: 'concrete-spalling',
      name: 'Concrete Spalling',
      severity: 'severe',
      SVG: SpallingSVG,
      description: 'Spalling occurs when the surface layer of concrete breaks away, exposing aggregate and reinforcement steel beneath. It typically manifests as flaking, peeling, or chipping of the concrete surface.',
      causes: [
        'Corrosion of embedded reinforcing steel',
        'Freeze-thaw cycles in inadequately air-entrained concrete',
        'Chemical attack from de-icing salts or sulfates',
        'Inadequate concrete cover over reinforcement',
        'Fire damage or sustained high temperatures',
      ],
      remediation: [
        'Remove all loose and delaminated concrete to sound substrate',
        'Clean and treat exposed reinforcement with protective coatings',
        'Apply bonding agent and patch with compatible repair mortar',
        'Apply penetrating sealer to prevent future moisture ingress',
        'Implement cathodic protection for widespread corrosion cases',
      ],
    },
    {
      id: 'flexural-cracks',
      name: 'Flexural Cracking',
      severity: 'moderate',
      SVG: CrackSVG,
      description: 'Flexural cracks develop perpendicular to the tension face of concrete beams and slabs when bending stresses exceed the tensile capacity. They typically appear as vertical cracks in beam soffits.',
      causes: [
        'Excessive loading beyond design capacity',
        'Insufficient tensile reinforcement',
        'Larger-than-anticipated spans or reduced cross-sections',
        'Creep and shrinkage under sustained loads',
      ],
      remediation: [
        'Monitor crack width progression with tell-tale gauges',
        'Inject structural epoxy for cracks wider than 0.3mm',
        'Install externally bonded FRP reinforcement for strength deficiency',
        'Review and reduce applied loads where feasible',
      ],
    },
  ],
  Masonry: [
    {
      id: 'shear-cracks',
      name: 'Shear Cracks in Brick Walls',
      severity: 'severe',
      SVG: CrackSVG,
      description: 'Diagonal shear cracks typically run at approximately 45° through brick walls, following mortar joints in a stair-step pattern. They indicate significant structural distress from lateral or differential loading.',
      causes: [
        'Differential foundation settlement',
        'Seismic or lateral wind loading',
        'Inadequate shear reinforcement in masonry',
        'Thermal expansion and contraction cycles',
        'Removal of adjacent structural support',
      ],
      remediation: [
        'Stabilize and address root cause (foundation, loading)',
        'Repoint mortar joints with compatible mix design',
        'Install helical stainless steel crack stitching ties',
        'Add structural reinforcement (steel plates, FRP)',
        'Consider rebuilding severely damaged sections',
      ],
    },
    {
      id: 'mortar-deterioration',
      name: 'Mortar Joint Deterioration',
      severity: 'moderate',
      SVG: SpallingSVG,
      description: 'Progressive decay of mortar joints through weathering, chemical attack, or mechanical action. Joints erode, become friable, and lose their bonding and weatherproofing function.',
      causes: [
        'Prolonged exposure to wind-driven rain',
        'Use of incompatible or overly hard repointing mortar',
        'Freeze-thaw cycles in saturated joints',
        'Acid rain or atmospheric pollutant attack',
      ],
      remediation: [
        'Rake out deteriorated mortar to minimum 20mm depth',
        'Repoint with lime-based mortar matching original composition',
        'Ensure proper joint profile for water shedding',
        'Apply breathable water-repellent treatment if appropriate',
      ],
    },
  ],
  Steel: [
    {
      id: 'steel-corrosion',
      name: 'Reinforcement Corrosion',
      severity: 'critical',
      SVG: SteelSVG,
      description: 'Corrosion of embedded steel reinforcement causes expansion, cracking, and eventual spalling of concrete cover. It is the leading cause of structural deterioration in reinforced concrete buildings.',
      causes: [
        'Chloride ingress from de-icing salts or marine exposure',
        'Carbonation of concrete reducing alkaline protection',
        'Insufficient concrete cover over reinforcement bars',
        'Cracking allowing direct moisture and oxygen access',
      ],
      remediation: [
        'Remove contaminated and carbonated concrete to expose rebar',
        'Clean corroded reinforcement to bare metal (Sa 2½ blast)',
        'Apply protective coating or sacrificial anode system',
        'Patch with chloride-resistant repair mortar',
        'Apply surface-applied corrosion inhibitor and sealer',
      ],
    },
    {
      id: 'steel-fatigue',
      name: 'Steel Connection Fatigue',
      severity: 'severe',
      SVG: SteelSVG,
      description: 'Fatigue cracking at welded or bolted steel connections from repeated cyclic loading. Common in building frames subject to wind-induced vibrations or dynamic equipment loads.',
      causes: [
        'Cyclic stress concentrations at weld toes',
        'Vibration from mechanical equipment or traffic',
        'Poor weld quality or incomplete fusion defects',
        'Inadequate design for fatigue loading conditions',
      ],
      remediation: [
        'Conduct detailed visual and UT inspection of connections',
        'Grind and re-weld cracks with proper pre-heat protocol',
        'Install bolt-on doubler plates to reduce stress range',
        'Add vibration dampeners to reduce cyclic loading',
      ],
    },
  ],
  Foundation: [
    {
      id: 'differential-settlement',
      name: 'Differential Settlement',
      severity: 'critical',
      SVG: FoundationSVG,
      description: 'Uneven settling of a building\'s foundation causes one part to sink more than another. This creates diagonal cracks, misaligned doors and windows, and can compromise the entire structural system.',
      causes: [
        'Variable soil conditions beneath the foundation',
        'Inadequate site investigation and foundation design',
        'Changes in groundwater table or drainage patterns',
        'Adjacent excavation or construction activity',
        'Consolidation of soft clay or fill materials',
      ],
      remediation: [
        'Conduct geotechnical investigation to determine cause',
        'Install monitoring points to track ongoing movement',
        'Underpin foundations using mass concrete or mini-piles',
        'Install ground improvement (compaction grouting, jet grouting)',
        'Repair superstructure cracks after movement has stabilized',
      ],
    },
    {
      id: 'foundation-cracks',
      name: 'Foundation Wall Cracking',
      severity: 'severe',
      SVG: CrackSVG,
      description: 'Cracks in foundation walls can range from hairline shrinkage cracks to wide structural fractures. Horizontal cracks are particularly concerning as they indicate lateral pressure from soil.',
      causes: [
        'Lateral earth pressure exceeding wall capacity',
        'Hydrostatic pressure from poor drainage',
        'Frost heave in cold climates',
        'Shrinkage during concrete curing',
        'Tree root growth exerting pressure',
      ],
      remediation: [
        'Assess crack type and monitor for active movement',
        'Inject epoxy or polyurethane for waterproofing and structural bonding',
        'Install carbon fiber reinforcement strips for bowing walls',
        'Improve exterior drainage and waterproofing',
        'Consider wall anchors or braces for severe lateral displacement',
      ],
    },
  ],
}

/* Prevention checklists data */
const PREVENTION_DATA = [
  {
    title: 'Annual Foundation Inspection',
    items: [
      'Inspect all visible foundation walls for new cracks or crack growth',
      'Check basement/crawlspace for moisture, efflorescence, or staining',
      'Verify downspouts discharge at least 6 feet from foundation',
      'Ensure soil grading slopes away from building at 5% minimum',
      'Inspect sump pump operation and backup power supply',
    ],
  },
  {
    title: 'Moisture Control Protocol',
    items: [
      'Test relative humidity in all occupied spaces (target: 30–50%)',
      'Inspect roof covering, flashing, and valley details for breaches',
      'Check all plumbing supply and waste connections for leaks',
      'Verify mechanical ventilation in bathrooms, kitchens, and laundry',
      'Inspect window and door weatherstripping and caulking',
    ],
  },
  {
    title: 'Load-Bearing Wall Assessment',
    items: [
      'Document any planned modifications near load-bearing elements',
      'Inspect for new cracks around door and window headers',
      'Verify no unauthorized openings have been cut in structural walls',
      'Check for plumb and level at critical wall locations',
      'Review any recent renovation work for structural compliance',
    ],
  },
  {
    title: 'Exterior Envelope Review',
    items: [
      'Inspect mortar joints in masonry for erosion or cracking',
      'Check cladding connections and fasteners for corrosion',
      'Examine expansion joints and sealant condition',
      'Inspect structural steel connections for rust or paint failure',
      'Verify drainage planes and weep holes are unobstructed',
    ],
  },
]


/* ═══════════════════════════════════════════════════════════════
   NAVBAR
   ═══════════════════════════════════════════════════════════════ */
function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const links = [
    { label: 'Library', href: '#defect-library' },
    { label: 'Prevention', href: '#prevention' },
    { label: 'Contact', href: '#contact' },
  ]

  return (
    <motion.nav
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md"
      style={{ borderBottom: `1px solid ${T.borderLight}` }}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: T.charcoal }}
          >
            <Shield className="h-4 w-4" style={{ color: T.white }} />
          </div>
          <span className="text-sm font-bold tracking-tight" style={{ color: T.charcoal }}>
            BuildGuard<span style={{ color: T.terra }}>AI</span>
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-10">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-xs font-medium uppercase tracking-[0.12em] transition-colors duration-200"
              style={{ color: T.textSecondary }}
              onMouseEnter={(e) => (e.target.style.color = T.charcoal)}
              onMouseLeave={(e) => (e.target.style.color = T.textSecondary)}
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA + Mobile menu */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="hidden sm:flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold uppercase tracking-[0.08em] transition-all duration-200 hover:shadow-lg"
            style={{ background: T.charcoal, color: T.white }}
          >
            Dashboard
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{ color: T.charcoal }}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden bg-white border-t"
            style={{ borderColor: T.borderLight }}
          >
            <div className="px-6 py-4 space-y-3">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="block text-sm font-medium py-2"
                  style={{ color: T.textSecondary }}
                >
                  {l.label}
                </a>
              ))}
              <button
                onClick={() => { setMenuOpen(false); navigate('/dashboard') }}
                className="w-full mt-2 py-2.5 rounded-lg text-sm font-semibold"
                style={{ background: T.charcoal, color: T.white }}
              >
                Open Dashboard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}


/* ═══════════════════════════════════════════════════════════════
   HERO SECTION
   ═══════════════════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section id="hero" className="min-h-screen flex items-center pt-16" style={{ background: T.white }}>
      <div className="max-w-6xl mx-auto px-6 py-24 md:py-32 lg:py-40 w-full">
        <div className="max-w-3xl">
          {/* Sub-header */}
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] mb-6"
            style={{ color: T.terra }}
          >
            Structural Health Resource
          </motion.p>

          {/* Massive headline */}
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-extrabold leading-[1.05] tracking-tight"
            style={{ color: T.charcoal }}
          >
            Identify &{' '}
            <br className="hidden sm:block" />
            Understand{' '}
            <br className="hidden lg:block" />
            Structural{' '}
            <span style={{ color: T.terra }}>Building Defects.</span>
          </motion.h1>

          {/* Subtle paragraph */}
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="mt-8 text-base sm:text-lg leading-relaxed max-w-xl"
            style={{ color: T.textSecondary }}
          >
            A comprehensive, engineer-grade reference for identifying, understanding,
            and remediating structural defects in residential and commercial buildings.
            Built for homeowners and professionals.
          </motion.p>

          {/* CTA */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
            className="mt-10 flex flex-col sm:flex-row items-start gap-4"
          >
            <a
              href="#defect-library"
              className="inline-flex items-center gap-3 px-8 py-3.5 rounded-lg text-sm font-semibold uppercase tracking-[0.06em] transition-all duration-300 hover:shadow-xl group"
              style={{ background: T.terra, color: T.white }}
              onMouseEnter={(e) => (e.currentTarget.style.background = T.terraHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = T.terra)}
            >
              Explore Library
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#prevention"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg text-sm font-medium transition-colors"
              style={{ color: T.textSecondary, border: `1px solid ${T.border}` }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.charcoal; e.currentTarget.style.color = T.charcoal }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSecondary }}
            >
              Prevention Guide
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}


/* ═══════════════════════════════════════════════════════════════
   QUICK INDEX — Typographic list cards
   ═══════════════════════════════════════════════════════════════ */
function QuickIndex() {
  const items = [
    { label: 'Cracks', count: '8 defect types', desc: 'Shear, flexural, settlement, and thermal cracking patterns' },
    { label: 'Foundation Settling', count: '4 defect types', desc: 'Differential settlement, heave, and lateral displacement' },
    { label: 'Concrete Spalling', count: '3 defect types', desc: 'Surface delamination, rebar corrosion, and freeze-thaw damage' },
    { label: 'Steel Corrosion', count: '4 defect types', desc: 'Reinforcement corrosion, connection fatigue, and section loss' },
  ]

  return (
    <section className="py-24 md:py-32" style={{ background: T.offWhite }}>
      <div className="max-w-6xl mx-auto px-6">
        <AnimatedSection>
          <motion.p
            variants={fadeUp}
            custom={0}
            className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-4"
            style={{ color: T.terra }}
          >
            Quick Index
          </motion.p>
          <motion.h2
            variants={fadeUp}
            custom={1}
            className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-16"
            style={{ color: T.charcoal }}
          >
            Common Structural Issues
          </motion.h2>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {items.map((item, i) => (
            <AnimatedSection key={item.label}>
              <motion.a
                variants={fadeUp}
                custom={i}
                href="#defect-library"
                className="group block p-8 transition-all duration-300"
                style={{
                  border: `1px solid ${T.border}`,
                  marginTop: i >= 2 ? '-1px' : 0,
                  marginLeft: i % 2 === 1 ? '-1px' : 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = T.white
                  e.currentTarget.style.borderColor = T.terra
                  e.currentTarget.style.zIndex = '1'
                  e.currentTarget.style.position = 'relative'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.borderColor = T.border
                  e.currentTarget.style.zIndex = '0'
                  e.currentTarget.style.position = 'static'
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3
                      className="text-xl font-bold mb-2 group-hover:text-terra-600 transition-colors"
                      style={{ color: T.charcoal }}
                    >
                      {item.label}
                    </h3>
                    <p className="text-sm leading-relaxed max-w-xs" style={{ color: T.textSecondary }}>
                      {item.desc}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-4">
                    <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: T.textMuted }}>
                      {item.count}
                    </span>
                    <ChevronRight
                      className="h-5 w-5 group-hover:translate-x-1 transition-transform"
                      style={{ color: T.textMuted }}
                    />
                  </div>
                </div>
              </motion.a>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}


/* ═══════════════════════════════════════════════════════════════
   DEFECT LIBRARY — Tabbed navigation + data view
   ═══════════════════════════════════════════════════════════════ */
function DefectLibrary() {
  const tabs = Object.keys(DEFECT_DATA)
  const [activeTab, setActiveTab] = useState(tabs[0])
  const [selectedDefect, setSelectedDefect] = useState(0)
  const defects = DEFECT_DATA[activeTab]
  const defect = defects[selectedDefect]
  const SvgComponent = defect.SVG

  const severityLabels = { low: 'Low', moderate: 'Moderate', severe: 'Severe', critical: 'Critical' }

  return (
    <section id="defect-library" className="py-24 md:py-32" style={{ background: T.white }}>
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <AnimatedSection>
          <motion.p
            variants={fadeUp}
            custom={0}
            className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-4"
            style={{ color: T.terra }}
          >
            Defect Library
          </motion.p>
          <motion.h2
            variants={fadeUp}
            custom={1}
            className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-12"
            style={{ color: T.charcoal }}
          >
            Structural Defect Reference
          </motion.h2>
        </AnimatedSection>

        {/* Tab navigation */}
        <div
          className="flex gap-0 overflow-x-auto mb-12 sticky top-16 z-30 bg-white pb-4 pt-2 -mx-6 px-6"
          style={{ borderBottom: `1px solid ${T.border}` }}
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSelectedDefect(0) }}
              className="relative px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-200 whitespace-nowrap"
              style={{
                color: activeTab === tab ? T.terra : T.textMuted,
              }}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeDefectTab"
                  className="absolute bottom-0 left-0 right-0 h-[2px]"
                  style={{ background: T.terra }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Defect selector (if multiple) */}
        {defects.length > 1 && (
          <div className="flex gap-3 mb-10 overflow-x-auto pb-2">
            {defects.map((d, i) => (
              <button
                key={d.id}
                onClick={() => setSelectedDefect(i)}
                className="px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200"
                style={{
                  background: selectedDefect === i ? T.charcoal : 'transparent',
                  color: selectedDefect === i ? T.white : T.textSecondary,
                  border: `1px solid ${selectedDefect === i ? T.charcoal : T.border}`,
                }}
              >
                {d.name}
              </button>
            ))}
          </div>
        )}

        {/* Defect detail view */}
        <AnimatePresence mode="wait">
          <motion.div
            key={defect.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16"
          >
            {/* SVG illustration */}
            <div className="lg:col-span-2 flex items-center justify-center">
              <div
                className="w-full max-w-[280px] aspect-square rounded-lg p-6"
                style={{ background: T.offWhite, border: `1px solid ${T.borderLight}` }}
              >
                <SvgComponent />
              </div>
            </div>

            {/* Data grid */}
            <div className="lg:col-span-3 space-y-8">
              {/* Title + severity */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-2xl font-bold" style={{ color: T.charcoal }}>{defect.name}</h3>
                  <span className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                    style={{
                      background: T.terraLight,
                      color: T.terra,
                    }}
                  >
                    <span className={`severity-dot ${defect.severity}`} />
                    {severityLabels[defect.severity]}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: T.textSecondary }}>{defect.description}</p>
              </div>

              {/* Root causes */}
              <div>
                <h4
                  className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-4"
                  style={{ color: T.terra }}
                >
                  Root Causes
                </h4>
                <ul className="space-y-2.5">
                  {defect.causes.map((cause, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm" style={{ color: T.textSecondary }}>
                      <span
                        className="w-1 h-1 rounded-full mt-2 flex-shrink-0"
                        style={{ background: T.terra }}
                      />
                      {cause}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Remediation */}
              <div style={{ borderTop: `1px solid ${T.borderLight}`, paddingTop: '2rem' }}>
                <h4
                  className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-4"
                  style={{ color: T.terra }}
                >
                  Remediation
                </h4>
                <ol className="space-y-2.5">
                  {defect.remediation.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm" style={{ color: T.textSecondary }}>
                      <span
                        className="text-[10px] font-bold mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: T.terraLight, color: T.terra }}
                      >
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}


/* ═══════════════════════════════════════════════════════════════
   PREVENTION & MAINTENANCE — Accordions + checklists
   ═══════════════════════════════════════════════════════════════ */
function PreventionSection() {
  const [openAccordion, setOpenAccordion] = useState(0)
  const [checkedItems, setCheckedItems] = useState({})

  const toggleCheck = (sectionIdx, itemIdx) => {
    const key = `${sectionIdx}-${itemIdx}`
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const getProgress = (sectionIdx, totalItems) => {
    let checked = 0
    for (let i = 0; i < totalItems; i++) {
      if (checkedItems[`${sectionIdx}-${i}`]) checked++
    }
    return checked
  }

  return (
    <section id="prevention" className="py-24 md:py-32" style={{ background: T.offWhite }}>
      <div className="max-w-3xl mx-auto px-6">
        <AnimatedSection>
          <motion.p
            variants={fadeUp}
            custom={0}
            className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-4"
            style={{ color: T.terra }}
          >
            Maintenance Protocols
          </motion.p>
          <motion.h2
            variants={fadeUp}
            custom={1}
            className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4"
            style={{ color: T.charcoal }}
          >
            Prevention & Maintenance
          </motion.h2>
          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-sm leading-relaxed mb-14"
            style={{ color: T.textSecondary }}
          >
            Regular inspection and proactive maintenance are the most effective ways to prevent
            structural defects from developing. Use these checklists as a guide.
          </motion.p>
        </AnimatedSection>

        {/* Accordions */}
        <div className="space-y-0">
          {PREVENTION_DATA.map((section, si) => {
            const isOpen = openAccordion === si
            const progress = getProgress(si, section.items.length)

            return (
              <AnimatedSection key={section.title}>
                <motion.div
                  variants={fadeUp}
                  custom={si}
                  style={{ borderBottom: `1px solid ${T.border}` }}
                >
                  {/* Accordion header */}
                  <button
                    onClick={() => setOpenAccordion(isOpen ? -1 : si)}
                    className="w-full flex items-center justify-between py-6 text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold" style={{ color: T.charcoal }}>
                        {section.title}
                      </span>
                      {progress > 0 && (
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{ background: T.terraLight, color: T.terra }}
                        >
                          {progress}/{section.items.length}
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      className="h-4 w-4 transition-transform duration-300"
                      style={{
                        color: T.textMuted,
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  </button>

                  {/* Accordion content */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="pb-8 space-y-3">
                          {section.items.map((item, ii) => {
                            const key = `${si}-${ii}`
                            const isChecked = !!checkedItems[key]
                            return (
                              <button
                                key={ii}
                                onClick={() => toggleCheck(si, ii)}
                                className="w-full flex items-start gap-4 py-2 text-left group"
                              >
                                {/* Custom toggle */}
                                <div
                                  className="w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center transition-all duration-200"
                                  style={{
                                    border: `1.5px solid ${isChecked ? T.terra : T.border}`,
                                    background: isChecked ? T.terra : 'transparent',
                                  }}
                                >
                                  {isChecked && (
                                    <motion.svg
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="w-3 h-3"
                                      viewBox="0 0 12 12"
                                      fill="none"
                                    >
                                      <path
                                        d="M2.5 6L5 8.5L9.5 3.5"
                                        stroke="white"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </motion.svg>
                                  )}
                                </div>
                                <span
                                  className="text-sm leading-relaxed transition-all duration-200"
                                  style={{
                                    color: isChecked ? T.textMuted : T.textSecondary,
                                    textDecoration: isChecked ? 'line-through' : 'none',
                                  }}
                                >
                                  {item}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </AnimatedSection>
            )
          })}
        </div>
      </div>
    </section>
  )
}


/* ═══════════════════════════════════════════════════════════════
   CONTACT / PROFESSIONAL HELP
   ═══════════════════════════════════════════════════════════════ */
function ContactSection() {
  const [formState, setFormState] = useState({ name: '', email: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
    setFormState({ name: '', email: '', message: '' })
  }

  return (
    <section id="contact" className="py-24 md:py-32" style={{ background: T.white }}>
      <div className="max-w-2xl mx-auto px-6">
        <AnimatedSection>
          <motion.p
            variants={fadeUp}
            custom={0}
            className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-4"
            style={{ color: T.terra }}
          >
            Get Expert Help
          </motion.p>
          <motion.h2
            variants={fadeUp}
            custom={1}
            className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4"
            style={{ color: T.charcoal }}
          >
            Contact a Professional
          </motion.h2>
          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-sm leading-relaxed mb-14"
            style={{ color: T.textSecondary }}
          >
            If you've identified potential structural issues, we strongly recommend consulting
            a licensed structural engineer for a thorough assessment.
          </motion.p>
        </AnimatedSection>

        <AnimatedSection>
          <motion.form
            variants={fadeUp}
            custom={3}
            onSubmit={handleSubmit}
            className="space-y-10"
          >
            {/* Name field */}
            <div className="lp-field">
              <input
                type="text"
                id="contact-name"
                placeholder=" "
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                required
              />
              <label htmlFor="contact-name">Full Name</label>
            </div>

            {/* Email field */}
            <div className="lp-field">
              <input
                type="email"
                id="contact-email"
                placeholder=" "
                value={formState.email}
                onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                required
              />
              <label htmlFor="contact-email">Email Address</label>
            </div>

            {/* Message field */}
            <div className="lp-field">
              <textarea
                id="contact-message"
                placeholder=" "
                rows={4}
                value={formState.message}
                onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                required
                style={{ resize: 'none' }}
              />
              <label htmlFor="contact-message">Describe the Issue</label>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-between pt-4">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-lg text-sm font-semibold uppercase tracking-[0.06em] transition-all duration-300 hover:shadow-lg group"
                style={{ background: T.terra, color: T.white }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.terraHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = T.terra)}
              >
                {submitted ? 'Sent!' : 'Send Inquiry'}
                <Send className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Disclaimer */}
            <p className="text-[11px] leading-relaxed mt-6" style={{ color: T.textMuted }}>
              This form is for informational purposes only. Structural assessments must be performed
              by a licensed structural engineer (PE/SE). BuildGuard AI does not provide engineering
              services or professional structural advice. Always consult a qualified professional
              before undertaking any structural repair work.
            </p>
          </motion.form>
        </AnimatedSection>
      </div>
    </section>
  )
}


/* ═══════════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${T.border}`, background: T.offWhite }}>
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center"
                style={{ background: T.charcoal }}
              >
                <Shield className="h-3.5 w-3.5" style={{ color: T.white }} />
              </div>
              <span className="text-sm font-bold tracking-tight" style={{ color: T.charcoal }}>
                BuildGuard<span style={{ color: T.terra }}>AI</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed max-w-xs" style={{ color: T.textMuted }}>
              Comprehensive structural health monitoring and defect identification
              powered by AI. A resource for safer structures.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-10">
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-3" style={{ color: T.charcoal }}>
                Resources
              </h4>
              <ul className="space-y-2">
                {['Defect Library', 'Prevention Guide', 'Contact'].map((l) => (
                  <li key={l}>
                    <a href="#" className="text-xs transition-colors" style={{ color: T.textMuted }}
                      onMouseEnter={(e) => (e.target.style.color = T.charcoal)}
                      onMouseLeave={(e) => (e.target.style.color = T.textMuted)}
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-3" style={{ color: T.charcoal }}>
                Platform
              </h4>
              <ul className="space-y-2">
                {['Dashboard', 'Sensor Analysis', 'Image Analysis'].map((l) => (
                  <li key={l}>
                    <a href="#" className="text-xs transition-colors" style={{ color: T.textMuted }}
                      onMouseEnter={(e) => (e.target.style.color = T.charcoal)}
                      onMouseLeave={(e) => (e.target.style.color = T.textMuted)}
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderTop: `1px solid ${T.border}` }}
        >
          <p className="text-[10px]" style={{ color: T.textMuted }}>
            © {new Date().getFullYear()} BuildGuard AI. All rights reserved.
          </p>
          <p className="text-[10px]" style={{ color: T.textMuted }}>
            Built for structural safety. Not a substitute for professional engineering advice.
          </p>
        </div>
      </div>
    </footer>
  )
}


/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE — Composed
   ═══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div className="landing-page min-h-screen overflow-x-hidden" style={{ background: T.white, color: T.charcoal }}>
      <Navbar />
      <HeroSection />
      <QuickIndex />
      <DefectLibrary />
      <PreventionSection />
      <ContactSection />
      <Footer />
    </div>
  )
}
