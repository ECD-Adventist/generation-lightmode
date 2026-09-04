import { normalizeCountryName } from './territoryNames.ts';

const REGISTRATION_COUNTRIES = [
  'Afghanistan','Albania','Algeria','Angola','Argentina','Australia','Austria','Bangladesh','Belgium','Benin',
  'Bolivia','Botswana','Brazil','Burkina Faso','Burundi','Cambodia','Cameroon','Canada','Central African Republic',
  'Chad','Chile','China','Colombia','Republic of the Congo',"Côte d'Ivoire",'Cuba','Democratic Republic of the Congo','Denmark','Ecuador','Egypt',
  'Eritrea','Ethiopia','Finland','France','Gabon','Ghana','Germany','Guatemala','Guinea','Haiti','Honduras',
  'Hungary','India','Indonesia','Iran','Iraq','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya',
  'Lesotho','Liberia','Libya','Madagascar','Malawi','Malaysia','Mali','Mauritania','Mexico','Morocco',
  'Mozambique','Myanmar','Namibia','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea',
  'Norway','Pakistan','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal',
  'Rwanda','Saudi Arabia','Senegal','Sierra Leone','Somalia','South Africa','South Korea','South Sudan',
  'Spain','Sri Lanka','Sudan','Sweden','Switzerland','Syria','Tanzania','Thailand','Togo','Tunisia',
  'Turkey','Uganda','Ukraine','United Kingdom','United States','Uruguay','Venezuela','Vietnam',
  'Yemen','Zambia','Zimbabwe',
];

const ALLOWED = new Set(REGISTRATION_COUNTRIES);

export function validatedRegistrationCountry(value: unknown): string {
  const country = normalizeCountryName(value);
  return ALLOWED.has(country) ? country : '';
}

export function isRegistrationCountry(value: unknown): boolean {
  return Boolean(validatedRegistrationCountry(value));
}