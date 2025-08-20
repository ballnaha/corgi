/**
 * Vaccination schedule utilities for puppies
 */

export interface VaccinationSchedule {
  firstVaccineDate: Date | null; // 8 weeks
  secondVaccineDate: Date | null; // 12 weeks
  isFirstDue: boolean;
  isSecondDue: boolean;
  ageInWeeks: number;
}

export interface VaccinationInfo {
  status: 'NONE' | 'FIRST_DONE' | 'SECOND_DONE';
  schedule: VaccinationSchedule;
  isOverdue: boolean;
}

/**
 * Calculate vaccination schedule based on birth date
 */
export function calculateVaccinationSchedule(birthDate: Date): VaccinationSchedule {
  const birth = new Date(birthDate);
  const today = new Date();
  
  // Calculate age in weeks
  const ageInMillis = today.getTime() - birth.getTime();
  const ageInWeeks = Math.floor(ageInMillis / (7 * 24 * 60 * 60 * 1000));
  
  // First vaccine at 8 weeks
  const firstVaccineDate = new Date(birth);
  firstVaccineDate.setDate(birth.getDate() + (8 * 7));
  
  // Second vaccine at 12 weeks
  const secondVaccineDate = new Date(birth);
  secondVaccineDate.setDate(birth.getDate() + (12 * 7));
  
  return {
    firstVaccineDate,
    secondVaccineDate,
    isFirstDue: ageInWeeks >= 8,
    isSecondDue: ageInWeeks >= 12,
    ageInWeeks
  };
}

/**
 * Get complete vaccination information for a puppy
 */
export function getVaccinationInfo(
  birthDate: Date | null,
  vaccineStatus: 'NONE' | 'FIRST_DONE' | 'SECOND_DONE' | null,
  firstVaccineDate?: Date | null,
  secondVaccineDate?: Date | null
): VaccinationInfo | null {
  if (!birthDate) return null;
  
  const schedule = calculateVaccinationSchedule(birthDate);
  const status = vaccineStatus || 'NONE';
  
  const today = new Date();
  let isOverdue = false;
  
  // Check if overdue based on current status
  if (status === 'NONE' && schedule.isFirstDue) {
    const daysSinceFirstDue = Math.floor(
      (today.getTime() - schedule.firstVaccineDate!.getTime()) / (24 * 60 * 60 * 1000)
    );
    isOverdue = daysSinceFirstDue > 7; // Overdue after 1 week
  } else if (status === 'FIRST_DONE' && schedule.isSecondDue) {
    const daysSinceSecondDue = Math.floor(
      (today.getTime() - schedule.secondVaccineDate!.getTime()) / (24 * 60 * 60 * 1000)
    );
    isOverdue = daysSinceSecondDue > 7; // Overdue after 1 week
  }
  
  return {
    status,
    schedule,
    isOverdue
  };
}

/**
 * Format date for Thai display
 */
export function formatThaiDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Bangkok'
  };
  
  return new Intl.DateTimeFormat('th-TH', options).format(date);
}

/**
 * Get vaccination status display text
 */
export function getVaccineStatusText(
  status: 'NONE' | 'FIRST_DONE' | 'SECOND_DONE' | null
): string {
  switch (status) {
    case 'FIRST_DONE':
      return 'ฉีดเข็มที่ 1 แล้ว';
    case 'SECOND_DONE':
      return 'ฉีดครบ 2 เข็มแล้ว';
    case 'NONE':
    default:
      return 'ยังไม่ได้ฉีดวัคซีน';
  }
}

/**
 * Get next vaccination due text
 */
export function getNextVaccineDueText(info: VaccinationInfo): string {
  const { status, schedule, isOverdue } = info;
  
  if (status === 'SECOND_DONE') {
    return 'ฉีดวัคซีนครบแล้ว';
  }
  
  if (status === 'NONE') {
    if (!schedule.isFirstDue) {
      return `เข็มที่ 1 กำหนดวันที่ ${formatThaiDate(schedule.firstVaccineDate!)}`;
    } else if (isOverdue) {
      return 'เข็มที่ 1 เกินกำหนดแล้ว';
    } else {
      return 'ถึงเวลาฉีดเข็มที่ 1 แล้ว';
    }
  }
  
  if (status === 'FIRST_DONE') {
    if (!schedule.isSecondDue) {
      return `เข็มที่ 2 กำหนดวันที่ ${formatThaiDate(schedule.secondVaccineDate!)}`;
    } else if (isOverdue) {
      return 'เข็มที่ 2 เกินกำหนดแล้ว';
    } else {
      return 'ถึงเวลาฉีดเข็มที่ 2 แล้ว';
    }
  }
  
  return '';
}
