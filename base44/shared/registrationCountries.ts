import { normalizeCountryName } from './territoryNames.ts';

export const REGISTRATION_COUNTRIES = [
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
  'Andorra','Antigua and Barbuda','Armenia','Azerbaijan','Bahamas','Bahrain','Barbados','Belarus','Belize','Bhutan','Bosnia and Herzegovina','Brunei','Bulgaria','Cabo Verde','Comoros','Costa Rica','Croatia','Cyprus','Czechia','Djibouti','Dominica','Dominican Republic','El Salvador','Equatorial Guinea','Estonia','Eswatini','Fiji','Gambia','Georgia','Greece','Grenada','Guinea-Bissau','Guyana','Iceland','Ireland','Kiribati','Kosovo','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Liechtenstein','Lithuania','Luxembourg','Maldives','Malta','Marshall Islands','Mauritius','Micronesia','Moldova','Monaco','Mongolia','Montenegro','Nauru','Nepal','North Macedonia','Oman','Palau','Palestine','Qatar','Romania','Russia','Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines','Samoa','San Marino','Sao Tome and Principe','Serbia','Seychelles','Singapore','Slovakia','Slovenia','Solomon Islands','Suriname','Taiwan','Tajikistan','Timor-Leste','Tonga','Trinidad and Tobago','Turkmenistan','Tuvalu','United Arab Emirates','Uzbekistan','Vanuatu','Vatican City',
].sort((a, b) => a.localeCompare(b));

const ALLOWED = new Set(REGISTRATION_COUNTRIES);

export function validatedRegistrationCountry(value: unknown): string {
  const country = normalizeCountryName(value);
  return ALLOWED.has(country) ? country : '';
}

export function isRegistrationCountry(value: unknown): boolean {
  return Boolean(validatedRegistrationCountry(value));
}