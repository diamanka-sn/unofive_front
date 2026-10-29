
export const DISASTER_TYPE_FR: { [type: string]: string } = {
  'Flood': 'Inondation',
  'Storm': 'Tempête',
  'Drought': 'Sécheresse',
  'Epidemic': 'Épidémie',
  'Earthquake': 'Séisme',
  'Wildfire': 'Feu de forêt',
  'Extreme temperature': 'Température extrême',
  'Infestation': 'Invasion d\'insectes',
  'Mass movement (wet)': 'Glissement de terrain',
  'Mass movement (dry)': 'Éboulement',
  'Volcanic activity': 'Activité volcanique',
  'Animal incident': 'Incident lié aux animaux',
  'Glacial lake outburst flood': 'Vidange de lac glaciaire',
  'Road': 'Accident de la route',
  'Water': 'Accident de navigation',
  'Air': 'Accident aérien',
  'Rail': 'Accident ferroviaire',
  'Fire (Miscellaneous)': 'Incendie',
  'Fire (Industrial)': 'Incendie industriel',
  'Collapse (Industrial)': 'Effondrement industriel',
  'Collapse (Miscellaneous)': 'Effondrement de bâtiment',
  'Explosion (Industrial)': 'Explosion industrielle',
  'Explosion (Miscellaneous)': 'Explosion',
  'Industrial accident (General)': 'Accident industriel',
  'Miscellaneous accident (General)': 'Accident divers',
  'Chemical spill': 'Déversement chimique',
  'Gas leak': 'Fuite de gaz',
  'Oil spill': 'Marée noire',
  'Poisoning': 'Empoisonnement',
  'Radiation': 'Radiation',
};

export const DISASTER_SUBGROUP_FR: { [subgroup: string]: { label: string; icon: string; color: string } } = {
  'Hydrological': { label: 'Hydrologique', icon: 'water_drop', color: 'bg-sky-50 text-sky-700' },
  'Meteorological': { label: 'Météorologique', icon: 'thunderstorm', color: 'bg-indigo-50 text-indigo-700' },
  'Climatological': { label: 'Climatique', icon: 'wb_sunny', color: 'bg-amber-50 text-amber-700' },
  'Biological': { label: 'Biologique', icon: 'coronavirus', color: 'bg-emerald-50 text-emerald-700' },
  'Geophysical': { label: 'Géophysique', icon: 'terrain', color: 'bg-stone-100 text-stone-700' },
  'Extra-terrestrial': { label: 'Extraterrestre', icon: 'public', color: 'bg-slate-100 text-slate-700' },
  'Transport': { label: 'Transport', icon: 'directions_car', color: 'bg-slate-100 text-slate-700' },
  'Industrial accident': { label: 'Accident industriel', icon: 'factory', color: 'bg-orange-50 text-orange-700' },
  'Miscellaneous accident': { label: 'Accident divers', icon: 'warning_amber', color: 'bg-rose-50 text-rose-700' },
};

// Types présents dans la base, par famille EM-DAT, du plus fréquent au moins fréquent
export const DISASTER_TYPES_BY_GROUP: { [group: string]: string[] } = {
  Natural: [
    'Flood', 'Epidemic', 'Storm', 'Drought', 'Mass movement (wet)', 'Earthquake', 'Wildfire',
    'Infestation', 'Extreme temperature', 'Volcanic activity', 'Mass movement (dry)', 'Animal incident',
  ],
  Technological: [
    'Road', 'Water', 'Fire (Miscellaneous)', 'Air', 'Collapse (Industrial)', 'Rail',
    'Miscellaneous accident (General)', 'Collapse (Miscellaneous)', 'Explosion (Industrial)',
    'Explosion (Miscellaneous)', 'Industrial accident (General)', 'Fire (Industrial)', 'Poisoning', 'Chemical spill',
  ],
};

export const DISASTER_GROUPS = [
  { id: 'Natural', label: 'Naturelles', plural: 'Catastrophes naturelles' },
  { id: 'Technological', label: 'Technologiques', plural: 'Catastrophes technologiques' },
  { id: 'all', label: 'Toutes', plural: 'Toutes catastrophes' },
];

