export function validateAppointment({ praxisId, patient, time }) {
  if (!praxisId) return 'Praxis fehlt';
  if (!patient || patient.trim().length < 2) return 'Geben Sie einen Patientennamen an';
  if (!time) return 'Datum/Zeit fehlt';
  const date = new Date(time);
  if (isNaN(date.getTime())) return 'Ungültiges Datum';
  return null;
}
