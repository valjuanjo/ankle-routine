import { router } from 'expo-router';

/** After a routine is loaded, clear the setup screens and land on Today. */
export function goToToday() {
  if (router.canDismiss()) router.dismissAll();
  router.replace('/today');
}
