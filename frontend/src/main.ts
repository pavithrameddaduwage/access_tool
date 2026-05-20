import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
// PrimeUIX theme runtime
import { useTheme, Theme, ThemeUtils } from '@primeuix/styled';

(window as any).__Zone_disable_requestAnimationFrame = true;
(window as any).__Zone_disable_on_property = true;

// Initialize PrimeUIX theme and inject generated CSS into the document head
try {
  // Prepare theme tokens (use default presets)
  const themeController = useTheme({});
  themeController.update({ mergePresets: false });
  const theme = Theme.getTheme();

  // Generate common CSS variables and global preset CSS and append to head
  const commonCss = ThemeUtils.getCommonStyleSheet({ name: '', theme });
  const presetCss = ThemeUtils.getStyleSheet({ name: '', theme });
  if (commonCss) document.head.insertAdjacentHTML('beforeend', commonCss);
  if (presetCss) document.head.insertAdjacentHTML('beforeend', presetCss);
} catch (e) {
  // If runtime theming fails, keep going — styles can be added manually later.
  console.warn('PrimeUIX runtime theme injection failed:', e);
}

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));