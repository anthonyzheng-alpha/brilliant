import { z } from 'zod'

const richText = z.string()
// Problems may carry 1-3 progressive hints; the UI reveals them by length.
const hints = z.array(richText).min(1)

const validationRule = z.discriminatedUnion('type', [
  z.object({ type: z.literal('exact'), value: z.string() }),
  z.object({
    type: z.literal('numeric'),
    value: z.number(),
    tolerance: z.number().optional(),
  }),
  z.object({
    type: z.literal('numeric-set'),
    values: z.array(z.number()),
    tolerance: z.number().optional(),
  }),
  z.object({ type: z.literal('expression'), acceptable: z.array(z.string()) }),
])

const interaction = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('multiple-choice'),
    data: z.object({
      options: z.array(
        z.object({ id: z.string(), label: richText, whyWrong: richText.optional() }),
      ),
      correctOptionId: z.string(),
    }),
  }),
  z.object({
    type: z.literal('drag-drop'),
    data: z.object({
      draggables: z.array(z.object({ id: z.string(), label: richText })),
      dropZones: z.array(
        z.object({
          id: z.string(),
          label: richText.optional(),
          accepts: z.array(z.string()).optional(),
        }),
      ),
      correctPlacement: z.record(z.string(), z.string()),
    }),
  }),
  z.object({
    type: z.literal('numeric'),
    data: z.object({
      placeholder: z.string().optional(),
      unit: z.string().optional(),
      validation: validationRule,
    }),
  }),
  z.object({
    type: z.literal('slider'),
    data: z.object({
      min: z.number(),
      max: z.number(),
      step: z.number(),
      target: z.number(),
      tolerance: z.number().optional(),
      label: z.string().optional(),
    }),
  }),
  z.object({
    type: z.literal('tap-sequence'),
    data: z.object({
      cells: z.array(z.object({ id: z.string(), label: richText })),
      correctCellIds: z.array(z.string()),
      multiSelect: z.boolean().optional(),
    }),
  }),
  z.object({
    type: z.literal('line-equation'),
    data: z.object({
      slopePlaceholder: z.string().optional(),
      interceptPlaceholder: z.string().optional(),
      targetSlope: z.number(),
      targetIntercept: z.number(),
      tolerance: z.number().optional(),
    }),
  }),
  z.object({
    type: z.literal('factoring'),
    data: z.object({
      draggables: z.array(z.object({ id: z.string(), label: richText })),
      dropZones: z.array(
        z.object({
          id: z.string(),
          label: richText.optional(),
        }),
      ),
      correctPlacement: z.record(z.string(), z.string()),
      acceptCommutative: z.boolean().optional(),
    }),
  }),
])

const visualSchema = z
  .object({
    kind: z.string(),
    props: z.record(z.string(), z.unknown()),
  })

const miniLessonSchema = z.object({
  title: richText.optional(),
  paragraph: richText,
  example: z.object({
    prompt: richText,
    visual: visualSchema.optional(),
    interaction: interaction,
    explanation: richText,
  }),
})

export const problemSchema = z.object({
  id: z.string(),
  type: z.enum([
    'multiple-choice',
    'drag-drop',
    'numeric',
    'slider',
    'tap-sequence',
    'line-equation',
    'factoring',
  ]),
  prompt: richText,
  visual: z
    .object({
      kind: z.string(),
      props: z.record(z.string(), z.unknown()),
    })
    .optional(),
  interaction: interaction,
  hints,
  explanation: richText,
  misconception: richText.optional(),
  introNotation: z.boolean().optional(),
})

export const lessonSchema = z.object({
  id: z.string(),
  unitId: z.string(),
  title: z.string(),
  description: z.string(),
  estimatedMinutes: z.number(),
  phase: z.enum(['M0', 'M1', 'M2', 'M3']),
  rounds: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        problemIds: z.array(z.string()).min(1),
        sampleSize: z.number().int().positive().optional(),
        miniLesson: miniLessonSchema.optional(),
      }),
    )
    .min(1),
})

export const unitSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  title: z.string(),
  description: z.string(),
  order: z.number(),
  phase: z.enum(['M0', 'M1', 'M2', 'M3']),
  lessonIds: z.array(z.string()),
})

export const courseSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  subtitle: z.string(),
  description: richText,
  lens: z.enum(['solving-equations', 'visual-algebra', 'real-world-algebra', 'factoring']),
  unitIds: z.array(z.string()),
  lockedUntilPhase: z.enum(['M0', 'M2']),
})
