import { AttendanceStatus } from '../api/attendance';

export const AttendanceStatusLabels: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PRESENT]: 'Present',
  [AttendanceStatus.ABSENT]: 'Absent',
  [AttendanceStatus.SICK]: 'Sick',
  [AttendanceStatus.LATE]: 'Late',
  [AttendanceStatus.BENCHED]: 'Benched',
};

export const AttendanceStatusColors: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PRESENT]: 'bg-green-100 text-green-800',
  [AttendanceStatus.ABSENT]: 'bg-red-100 text-red-800',
  [AttendanceStatus.SICK]: 'bg-yellow-100 text-yellow-800',
  [AttendanceStatus.LATE]: 'bg-orange-100 text-orange-800',
  [AttendanceStatus.BENCHED]: 'bg-gray-100 text-gray-800',
};
