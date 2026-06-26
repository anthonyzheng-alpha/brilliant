export type ProblemType =
  | 'multiple-choice'
  | 'drag-drop'
  | 'numeric'
  | 'slider'
  | 'tap-sequence'
  | 'line-equation'
  | 'factoring'

export type VisualKind =
  | 'none'
  | 'balance-scale'
  | 'sequence-grid'
  | 'coordinate-graph'
  | 'input-output-machine'
  | 'rate-comparison'
  | 'scenario-illustration'
  | 'factoring-expression'

export type RichText = string

export type ValidationRule =
  | { type: 'exact'; value: string }
  | { type: 'numeric'; value: number; tolerance?: number }
  | { type: 'numeric-set'; values: number[]; tolerance?: number }
  | { type: 'expression'; acceptable: string[] }

export type MultipleChoiceInteraction = {
  options: { id: string; label: RichText; whyWrong?: RichText }[]
  correctOptionId: string
}

export type DragDropInteraction = {
  draggables: { id: string; label: RichText }[]
  dropZones: { id: string; label?: RichText; accepts?: string[] }[]
  correctPlacement: Record<string, string>
}

export type NumericInteraction = {
  placeholder?: string
  unit?: string
  validation: ValidationRule
}

export type SliderInteraction = {
  min: number
  max: number
  step: number
  target: number
  tolerance?: number
  label?: string
}

export type TapSequenceInteraction = {
  cells: { id: string; label: RichText }[]
  correctCellIds: string[]
  multiSelect?: boolean
}

export type LineEquationInteraction = {
  slopePlaceholder?: string
  interceptPlaceholder?: string
  targetSlope: number
  targetIntercept: number
  tolerance?: number
}

export type FactoringInteraction = {
  draggables: { id: string; label: RichText }[]
  dropZones: { id: string; label?: RichText }[]
  correctPlacement: Record<string, string>
  acceptCommutative?: boolean
}

export type InteractionConfig =
  | { type: 'multiple-choice'; data: MultipleChoiceInteraction }
  | { type: 'drag-drop'; data: DragDropInteraction }
  | { type: 'numeric'; data: NumericInteraction }
  | { type: 'slider'; data: SliderInteraction }
  | { type: 'tap-sequence'; data: TapSequenceInteraction }
  | { type: 'line-equation'; data: LineEquationInteraction }
  | { type: 'factoring'; data: FactoringInteraction }

export type Problem = {
  id: string
  type: ProblemType
  prompt: RichText
  visual?: { kind: VisualKind; props: Record<string, unknown> }
  interaction: InteractionConfig
  hints: RichText[]
  explanation: RichText
  misconception?: RichText
  introNotation?: boolean
}

export type MiniLessonExample = {
  prompt: RichText
  visual?: { kind: VisualKind; props: Record<string, unknown> }
  interaction: InteractionConfig
  explanation: RichText
}

export type MiniLesson = {
  title?: RichText
  paragraph: RichText
  example: MiniLessonExample
}

export type Round = {
  id: string
  label: string
  problemIds: string[]
  sampleSize?: number
  miniLesson?: MiniLesson
}

export type Lesson = {
  id: string
  unitId: string
  title: string
  description: string
  estimatedMinutes: number
  phase: 'M0' | 'M1' | 'M2' | 'M3'
  rounds: Round[]
}

export type Unit = {
  id: string
  courseId: string
  title: string
  description: string
  order: number
  phase: 'M0' | 'M1' | 'M2' | 'M3'
  lessonIds: string[]
}

export type Course = {
  id: string
  slug: string
  title: string
  subtitle: string
  description: RichText
  lens: 'solving-equations' | 'visual-algebra' | 'real-world-algebra' | 'factoring' | 'roots-of-polynomials'
  unitIds: string[]
  lockedUntilPhase: 'M0' | 'M2'
}

export type CourseProgress = {
  completedLessons: string[]
  lastLessonId?: string
  lastProblemIndex?: number
  lessonProgress?: Record<string, number>
}

export type ProgressState = {
  version: number
  courses: Record<string, CourseProgress>
}

// Maps a round id to the problem ids selected for the current lesson run.
export type LessonVariant = Record<string, string[]>

export type GamificationState = {
  version: number
  currentStreak: number
  longestStreak: number
  lastActiveDate: string | null
  activeDates: string[]
  lessonMilestones: Record<string, { earnedAt: string }>
  badges: string[]
}

// Per-skill record of how often the learner missed a given topic + question type.
// The skill key is `${lessonId}::${roundId}::${problemType}` (round encodes the
// specific difficulty band). Legacy 2-part keys `${lessonId}::${problemType}`
// from before per-round tracking are still read for backward compatibility.
export type SkillStat = {
  attempts: number
  incorrect: number
  lastSeenISO: string
}

export type StruggleState = {
  version: number
  skills: Record<string, SkillStat>
}

export type AnswerValue =
  | { type: 'multiple-choice'; selectedId: string }
  | { type: 'drag-drop'; placement: Record<string, string> }
  | { type: 'numeric'; value: string }
  | { type: 'slider'; value: number }
  | { type: 'tap-sequence'; selectedIds: string[] }
  | { type: 'line-equation'; slope: string; intercept: string }
  | { type: 'factoring'; placement: Record<string, string> }
