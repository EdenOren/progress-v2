/**
 * Material Icons ligatures passed as component inputs. Ligatures written inline
 * in a template are content, but one crossing a component boundary is a value,
 * and values are enums here.
 *
 * Short-lived: RX-8 migrates icon delivery from the Material Icons webfont to
 * ui-kit's SVG `app-ui-icon`, at which point this folds into `AppIcon`.
 */
export enum MaterialIcon {
  EventNote = 'event_note',
  FitnessCenter = 'fitness_center',
  History = 'history',
  Insights = 'insights',
}
