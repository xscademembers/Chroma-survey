import { PatientSubmission } from "@/types";

export interface FallbackPatientRecord extends PatientSubmission {
  _id: string;
  submittedAt: Date;
  source: string;
  userAgent: string;
}

declare global {
  // eslint-disable-next-line no-var
  var _fallbackPatients: FallbackPatientRecord[] | undefined;
}

const fallbackPatients = global._fallbackPatients ?? [];
if (!global._fallbackPatients) {
  global._fallbackPatients = fallbackPatients;
}

export function getFallbackPatients() {
  return [...fallbackPatients].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
}

export function addFallbackPatient(record: FallbackPatientRecord) {
  fallbackPatients.push(record);
}

export function findFallbackByMobile(mobileNumber: string) {
  return getFallbackPatients().find((row) => row.mobileNumber === mobileNumber);
}
