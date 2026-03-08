const ENEMY_ART_BY_ID: Record<string, string> = {
  portero_titular: '/enemy-art/portero-titular-horizontal.png',
  capitan_equipo: '/enemy-art/capitan-del-equipo-horizontal.png',
  campeon_europa: '/enemy-art/campeon-de-europa-horizontal.png',
};

export function getEnemyArtSrc(enemyId: string): string | null {
  return ENEMY_ART_BY_ID[enemyId] ?? null;
}
