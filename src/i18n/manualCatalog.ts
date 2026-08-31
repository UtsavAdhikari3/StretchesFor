import type { Locale } from './config';

// Short composed phrases that are not discoverable as standalone literals by the catalog generator.
export const manualCatalog: Record<Exclude<Locale, 'en'>, Record<string, string>> = {
  es: {
    'Set up comfortably before starting the timer.': 'Colócate cómodamente antes de iniciar el temporizador.',
    'exercise player': 'reproductor de ejercicios',
    'A mild, controlled stretch or light effort around the selected area.': 'Un estiramiento suave y controlado o un esfuerzo ligero alrededor de la zona seleccionada.',
  },
  fr: {
    'Set up comfortably before starting the timer.': 'Installez-vous confortablement avant de lancer le minuteur.',
    'exercise player': "lecteur d'exercices",
    'A mild, controlled stretch or light effort around the selected area.': 'Un étirement doux et contrôlé ou un effort léger autour de la zone choisie.',
  },
  de: {
    'Set up comfortably before starting the timer.': 'Nimm eine bequeme Ausgangsposition ein, bevor du den Timer startest.',
    'exercise player': 'Übungsplayer',
    'A mild, controlled stretch or light effort around the selected area.': 'Eine sanfte, kontrollierte Dehnung oder leichte Anstrengung im ausgewählten Bereich.',
  },
  pt: {
    'Set up comfortably before starting the timer.': 'Coloque-se confortavelmente antes de iniciar o temporizador.',
    'exercise player': 'reprodutor de exercícios',
    'A mild, controlled stretch or light effort around the selected area.': 'Um alongamento suave e controlado ou um esforço ligeiro em torno da zona selecionada.',
  },
};

