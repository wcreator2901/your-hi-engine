
interface Translations {
  [language: string]: {
    [key: string]: string;
  };
}

export const translations: Translations = {
  en: {
    dashboard: 'Dashboard',
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    settings: 'Settings',
    portfolioOverview: 'Portfolio Overview',
    welcomeBack: 'Welcome Back',
    totalBalance: 'Total Balance',
    assets: 'Assets',
    recentTransactions: 'Recent Transactions',
  },
  es: {
    dashboard: 'Tablero',
    deposit: 'Depósito',
    withdraw: 'Retirar',
    settings: 'Configuración',
    portfolioOverview: 'Resumen de Cartera',
    welcomeBack: 'Bienvenido de Nuevo',
    totalBalance: 'Balance Total',
    assets: 'Activos',
    recentTransactions: 'Transacciones Recientes',
  },
  zh: {
    dashboard: '仪表板',
    deposit: '存款',
    withdraw: '提取',
    settings: '设置',
    portfolioOverview: '投资组合概览',
    welcomeBack: '欢迎回来',
    totalBalance: '总余额',
    assets: '资产',
    recentTransactions: '最近交易',
  },
  fr: {
    dashboard: 'Tableau de bord',
    deposit: 'Dépôt',
    withdraw: 'Retirer',
    settings: 'Paramètres',
    portfolioOverview: 'Aperçu du portefeuille',
    welcomeBack: 'Bon retour',
    totalBalance: 'Solde total',
    assets: 'Actifs',
    recentTransactions: 'Transactions récentes',
  },
  de: {
    dashboard: 'Dashboard',
    deposit: 'Einzahlung',
    withdraw: 'Abheben',
    settings: 'Einstellungen',
    portfolioOverview: 'Portfolio-Übersicht',
    welcomeBack: 'Willkommen zurück',
    totalBalance: 'Gesamtsaldo',
    assets: 'Vermögenswerte',
    recentTransactions: 'Neueste Transaktionen',
  },
};

export const t = (key: string, language: string): string => {
  return translations[language]?.[key] || translations.en[key] || key;
};
