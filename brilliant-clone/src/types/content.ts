export type ProblemType =
  | 'multiple-choice'
  | 'drag-drop'
  | 'numeric'
  | 'slider'
  | 'tap-sequence'

export type VisualKind =
  | 'none'
  | 'balance-scale'
  | 'sequence-grid'
  | 'coordinate-graph'
  | 'input-output-machine'
  | 'rate-comparison'
  | 'scenario-illustration'

export type RichText = string

export type ValidationRule =
  | { type: 'exact'; value: string }
  | { type: 'numeric'; value: number; tolerance?: number }
  | { type: 'numeric-set'; values: number[]; tolerance?: number }
  | { type: 'expression'; acceptable: string[] }

export type MultipleChoiceInteraction = {
  options: { id: string; label: RichText }[]
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

export type InteractionConfig =
  | { type: 'multiple-choice'; data: MultipleChoiceInteraction }
  | { type: 'drag-drop'; data: DragDropInteraction }
  | { type: 'numeric'; data: NumericInteraction }
  | { type: 'slider'; data: SliderInteraction }
  | { type: 'tap-sequence'; data: TapSequenceInteraction }

export type Problem = {
  id: string
  type: ProblemType
  prompt: RichText
  visual?: { kind: VisualKind; props: Record<string, unknown> }
  interaction: InteractionConfig
  hints: [RichText, RichText, RichText]
  explanation: RichText
  introNotation?: boolean
}

export type Lesson = {
  id: string
  unitId: string
  title: string
  description: string
  estimatedMinutes: number
  phase: 'M0' | 'M1' | 'M2' | 'M3'
  problemIds: string[]
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
  estimatedHours: number
  lens: 'solving-equations' | 'visual-algebra' | 'real-world-algebra'
  unitIds: string[]
  lockedUntilPhase: 'M0' | 'M2'
}

export type CourseProgress = {
  completedLessons: string[]
  lastLessonId?: string
  lastProblemIndex?: number
}

export type ProgressState = {
  version: number
  courses: Record<string, CourseProgress>
}

export type GamificationState = {
  version: number
  currentStreak: number
  longestStreak: number
  lastActiveDate: string | null
  lessonMilestones: Record<string, { earnedAt: string }>
  badges: string[]
}

export type AnswerValue =
  | { type: 'multiple-choice'; selectedId: string }
  | { type: 'drag-drop'; placement: Record<string, string> }
  | { type: 'numeric'; value: string }
  | { type: 'slider'; value: number }
  | { type: 'tap-sequence'; selectedIds: string[] }
