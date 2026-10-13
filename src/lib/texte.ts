export const sansAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
export const cle = (s: string) => sansAccents(s).toLowerCase().replace(/[^a-z0-9]+/g, "");