export const disasterTypeFr =(type?: string | null): string =>
  type ? DISASTER_TYPE_FR[type] ?? type : '-';

export const disasterSubgroupFr = (subgroup?: string | null) =>
  (subgroup && DISASTER_SUBGROUP_FR[subgroup]) || { label: subgroup || '-', icon: 'help_outline', color: 'bg-slate-100 text-slate-700' };

// Liste complète des types présents dans la base (accueil et filtre de la carte), par famille puis par nombre d'événements
export interface DisasterTypeOption {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export const DISASTER_TYPE_GROUPS: { id: 'Natural' | 'Technological'; label: string; types: DisasterTypeOption[] }[] = [
  {
    id: 'Natural',
    label: 'Catastrophes naturelles',
    types: [
      { id: 'Flood', label: 'Inondations', icon: 'water_drop', color: '#3498db' },
      { id: 'Epidemic', label: 'Épidémies', icon: 'medical_services', color: '#e74c3c' },
      { id: 'Storm', label: 'Tempêtes', icon: 'air', color: '#9b59b6' },
      { id: 'Drought', label: 'Sécheresse', icon: 'wb_sunny', color: '#d4a106' },
      { id: 'Mass movement (wet)', label: 'Glissements de terrain (humide)', icon: 'terrain', color: '#7f8c8d' },
      { id: 'Earthquake', label: 'Séismes', icon: 'vibration', color: '#a0522d' },
      { id: 'Wildfire', label: 'Feux de forêt', icon: 'local_fire_department', color: '#e67e22' },
      { id: 'Infestation', label: 'Infestations', icon: 'bug_report', color: '#27ae60' },
      { id: 'Extreme temperature', label: 'Températures extrêmes', icon: 'thermostat', color: '#d35400' },
      { id: 'Volcanic activity', label: 'Activité volcanique', icon: 'volcano', color: '#c0392b' },
      { id: 'Mass movement (dry)', label: 'Éboulements', icon: 'landslide', color: '#8d6e63' },
      { id: 'Animal incident', label: 'Incidents animaliers', icon: 'pets', color: '#8e44ad' },
    ],
  },
  {
    id: 'Technological',
    label: 'Catastrophes technologiques',
    types: [
      { id: 'Road', label: 'Accidents de la route', icon: 'directions_car', color: '#475569' },
      { id: 'Water', label: 'Accidents de navigation', icon: 'directions_boat', color: '#0e7490' },
      { id: 'Fire (Miscellaneous)', label: 'Incendies', icon: 'fire_extinguisher', color: '#dc2626' },
      { id: 'Air', label: 'Accidents aériens', icon: 'flight', color: '#2563eb' },
      { id: 'Collapse (Industrial)', label: 'Effondrements industriels', icon: 'domain_disabled', color: '#78716c' },
      { id: 'Rail', label: 'Accidents ferroviaires', icon: 'train', color: '#4b5563' },
      { id: 'Miscellaneous accident (General)', label: 'Accidents divers', icon: 'warning_amber', color: '#b45309' },
      { id: 'Collapse (Miscellaneous)', label: 'Effondrements de bâtiments', icon: 'apartment', color: '#57534e' },
      { id: 'Explosion (Industrial)', label: 'Explosions industrielles', icon: 'flare', color: '#ea580c' },
      { id: 'Explosion (Miscellaneous)', label: 'Explosions', icon: 'crisis_alert', color: '#c2410c' },
      { id: 'Industrial accident (General)', label: 'Accidents industriels', icon: 'factory', color: '#6b7280' },
      { id: 'Fire (Industrial)', label: 'Incendies industriels', icon: 'whatshot', color: '#b91c1c' },
      { id: 'Poisoning', label: 'Empoisonnements', icon: 'medication', color: '#7c3aed' },
      { id: 'Chemical spill', label: 'Déversements chimiques', icon: 'science', color: '#0d9488' },
    ],
  },
];

export const ALL_DISASTER_TYPES: DisasterTypeOption[] = DISASTER_TYPE_GROUPS.flatMap((g) => g.types);
