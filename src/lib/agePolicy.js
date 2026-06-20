export const MINIMUM_USER_AGE = 13;
export const PRIVACY_CONTACT_EMAIL = "lightmode@ecd.adventist.org";
export const AGE_VERIFICATION_DISCLAIMER = `You must be ${MINIMUM_USER_AGE} or older to use Generation LightMode. If you are under 18, we encourage parental oversight.`;
export const AGE_RESTRICTION_MESSAGE = `Generation LightMode is intended for users aged ${MINIMUM_USER_AGE} and above. For users under 18, we encourage parental oversight. If a child under ${MINIMUM_USER_AGE} has provided personal data, please contact ${PRIVACY_CONTACT_EMAIL} so we can take steps to delete it.`;

export function getMinimumBirthDateForAge(age = MINIMUM_USER_AGE) {
  const today = new Date();
  const cutoff = new Date(today.getFullYear() - age, today.getMonth(), today.getDate());
  return cutoff.toISOString().split("T")[0];
}

export function isAtLeastAge(dateString, age = MINIMUM_USER_AGE) {
  if (!dateString) return false;
  const birthDate = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return false;
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - age);
  return birthDate <= cutoff;
}