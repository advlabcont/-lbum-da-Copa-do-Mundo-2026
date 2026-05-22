export interface AlbumSection {
  id: string; // Prefix, e.g., 'BRA'
  name: string; // e.g., 'Brazil'
  count: number; // e.g., 20
  group?: string; // e.g., 'Grupo A'
  stickers?: string[];
  excludeFromTotal?: boolean;
}

// Mocking 48 teams for 2026 World Cup + Specials
export const ALBUM_SECTIONS: AlbumSection[] = [
  { id: 'FWC', name: 'Copa 2026', count: 20, group: 'Especiais', stickers: ['00', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19'] },
  { id: 'EXT', name: 'Extra', count: 4, group: 'Especiais', stickers: ['REGU', 'BRON', 'PRAT', 'OURO'], excludeFromTotal: true },
  { id: 'COC', name: 'Coca - Cola', count: 10, group: 'Especiais', excludeFromTotal: true },

  // Grupo A

  { id: 'MEX', name: 'México', count: 20, group: 'Grupo A' },
  { id: 'KOR', name: 'Coreia do Sul', count: 20, group: 'Grupo A' },
  { id: 'RSA', name: 'África do Sul', count: 20, group: 'Grupo A' },
  { id: 'CZE', name: 'República Tcheca', count: 20, group: 'Grupo A' },

  // Grupo B
  { id: 'CAN', name: 'Canadá', count: 20, group: 'Grupo B' },
  { id: 'SUI', name: 'Suíça', count: 20, group: 'Grupo B' },
  { id: 'QAT', name: 'Catar', count: 20, group: 'Grupo B' },
  { id: 'BIH', name: 'Bósnia e Herzegovina', count: 20, group: 'Grupo B' },

  // Grupo C
  { id: 'BRA', name: 'Brasil', count: 20, group: 'Grupo C' },
  { id: 'MAR', name: 'Marrocos', count: 20, group: 'Grupo C' },
  { id: 'SCO', name: 'Escócia', count: 20, group: 'Grupo C' },
  { id: 'HAI', name: 'Haiti', count: 20, group: 'Grupo C' },

  // Grupo D
  { id: 'USA', name: 'Estados Unidos', count: 20, group: 'Grupo D' },
  { id: 'AUS', name: 'Austrália', count: 20, group: 'Grupo D' },
  { id: 'PAR', name: 'Paraguai', count: 20, group: 'Grupo D' },
  { id: 'TUR', name: 'Turquia', count: 20, group: 'Grupo D' },

  // Grupo E
  { id: 'GER', name: 'Alemanha', count: 20, group: 'Grupo E' },
  { id: 'ECU', name: 'Equador', count: 20, group: 'Grupo E' },
  { id: 'CIV', name: 'Costa do Marfim', count: 20, group: 'Grupo E' },
  { id: 'CUW', name: 'Curaçau', count: 20, group: 'Grupo E' },

  // Grupo F
  { id: 'NED', name: 'Holanda', count: 20, group: 'Grupo F' },
  { id: 'JPN', name: 'Japão', count: 20, group: 'Grupo F' },
  { id: 'TUN', name: 'Tunísia', count: 20, group: 'Grupo F' },
  { id: 'SWE', name: 'Suécia', count: 20, group: 'Grupo F' },

  // Grupo G
  { id: 'BEL', name: 'Bélgica', count: 20, group: 'Grupo G' },
  { id: 'IRN', name: 'Irã', count: 20, group: 'Grupo G' },
  { id: 'EGY', name: 'Egito', count: 20, group: 'Grupo G' },
  { id: 'NZL', name: 'Nova Zelândia', count: 20, group: 'Grupo G' },

  // Grupo H
  { id: 'ESP', name: 'Espanha', count: 20, group: 'Grupo H' },
  { id: 'URU', name: 'Uruguai', count: 20, group: 'Grupo H' },
  { id: 'KSA', name: 'Arábia Saudita', count: 20, group: 'Grupo H' },
  { id: 'CPV', name: 'Cabo Verde', count: 20, group: 'Grupo H' },

  // Grupo I
  { id: 'FRA', name: 'França', count: 20, group: 'Grupo I' },
  { id: 'SEN', name: 'Senegal', count: 20, group: 'Grupo I' },
  { id: 'NOR', name: 'Noruega', count: 20, group: 'Grupo I' },
  { id: 'IRQ', name: 'Iraque', count: 20, group: 'Grupo I' },

  // Grupo J
  { id: 'ARG', name: 'Argentina', count: 20, group: 'Grupo J' },
  { id: 'AUT', name: 'Áustria', count: 20, group: 'Grupo J' },
  { id: 'ALG', name: 'Argélia', count: 20, group: 'Grupo J' },
  { id: 'JOR', name: 'Jordânia', count: 20, group: 'Grupo J' },

  // Grupo K
  { id: 'POR', name: 'Portugal', count: 20, group: 'Grupo K' },
  { id: 'COL', name: 'Colômbia', count: 20, group: 'Grupo K' },
  { id: 'UZB', name: 'Uzbequistão', count: 20, group: 'Grupo K' },
  { id: 'COD', name: 'Rep. Dem. do Congo', count: 20, group: 'Grupo K' },

  // Grupo L
  { id: 'ENG', name: 'Inglaterra', count: 20, group: 'Grupo L' },
  { id: 'CRO', name: 'Croácia', count: 20, group: 'Grupo L' },
  { id: 'PAN', name: 'Panamá', count: 20, group: 'Grupo L' },
  { id: 'GHA', name: 'Gana', count: 20, group: 'Grupo L' }
];

export const getTotalStickersCount = () => {
  return ALBUM_SECTIONS.filter(s => !s.excludeFromTotal).reduce((acc, section) => acc + section.count, 0);
};

export const generateStickerIdsForSection = (section: AlbumSection) => {
  if (section.stickers) {
    return section.stickers.map(s => `${section.id}-${s}`);
  }
  const ids: string[] = [];
  for (let i = 1; i <= section.count; i++) {
    ids.push(`${section.id}-${i}`);
  }
  return ids;
};

export const getAllStickerIds = () => {
    return ALBUM_SECTIONS.map(generateStickerIdsForSection).flat();
}

export const getStandardStickerIds = () => {
    return ALBUM_SECTIONS.filter(s => !s.excludeFromTotal).map(generateStickerIdsForSection).flat();
}

export const isStandardSticker = (id: string) => {
    let sectionId = id.split('-')[0];
    if (sectionId === 'BPS' || sectionId === 'HIS') {
        sectionId = 'FWC';
    }
    const section = ALBUM_SECTIONS.find(s => s.id === sectionId);
    return section && !section.excludeFromTotal;
}

export const getExtraStickersCount = () => {
    return ALBUM_SECTIONS.filter(s => s.excludeFromTotal).reduce((acc, section) => acc + section.count, 0);
}
