import { courses, getAllLessonsForCourse } from '../content'

// A course is unlocked when it's the first course in display order, or the
// course immediately before it (in that order) has all of its lessons complete.
export function isCourseUnlocked(
  courseId: string,
  isCourseComplete: (courseId: string, lessonIds: string[]) => boolean,
): boolean {
  const idx = courses.findIndex((c) => c.id === courseId)
  if (idx <= 0) return true
  const prev = courses[idx - 1]
  const prevLessonIds = getAllLessonsForCourse(prev.id).map((l) => l.id)
  return isCourseComplete(prev.id, prevLessonIds)
}
