// Occupation du sol du Sénégal : nomenclature harmonisée ANAT / CSE en 5 thèmes (rapport ANSD, tableau 3).
// Couleurs proches de la légende des cartes ANAT 2010 / 2015.
export interface OccsolClass {
  code: string;
  label: string;
  color: string;
  description: string;
}

export interface OccsolTheme {
  id: string;
  label: string;
  color: string;
  classes: OccsolClass[];
}

export const OCCSOL_THEMES: OccsolTheme[] = [
  {
    id: 'boisee',
    label: 'Surface boisée',
    color: '#4d9a2a',
    classes: [
      { code: 'foret', label: 'Forêt', color: '#1f7a1f', description: 'Forêts claires et denses.' },
      { code: 'foret_galerie', label: 'Forêt galerie', color: '#0f5a2c', description: 'Forêts qui longent les cours d’eau.' },
      { code: 'savane', label: 'Savane boisée et arborée', color: '#86c440', description: 'Strate herbacée continue avec arbres et arbustes.' },
      { code: 'savane_arbustive', label: 'Savane arbustive', color: '#b5d98a', description: 'Arbustes et arbrisseaux dans un tapis herbacé continu.' },
      { code: 'steppe', label: 'Steppe', color: '#d9ecc4', description: 'Formation herbeuse et arbustive, sol nu entre les touffes.' },
      { code: 'mangrove', label: 'Mangrove', color: '#a8a51c', description: 'Végétation de l’écosystème mangrove (palétuviers).' },
      { code: 'plantation', label: 'Plantation forestière', color: '#6f9e74', description: 'Plantations forestières et vergers.' },
    ],
  },
  {
    id: 'cultivee',
    label: 'Surface cultivée',
    color: '#e8c234',
    classes: [
      { code: 'culture_pluviale', label: 'Culture pluviale', color: '#f6e98a', description: 'Cultures sous pluie et jachères (mil, arachide, maïs…).' },
      { code: 'culture_irriguee', label: 'Culture irriguée', color: '#a865c9', description: 'Zones d’irrigation régulière et grands périmètres.' },
      { code: 'culture_maraichere', label: 'Culture maraîchère', color: '#f08a84', description: 'Cultures de légumes, notamment dans les Niayes.' },
    ],
  },
  {
    id: 'hydrique',
    label: 'Région hydrique',
    color: '#2b7bd6',
    classes: [
      { code: 'cours_eau', label: 'Cours d’eau', color: '#1565c0', description: 'Fleuves, rivières et bras de mer.' },
      { code: 'lac', label: 'Lac', color: '#4f9fe0', description: 'Lacs, dont le lac de Guiers.' },
      { code: 'mare', label: 'Mare', color: '#29b6d8', description: 'Mares temporaires ou permanentes.' },
      { code: 'plaine_inondable', label: 'Plaine inondable', color: '#a9d3ee', description: 'Zones inondées en saison des pluies.' },
      { code: 'vasiere', label: 'Vasière', color: '#5f84b8', description: 'Sols de vase des deltas du Saloum, de la Casamance et de Saint-Louis.' },
      { code: 'tanne', label: 'Tanne', color: '#e3d3b4', description: 'Sols salés exondés ou non vaseux, souvent inondables.' },
      { code: 'prairie_aquatique', label: 'Prairie marécageuse', color: '#9fd8b0', description: 'Eaux douces stagnantes avec flore aquatique (nénuphar, typha).' },
    ],
  },
  {
    id: 'denudee',
    label: 'Zone dénudée',
    color: '#e0b97a',
    classes: [
      { code: 'sol_nu', label: 'Sol nu', color: '#efdcb5', description: 'Affleurements rocheux, dunes et plages.' },
      { code: 'dune', label: 'Dune côtière', color: '#f2a33a', description: 'Formations dunaires du littoral.' },
    ],
  },
  {
    id: 'artificialisee',
    label: 'Surface artificialisée',
    color: '#e05ab8',
    classes: [
      { code: 'localite', label: 'Localité', color: '#e05ab8', description: 'Villes et villages : bâti dense et mosaïque bâti / végétation.' },
      { code: 'carriere', label: 'Carrière, mine, infrastructure', color: '#b5541c', description: 'Carrières, mines et grandes infrastructures (aéroports).' },
    ],
  },
];

export const OCCSOL_CLASS_BY_CODE: Record<string, OccsolClass & { theme: string }> = Object.fromEntries(
  OCCSOL_THEMES.flatMap((t) => t.classes.map((c) => [c.code, { ...c, theme: t.id }]))
);
