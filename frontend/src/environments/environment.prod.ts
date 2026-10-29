export const environment = {
    production: true,
    apiBaseUrl: 'https://logistic-backend.bzassets.org/api',
    fileBaseUrl: 'https://logistic-backend.bzassets.org',
    donorsPortalHost: 'donors.bzassets.org',
    portalTitle: 'Donor Management',
    portalDocumentTitle: 'Donor Management',
    appTitle: 'Logistic Assets',
    /** Design used until the user picks one with the toggle: 'bz' or 'classic'. */
    defaultTheme: 'bz' as 'bz' | 'classic',
    /** Show the Classic/BZ design toggle. Off in production: everyone gets BZ. */
    allowThemeToggle: false,
    /** Show the Import Excel button on the assets list. Hidden in production for now. */
    enableExcelImport: false,
  };