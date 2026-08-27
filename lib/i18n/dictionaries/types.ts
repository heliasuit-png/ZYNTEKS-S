import type { ActionMessagesDictionary } from "@/lib/i18n/dictionaries/action-messages-types";
import type { AdminDictionary } from "@/lib/i18n/dictionaries/admin-types";
import type { DashDictionary } from "@/lib/i18n/dictionaries/dash-types";

export type { ActionMessagesDictionary } from "@/lib/i18n/dictionaries/action-messages-types";
export type { AdminDictionary } from "@/lib/i18n/dictionaries/admin-types";
export type { DashDictionary } from "@/lib/i18n/dictionaries/dash-types";

export type PricingPresentationPlanCopy = {
  name: string;
  description: string;
  cta: string;
  limits: readonly string[];
  features: readonly string[];
};

export type Dictionary = {
  meta: {
    description: string;
  };
  common: {
    signIn: string;
    startFree: string;
    language: string;
    english: string;
    turkish: string;
    openMenu: string;
    closeMenu: string;
    primaryNav: string;
    mobileNav: string;
  };
  nav: {
    features: string;
    howItWorks: string;
    sdk: string;
    pricing: string;
    faq: string;
  };
  footer: {
    product: string;
    company: string;
    legal: string;
    documentation: string;
    contact: string;
    privacy: string;
    terms: string;
    cookie: string;
    kvkk: string;
    refund: string;
    rights: string;
    paymentMethods: string;
    paymentVisa: string;
    paymentMastercard: string;
    paymentAmex: string;
    paymentDiscover: string;
    paymentDiners: string;
  };
  auth: {
    createAccount: string;
    createAccountDesc: string;
    registrationClosed: string;
    registrationClosedDesc: string;
    alreadyHaveAccount: string;
    signInLink: string;
    legalNotice: string;
    terms: string;
    privacy: string;
    kvkk: string;
    forgotTitle: string;
    forgotDesc: string;
    resetTitle: string;
    resetDesc: string;
    loginTitle: string;
    welcomeBack: string;
    welcomeBackDesc: string;
    noAccount: string;
    createOne: string;
    signedOut: string;
    passwordUpdated: string;
    authError: string;
    authErrorMissingCode: string;
    authErrorFailed: string;
    authErrorSuspended: string;
    rememberedIt: string;
    backToSignIn: string;
    orDivider: string;
    passwordTab: string;
    emailPasswordTab: string;
    magicLinkTab: string;
    methodAria: string;
  };
  authForms: {
    email: string;
    password: string;
    fullName: string;
    confirmPassword: string;
    newPassword: string;
    confirmNewPassword: string;
    workEmail: string;
    emailPlaceholder: string;
    emailCompanyPlaceholder: string;
    fullNamePlaceholder: string;
    forgotPassword: string;
    signIn: string;
    createAccount: string;
    sendReset: string;
    updatePassword: string;
    magicLink: string;
    continueWithEmail: string;
    continueWithGoogle: string;
    continueWithGitHub: string;
    oauthGroupAria: string;
    oauthStartFailed: string;
    magicLinkHint: string;
    backToLogin: string;
    checkEmail: string;
  };
  legal: {
    privacyTitle: string;
    termsTitle: string;
    cookieTitle: string;
    kvkkTitle: string;
    distanceSalesTitle: string;
    preliminaryInformationTitle: string;
    refundCancellationTitle: string;
  };
  dashboardNav: {
    dashboard: string;
    projects: string;
    apiKeys: string;
    errors: string;
    incidents: string;
    health: string;
    insights: string;
    ai: string;
    notifications: string;
    statusPages: string;
    members: string;
    audit: string;
    security: string;
    organization: string;
    billing: string;
    settings: string;
    profile: string;
  };
  landing: {
    hero: {
      brand: string;
      headline: string;
      subheadline: string;
      primaryCta: string;
      secondaryCta: string;
    };
    features: {
      eyebrow: string;
      title: string;
      desc: string;
      items: {
        monitoring: { title: string; description: string };
        ai: { title: string; description: string };
        projects: { title: string; description: string };
        "api-keys": { title: string; description: string };
        health: { title: string; description: string };
        notifications: { title: string; description: string };
        status: { title: string; description: string };
      };
    };
    howItWorks: {
      eyebrow: string;
      title: string;
      desc: string;
      steps: [
        { title: string; description: string },
        { title: string; description: string },
        { title: string; description: string },
      ];
    };
    ai: {
      eyebrow: string;
      title: string;
      desc: string;
      points: [
        { title: string; text: string },
        { title: string; text: string },
        { title: string; text: string },
      ];
      cta: string;
      mockHeader: string;
      mockUser: string;
      mockAssistant: string;
    };
    monitoring: {
      eyebrow: string;
      title: string;
      desc: string;
      items: [
        { title: string; text: string },
        { title: string; text: string },
        { title: string; text: string },
      ];
    };
    sdk: {
      eyebrow: string;
      title: string;
      desc: string;
      copy: string;
      copyInstallAria: string;
      copySnippetAria: string;
      anyBrowserApp: string;
    };
    status: {
      eyebrow: string;
      title: string;
      desc: string;
      items: [
        { title: string; text: string },
        { title: string; text: string },
        { title: string; text: string },
      ];
      demoHost: string;
      allOperational: string;
      operational: string;
      degraded: string;
      components: {
        api: string;
        dashboard: string;
        notifications: string;
        statusPage: string;
      };
    };
    pricing: {
      eyebrow: string;
      title: string;
      desc: string;
      startFree: string;
      viewAllPlans: string;
      contactSales: string;
      pageTitle: string;
      pageDesc: string;
      metaDescription: string;
      popular: string;
      perMonth: string;
      limitsLabel: string;
      featuresLabel: string;
      moreFeatures: string;
      showLess: string;
      comingSoonTitle: string;
      comingSoonBody: string;
      comingSoonClose: string;
      paymentMethodsNote: string;
      paymentSecureNote: string;
      legalNoteBefore: string;
      legalTermsLink: string;
      legalRefundLink: string;
      legalDistanceSalesLink: string;
      legalPreliminaryLink: string;
      legalNoteBetween: string;
      legalNoteAnd: string;
      plans: {
        free: PricingPresentationPlanCopy;
        developer: PricingPresentationPlanCopy;
        pro: PricingPresentationPlanCopy;
        business: PricingPresentationPlanCopy;
      };
    };
    seo: {
      starterPlanAvailable: string;
    };
    faq: {
      eyebrow: string;
      title: string;
      desc: string;
      items: [
        { q: string; a: string },
        { q: string; a: string },
        { q: string; a: string },
        { q: string; a: string },
        { q: string; a: string },
        { q: string; a: string },
      ];
    };
    testimonials: {
      eyebrow: string;
      title: string;
      desc: string;
      items: [
        { quote: string; name: string; role: string; company: string },
        { quote: string; name: string; role: string; company: string },
        { quote: string; name: string; role: string; company: string },
      ];
    };
    heroIllustration: {
      consoleLabel: string;
      navDashboard: string;
      navErrors: string;
      navHealth: string;
      navAi: string;
      navStatus: string;
      uptime: string;
      errors: string;
      latency: string;
      incidentTimeline: string;
      stable: string;
      chartAria: string;
    };
  };
  docs: {
    title: string;
    intro: string;
    createAccountTitle: string;
    createAccountOr: string;
    createAccountBody: string;
    createProjectTitle: string;
    createProjectBody: string;
    generateKeyTitle: string;
    generateKeyBody: string;
    installSdkTitle: string;
    installSdkBody: string;
    installSdkInit: string;
    serverIngestTitle: string;
    serverIngestBody: string;
    operateTitle: string;
    operateErrors: string;
    operateAi: string;
    operateStatus: string;
    operateBilling: string;
    troubleshootingTitle: string;
    trouble401Title: string;
    trouble401Body: string;
    troubleNoDataTitle: string;
    troubleNoDataBody: string;
    troubleRateTitle: string;
    troubleRateBody: string;
    registerLink: string;
    signInLink: string;
    projectsLink: string;
    apiKeysLink: string;
    billingLink: string;
    sdkSectionLink: string;
  };
  contact: {
    title: string;
    intro: string;
    general: string;
    billing: string;
    productAccess: string;
    createAccount: string;
  };
  dashboard: {
    pageTitles: {
      dashboard: { title: string; description: string };
      projects: { title: string; description: string };
      apiKeys: { title: string; description: string };
      errors: { title: string; description: string };
      incidents: { title: string; description: string };
      health: { title: string; description: string };
      insights: { title: string; description: string };
      ai: { title: string; description: string };
      settings: { title: string; description: string };
      members: { title: string; description: string };
      billing: { title: string; description: string };
      notifications: { title: string; description: string };
      statusPages: { title: string; description: string };
      audit: { title: string; description: string };
      security: { title: string; description: string };
      organization: { title: string; description: string };
      profile: { title: string; description: string };
    };
    settingsSections: {
      profile: { title: string; description: string };
      workspace: { title: string; description: string };
      team: { title: string; description: string };
      security: { title: string; description: string };
      notifications: { title: string; description: string };
      appearance: { title: string; description: string };
      ai: { title: string; description: string };
      api: { title: string; description: string };
      billing: { title: string; description: string };
    };
  };
  dashboardCommon: {
    save: string;
    cancel: string;
    create: string;
    delete: string;
    edit: string;
    update: string;
    close: string;
    confirm: string;
    back: string;
    next: string;
    previous: string;
    view: string;
    actions: string;
    loading: string;
    empty: string;
    noRecords: string;
    error: string;
    retry: string;
    search: string;
    filter: string;
    members: string;
    status: string;
    all: string;
    none: string;
    yes: string;
    no: string;
    saving: string;
    searching: string;
    previousPage: string;
    nextPage: string;
    dismiss: string;
    copy: string;
    copied: string;
    regenerate: string;
    revoke: string;
    invite: string;
    accept: string;
    decline: string;
    clearFilters: string;
    exportCsv: string;
    copyJson: string;
    downloadJson: string;
    copyLink: string;
    allProjects: string;
    allStatuses: string;
    allSeverities: string;
    allEnvironments: string;
    from: string;
    to: string;
    project: string;
    environment: string;
    severity: string;
    matchingFilters: string;
    goToProjects: string;
    never: string;
    newestFirst: string;
    oldestFirst: string;
    timeline: string;
    details: string;
    comment: string;
    environments: {
      production: string;
      staging: string;
      development: string;
    };
    loadingStates: {
      generic: string;
      errors: string;
      errorDetails: string;
      profile: string;
      notifications: string;
      health: string;
      billing: string;
      settings: string;
      apiSettings: string;
      aiSettings: string;
      appearance: string;
      incidents: string;
      incident: string;
      statusPages: string;
      dashboard: string;
      status: string;
      initializing: string;
      adminModule: string;
      adminAi: string;
      adminAnalytics: string;
      adminAudit: string;
      adminDashboard: string;
      adminMonitoring: string;
      adminSecurity: string;
      adminSettings: string;
      adminUsers: string;
      adminWorkspaces: string;
    };
  };
  system: {
    somethingWrong: string;
    unexpectedError: string;
    tryAgain: string;
    sectionLoadFailed: string;
    notFoundTitle: string;
    notFoundDesc: string;
    backHome: string;
    maintenanceTitle: string;
    maintenanceActive: string;
    maintenanceInactive: string;
    continueDashboard: string;
    scheduledMaintenance: string;
    maintenanceDesc: string;
    operatorsContinue: string;
    adminControlCenter: string;
    copyCode: string;
    copy: string;
    copied: string;
    errorDetails: string;
    incident: string;
    status: string;
    applicationError: string;
    criticalError: string;
    reload: string;
  };
  emails: {
    invite: {
      subjectTemplate: string;
      teammateFallback: string;
      heading: string;
      invitedYou: string;
      asRole: string;
      instructions: string;
      cta: string;
      orPaste: string;
      textOpen: string;
      textSignIn: string;
    };
    notification: {
      footerNotice: string;
      copyrightTemplate: string;
      openLabel: string;
    };
  };
  actionMessages: ActionMessagesDictionary;
  dash: DashDictionary;
  admin: AdminDictionary;
};
