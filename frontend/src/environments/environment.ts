
export const environment = {
    production: false,
    apiBaseUrl: 'http://127.0.0.1:8000/api',
    fileBaseUrl: 'http://127.0.0.1:8000',
    donorsPortalHost: 'donors.bzassets.org',
    portalTitle: 'Donor Management',
    portalDocumentTitle: 'Donor Management',
    appTitle: 'Logistic Assets',
    /** Design used until the user picks one with the toggle: 'bz' or 'classic'. */
    defaultTheme: 'bz' as 'bz' | 'classic',
    /** Show the Classic/BZ design toggle. Development only: production always uses BZ. */
    allowThemeToggle: true,
    /** Show the Import Excel button on the assets list. */
    enableExcelImport: true,
  };