export interface AlbumSection {
  id: string; // Prefix, e.g., 'BRA'
  name: string; // e.g., 'Brazil'
  count: number; // e.g., 20
}

// Mocking 48 teams for 2026 World Cup + Specials
export const ALBUM_SECTIONS: AlbumSection[] = [
  { id: 'FWC', name: 'FIFA World Cup', count: 18 },
  { id: 'STA', name: 'Stadiums', count: 16 },
  { id: 'HOST', name: 'Host Cities', count: 16 },
  { id: 'ARG', name: 'Argentina', count: 20 },
  { id: 'BRA', name: 'Brazil', count: 20 },
  { id: 'FRA', name: 'France', count: 20 },
  { id: 'ENG', name: 'England', count: 20 },
  { id: 'ESP', name: 'Spain', count: 20 },
  { id: 'USA', name: 'United States', count: 20 },
  { id: 'MEX', name: 'Mexico', count: 20 },
  { id: 'CAN', name: 'Canada', count: 20 },
  { id: 'POR', name: 'Portugal', count: 20 },
  { id: 'GER', name: 'Germany', count: 20 },
  { id: 'ITA', name: 'Italy', count: 20 },
  { id: 'URU', name: 'Uruguay', count: 20 },
  { id: 'COL', name: 'Colombia', count: 20 },
  { id: 'JPN', name: 'Japan', count: 20 },
  { id: 'KOR', name: 'South Korea', count: 20 },
  { id: 'MAR', name: 'Morocco', count: 20 },
  { id: 'SEN', name: 'Senegal', count: 20 },
];

export const getTotalStickersCount = () => {
  return ALBUM_SECTIONS.reduce((acc, section) => acc + section.count, 0);
};

export const generateStickerIdsForSection = (section: AlbumSection) => {
  const ids: string[] = [];
  for (let i = 1; i <= section.count; i++) {
    ids.push(`${section.id}-${i}`);
  }
  return ids;
};

export const getAllStickerIds = () => {
    return ALBUM_SECTIONS.map(generateStickerIdsForSection).flat();
}
