/**
 * Vietnamese National Curriculum (GDPT 2018)
 * Textbook Units & Target Vocabulary / Grammar Database
 * Standardized according to Global Success (NXB Giáo dục Việt Nam) and modern curricula
 * Covering Grades 1 through 12 completely without omitting any units!
 */

import { TargetUnitItem, TargetKeywordItem, GrammarPatternItem } from './units/unitTypes';
import { GRADE_1_UNITS } from './units/grade1';
import { GRADE_2_UNITS } from './units/grade2';
import { GRADE_3_UNITS } from './units/grade3';
import { GRADE_4_UNITS } from './units/grade4';
import { GRADE_5_UNITS } from './units/grade5';
import { GRADE_6_UNITS } from './units/grade6';
import { GRADE_7_UNITS } from './units/grade7';
import { GRADE_8_UNITS } from './units/grade8';
import { GRADE_9_UNITS } from './units/grade9';
import { GRADE_10_UNITS } from './units/grade10';
import { GRADE_11_UNITS } from './units/grade11';
import { GRADE_12_UNITS } from './units/grade12';

export type { TargetUnitItem, TargetKeywordItem, GrammarPatternItem };

// Combine all units into master database (Grades 1 through 12 complete)
export const TEXTBOOK_UNITS_DATABASE: TargetUnitItem[] = [
  ...GRADE_1_UNITS,
  ...GRADE_2_UNITS,
  ...GRADE_3_UNITS,
  ...GRADE_4_UNITS,
  ...GRADE_5_UNITS,
  ...GRADE_6_UNITS,
  ...GRADE_7_UNITS,
  ...GRADE_8_UNITS,
  ...GRADE_9_UNITS,
  ...GRADE_10_UNITS,
  ...GRADE_11_UNITS,
  ...GRADE_12_UNITS,
];

/**
 * Returns units filtered by grade, sorted chronologically by unitNumber
 */
export function getUnitsByGrade(gradeNumber: number): TargetUnitItem[] {
  const matched = TEXTBOOK_UNITS_DATABASE.filter((u) => u.grade === gradeNumber);
  if (matched.length > 0) {
    return matched.sort((a, b) => a.unitNumber - b.unitNumber);
  }

  // Fallback to nearest level
  if (gradeNumber <= 5) {
    return TEXTBOOK_UNITS_DATABASE.filter((u) => u.grade <= 5).sort((a, b) => a.unitNumber - b.unitNumber);
  } else if (gradeNumber <= 9) {
    return TEXTBOOK_UNITS_DATABASE.filter((u) => u.grade >= 6 && u.grade <= 9).sort((a, b) => a.unitNumber - b.unitNumber);
  } else {
    return TEXTBOOK_UNITS_DATABASE.filter((u) => u.grade >= 10).sort((a, b) => a.unitNumber - b.unitNumber);
  }
}

/**
 * Helper to retrieve a single unit by ID
 */
export function getUnitById(id: string): TargetUnitItem | undefined {
  return TEXTBOOK_UNITS_DATABASE.find((u) => u.id === id);
}
