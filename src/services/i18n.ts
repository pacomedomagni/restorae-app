/**
 * Internationalization (i18n) Service
 * 
 * Multi-language support with:
 * - Auto-detection of device locale
 * - Fallback to English
 * - RTL support detection
 * - Dynamic language switching
 * - Pluralization support
 */
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import logger from './logger';

// Supported locales
export type SupportedLocale = 'en' | 'fr' | 'es';

export const SUPPORTED_LOCALES: { code: SupportedLocale; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
];

const STORAGE_KEY = '@restorae/locale';

// Translation type definition
type TranslationKeys = typeof translations.en;

// Nested key path helper
type NestedKeyOf<T> = T extends object
  ? { [K in keyof T]: K extends string
      ? T[K] extends object
        ? `${K}.${NestedKeyOf<T[K]>}` | K
        : K
      : never
    }[keyof T]
  : never;

export type TranslationKey = NestedKeyOf<TranslationKeys>;

// =============================================================================
// TRANSLATIONS
// =============================================================================
const translations = {
  en: {
    common: {
      loading: 'Loading...',
      error: 'Something went wrong',
      retry: 'Try Again',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      done: 'Done',
      next: 'Next',
      back: 'Back',
      skip: 'Skip',
      close: 'Close',
      continue: 'Continue',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      ok: 'OK',
      search: 'Search',
      settings: 'Settings',
      premium: 'Premium',
      free: 'Free',
      minutes: 'min',
      hours: 'hr',
    },
    auth: {
      login: 'Log In',
      signup: 'Sign Up',
      logout: 'Log Out',
      email: 'Email',
      password: 'Password',
      forgotPassword: 'Forgot Password?',
      resetPassword: 'Reset Password',
      createAccount: 'Create Account',
      alreadyHaveAccount: 'Already have an account?',
      dontHaveAccount: "Don't have an account?",
      continueWithApple: 'Continue with Apple',
      continueWithGoogle: 'Continue with Google',
      continueAsGuest: 'Continue as Guest',
      invalidEmail: 'Please enter a valid email',
      invalidPassword: 'Password must be at least 8 characters',
      loginFailed: 'Login failed. Please check your credentials.',
      signupFailed: 'Sign up failed. Please try again.',
    },
    onboarding: {
      welcome: 'Welcome to Restorae',
      subtitle: 'Your sanctuary for mental wellness',
      getStarted: 'Get Started',
      step1Title: 'Track Your Mood',
      step1Description: 'Check in daily to understand your emotional patterns',
      step2Title: 'Find Your Calm',
      step2Description: 'Access breathing exercises, grounding techniques, and more',
      step3Title: 'Build Rituals',
      step3Description: 'Create personalized morning and evening routines',
    },
    tabs: {
      home: 'Home',
      tools: 'Tools',
      journal: 'Journal',
      stories: 'Stories',
      profile: 'Profile',
    },
    home: {
      greeting: {
        morning: 'Good morning',
        afternoon: 'Good afternoon',
        evening: 'Good evening',
      },
      howAreYou: 'How are you feeling?',
      quickActions: 'Quick Actions',
      breathe: 'Breathe',
      ground: 'Ground',
      reflect: 'Reflect',
      focus: 'Focus',
    },
    mood: {
      title: 'Mood Check-in',
      howFeeling: 'How are you feeling?',
      selectMood: 'Select your current mood',
      addNote: 'Add a note',
      noteOptional: 'optional',
      notePlaceholder: "What's on your mind...",
      saveCheckin: 'Save Check-in',
      continueWithout: 'Continue without note',
      moods: {
        energized: 'Energized',
        calm: 'Calm',
        good: 'Good',
        anxious: 'Anxious',
        low: 'Low',
        tough: 'Tough',
      },
      result: {
        title: 'Check-in Complete',
        saved: 'Your mood has been recorded',
        viewHistory: 'View History',
        backHome: 'Back to Home',
      },
      history: {
        title: 'Mood History',
        thisWeek: 'This Week',
        thisMonth: 'This Month',
        noEntries: 'No mood entries yet',
        startTracking: 'Start tracking your mood to see patterns',
      },
    },
    tools: {
      title: 'Wellness Tools',
      categories: {
        all: 'All',
        breathe: 'Breathe',
        body: 'Body',
        mind: 'Mind',
        sos: 'SOS',
      },
      breathing: {
        title: 'Breathing',
        description: 'patterns to calm, energize, or focus',
        inhale: 'Breathe in...',
        hold: 'Hold gently...',
        exhale: 'Let it go...',
        tapToStart: 'Tap orb to begin',
        complete: 'Beautifully done',
        cycle: 'Breath',
      },
      grounding: {
        title: 'Grounding',
        description: 'techniques to anchor in the present',
      },
      reset: {
        title: 'Body Reset',
        description: 'exercises to release physical tension',
      },
      focus: {
        title: 'Focus',
        description: 'sessions with ambient soundscapes',
      },
      situational: {
        title: 'Situational',
        description: 'guides for specific moments',
      },
      sos: {
        title: 'SOS',
        description: 'presets for immediate relief',
      },
    },
    journal: {
      title: 'Journal',
      newEntry: 'New Entry',
      prompts: 'Prompts',
      entries: 'Entries',
      searchPlaceholder: 'Search your journal...',
      emptyState: {
        title: 'Your journal is empty',
        description: 'Start writing to capture your thoughts',
        cta: 'Write First Entry',
      },
      entry: {
        placeholder: 'Start writing...',
        wordCount: 'words',
        autoSaving: 'Saving...',
        saved: 'Saved',
      },
      categories: {
        gratitude: 'Gratitude',
        reflection: 'Reflection',
        growth: 'Growth',
        release: 'Release',
      },
    },
    stories: {
      title: 'Sleep Stories',
      subtitle: 'Drift off with calming tales and soundscapes',
      tonightsPick: "Tonight's Pick",
      allStories: 'All Stories',
      categories: {
        all: 'All Stories',
        nature: 'Nature',
        travel: 'Travel',
        fantasy: 'Fantasy',
        meditation: 'Meditation',
        soundscapes: 'Soundscapes',
        classics: 'Classics',
      },
      player: {
        sleepTimer: 'Sleep Timer',
        endOfStory: 'End of story',
        off: 'Off',
      },
      unlock: {
        title: 'Unlock All Stories',
        description: 'Get access to 20+ premium sleep stories, 8-hour soundscapes, and new stories every month.',
      },
    },
    rituals: {
      title: 'Rituals',
      morning: {
        title: 'Morning Ritual',
        description: 'Start your day with intention',
      },
      evening: {
        title: 'Evening Ritual',
        description: 'Wind down for restful sleep',
      },
      custom: {
        title: 'Custom Rituals',
        create: 'Create Your Ritual',
        empty: "You haven't created any custom rituals yet",
      },
      steps: 'steps',
      duration: 'Duration',
    },
    profile: {
      title: 'Profile',
      editProfile: 'Edit Profile',
      subscription: {
        title: 'Subscription',
        free: 'Free Plan',
        premium: 'Premium',
        lifetime: 'Lifetime',
        upgrade: 'Upgrade to Premium',
        manage: 'Manage Subscription',
      },
      settings: {
        appearance: 'Appearance',
        soundHaptics: 'Sound & Haptics',
        reminders: 'Reminders',
        privacy: 'Privacy & Security',
        language: 'Language',
        data: 'Data & Storage',
        support: 'Support',
        about: 'About',
      },
    },
    settings: {
      appearance: {
        title: 'Appearance',
        theme: 'Theme',
        light: 'Light',
        dark: 'Dark',
        system: 'System',
        reduceMotion: 'Reduce Motion',
      },
      sound: {
        title: 'Sound & Haptics',
        sound: 'Sound',
        haptics: 'Haptic Feedback',
      },
      reminders: {
        title: 'Reminders',
        morning: 'Morning Check-in',
        evening: 'Evening Wind-down',
        breathing: 'Breathing Reminders',
      },
      privacy: {
        title: 'Privacy & Security',
        appLock: 'App Lock',
        biometric: 'Use Face ID / Touch ID',
        dataExport: 'Export My Data',
        deleteAccount: 'Delete Account',
      },
      language: {
        title: 'Language',
        current: 'Current Language',
        select: 'Select Language',
      },
    },
    paywall: {
      title: 'Unlock Premium',
      subtitle: 'Get unlimited access to all features',
      features: {
        title: 'Premium Features',
        unlimitedTools: 'Unlimited breathing & grounding exercises',
        allStories: 'All sleep stories & soundscapes',
        advancedJournal: 'Advanced journaling features',
        customRituals: 'Unlimited custom rituals',
        prioritySupport: 'Priority support',
      },
      subscribe: 'Subscribe Now',
      restore: 'Restore Purchases',
      terms: 'Terms of Service',
      privacy: 'Privacy Policy',
      perMonth: '/month',
      perYear: '/year',
      lifetime: 'One-time purchase',
      trial: 'Start 7-Day Free Trial',
    },
    errors: {
      network: 'No internet connection',
      server: 'Server error. Please try again.',
      unknown: 'Something went wrong',
      sessionExpired: 'Your session has expired. Please log in again.',
    },
    accessibility: {
      playButton: 'Play',
      pauseButton: 'Pause',
      closeButton: 'Close',
      menuButton: 'Menu',
      moreOptions: 'More options',
    },
  },
  
  fr: {
    common: {
      loading: 'Chargement...',
      error: 'Une erreur est survenue',
      retry: 'Réessayer',
      cancel: 'Annuler',
      save: 'Enregistrer',
      delete: 'Supprimer',
      edit: 'Modifier',
      done: 'Terminé',
      next: 'Suivant',
      back: 'Retour',
      skip: 'Passer',
      close: 'Fermer',
      continue: 'Continuer',
      confirm: 'Confirmer',
      yes: 'Oui',
      no: 'Non',
      ok: 'OK',
      search: 'Rechercher',
      settings: 'Paramètres',
      premium: 'Premium',
      free: 'Gratuit',
      minutes: 'min',
      hours: 'h',
    },
    auth: {
      login: 'Se connecter',
      signup: "S'inscrire",
      logout: 'Se déconnecter',
      email: 'E-mail',
      password: 'Mot de passe',
      forgotPassword: 'Mot de passe oublié ?',
      resetPassword: 'Réinitialiser le mot de passe',
      createAccount: 'Créer un compte',
      alreadyHaveAccount: 'Vous avez déjà un compte ?',
      dontHaveAccount: "Vous n'avez pas de compte ?",
      continueWithApple: 'Continuer avec Apple',
      continueWithGoogle: 'Continuer avec Google',
      continueAsGuest: 'Continuer en tant qu\'invité',
      invalidEmail: 'Veuillez entrer un e-mail valide',
      invalidPassword: 'Le mot de passe doit contenir au moins 8 caractères',
      loginFailed: 'Échec de la connexion. Vérifiez vos identifiants.',
      signupFailed: 'Échec de l\'inscription. Veuillez réessayer.',
    },
    onboarding: {
      welcome: 'Bienvenue sur Restorae',
      subtitle: 'Votre sanctuaire pour le bien-être mental',
      getStarted: 'Commencer',
      step1Title: 'Suivez votre humeur',
      step1Description: 'Faites le point quotidiennement pour comprendre vos émotions',
      step2Title: 'Trouvez votre calme',
      step2Description: 'Accédez à des exercices de respiration, d\'ancrage et plus',
      step3Title: 'Créez vos rituels',
      step3Description: 'Construisez des routines personnalisées matin et soir',
    },
    tabs: {
      home: 'Accueil',
      tools: 'Outils',
      journal: 'Journal',
      stories: 'Histoires',
      profile: 'Profil',
    },
    home: {
      greeting: {
        morning: 'Bonjour',
        afternoon: 'Bon après-midi',
        evening: 'Bonsoir',
      },
      howAreYou: 'Comment vous sentez-vous ?',
      quickActions: 'Actions rapides',
      breathe: 'Respirer',
      ground: 'S\'ancrer',
      reflect: 'Réfléchir',
      focus: 'Se concentrer',
    },
    mood: {
      title: 'Bilan émotionnel',
      howFeeling: 'Comment vous sentez-vous ?',
      selectMood: 'Sélectionnez votre humeur actuelle',
      addNote: 'Ajouter une note',
      noteOptional: 'optionnel',
      notePlaceholder: 'Qu\'avez-vous en tête...',
      saveCheckin: 'Enregistrer le bilan',
      continueWithout: 'Continuer sans note',
      moods: {
        energized: 'Énergique',
        calm: 'Calme',
        good: 'Bien',
        anxious: 'Anxieux',
        low: 'Bas',
        tough: 'Difficile',
      },
      result: {
        title: 'Bilan enregistré',
        saved: 'Votre humeur a été enregistrée',
        viewHistory: 'Voir l\'historique',
        backHome: 'Retour à l\'accueil',
      },
      history: {
        title: 'Historique des humeurs',
        thisWeek: 'Cette semaine',
        thisMonth: 'Ce mois',
        noEntries: 'Aucune entrée d\'humeur',
        startTracking: 'Commencez à suivre votre humeur pour voir les tendances',
      },
    },
    tools: {
      title: 'Outils de bien-être',
      categories: {
        all: 'Tous',
        breathe: 'Respirer',
        body: 'Corps',
        mind: 'Esprit',
        sos: 'SOS',
      },
      breathing: {
        title: 'Respiration',
        description: 'techniques pour calmer, énergiser ou se concentrer',
        inhale: 'Inspirez...',
        hold: 'Retenez doucement...',
        exhale: 'Expirez...',
        tapToStart: 'Touchez l\'orbe pour commencer',
        complete: 'Magnifiquement fait',
        cycle: 'Souffle',
      },
      grounding: {
        title: 'Ancrage',
        description: 'techniques pour s\'ancrer dans le présent',
      },
      reset: {
        title: 'Réinitialisation corporelle',
        description: 'exercices pour libérer les tensions physiques',
      },
      focus: {
        title: 'Concentration',
        description: 'sessions avec ambiances sonores',
      },
      situational: {
        title: 'Situationnel',
        description: 'guides pour des moments spécifiques',
      },
      sos: {
        title: 'SOS',
        description: 'préréglages pour un soulagement immédiat',
      },
    },
    journal: {
      title: 'Journal',
      newEntry: 'Nouvelle entrée',
      prompts: 'Suggestions',
      entries: 'Entrées',
      searchPlaceholder: 'Rechercher dans votre journal...',
      emptyState: {
        title: 'Votre journal est vide',
        description: 'Commencez à écrire pour capturer vos pensées',
        cta: 'Écrire la première entrée',
      },
      entry: {
        placeholder: 'Commencez à écrire...',
        wordCount: 'mots',
        autoSaving: 'Enregistrement...',
        saved: 'Enregistré',
      },
      categories: {
        gratitude: 'Gratitude',
        reflection: 'Réflexion',
        growth: 'Croissance',
        release: 'Lâcher-prise',
      },
    },
    stories: {
      title: 'Histoires du soir',
      subtitle: 'Endormez-vous avec des récits apaisants',
      tonightsPick: 'Sélection du soir',
      allStories: 'Toutes les histoires',
      categories: {
        all: 'Toutes les histoires',
        nature: 'Nature',
        travel: 'Voyage',
        fantasy: 'Fantaisie',
        meditation: 'Méditation',
        soundscapes: 'Ambiances sonores',
        classics: 'Classiques',
      },
      player: {
        sleepTimer: 'Minuterie de sommeil',
        endOfStory: 'Fin de l\'histoire',
        off: 'Désactivé',
      },
      unlock: {
        title: 'Débloquez toutes les histoires',
        description: 'Accédez à plus de 20 histoires premium, des ambiances de 8 heures et de nouvelles histoires chaque mois.',
      },
    },
    rituals: {
      title: 'Rituels',
      morning: {
        title: 'Rituel du matin',
        description: 'Commencez votre journée avec intention',
      },
      evening: {
        title: 'Rituel du soir',
        description: 'Détendez-vous pour un sommeil réparateur',
      },
      custom: {
        title: 'Rituels personnalisés',
        create: 'Créer votre rituel',
        empty: "Vous n'avez pas encore créé de rituel personnalisé",
      },
      steps: 'étapes',
      duration: 'Durée',
    },
    profile: {
      title: 'Profil',
      editProfile: 'Modifier le profil',
      subscription: {
        title: 'Abonnement',
        free: 'Plan gratuit',
        premium: 'Premium',
        lifetime: 'À vie',
        upgrade: 'Passer à Premium',
        manage: 'Gérer l\'abonnement',
      },
      settings: {
        appearance: 'Apparence',
        soundHaptics: 'Son et vibrations',
        reminders: 'Rappels',
        privacy: 'Confidentialité et sécurité',
        language: 'Langue',
        data: 'Données et stockage',
        support: 'Support',
        about: 'À propos',
      },
    },
    settings: {
      appearance: {
        title: 'Apparence',
        theme: 'Thème',
        light: 'Clair',
        dark: 'Sombre',
        system: 'Système',
        reduceMotion: 'Réduire les animations',
      },
      sound: {
        title: 'Son et vibrations',
        sound: 'Son',
        haptics: 'Retour haptique',
      },
      reminders: {
        title: 'Rappels',
        morning: 'Bilan du matin',
        evening: 'Détente du soir',
        breathing: 'Rappels de respiration',
      },
      privacy: {
        title: 'Confidentialité et sécurité',
        appLock: 'Verrouillage de l\'app',
        biometric: 'Utiliser Face ID / Touch ID',
        dataExport: 'Exporter mes données',
        deleteAccount: 'Supprimer le compte',
      },
      language: {
        title: 'Langue',
        current: 'Langue actuelle',
        select: 'Choisir la langue',
      },
    },
    paywall: {
      title: 'Débloquez Premium',
      subtitle: 'Accès illimité à toutes les fonctionnalités',
      features: {
        title: 'Fonctionnalités Premium',
        unlimitedTools: 'Exercices de respiration et d\'ancrage illimités',
        allStories: 'Toutes les histoires et ambiances sonores',
        advancedJournal: 'Fonctionnalités avancées du journal',
        customRituals: 'Rituels personnalisés illimités',
        prioritySupport: 'Support prioritaire',
      },
      subscribe: 'S\'abonner maintenant',
      restore: 'Restaurer les achats',
      terms: 'Conditions d\'utilisation',
      privacy: 'Politique de confidentialité',
      perMonth: '/mois',
      perYear: '/an',
      lifetime: 'Achat unique',
      trial: 'Commencer l\'essai gratuit de 7 jours',
    },
    errors: {
      network: 'Pas de connexion internet',
      server: 'Erreur serveur. Veuillez réessayer.',
      unknown: 'Une erreur est survenue',
      sessionExpired: 'Votre session a expiré. Veuillez vous reconnecter.',
    },
    accessibility: {
      playButton: 'Lecture',
      pauseButton: 'Pause',
      closeButton: 'Fermer',
      menuButton: 'Menu',
      moreOptions: 'Plus d\'options',
    },
  },

  es: {
    common: {
      loading: 'Cargando...',
      error: 'Algo salió mal',
      retry: 'Reintentar',
      cancel: 'Cancelar',
      save: 'Guardar',
      delete: 'Eliminar',
      edit: 'Editar',
      done: 'Hecho',
      next: 'Siguiente',
      back: 'Atrás',
      skip: 'Omitir',
      close: 'Cerrar',
      continue: 'Continuar',
      confirm: 'Confirmar',
      yes: 'Sí',
      no: 'No',
      ok: 'OK',
      search: 'Buscar',
      settings: 'Configuración',
      premium: 'Premium',
      free: 'Gratis',
      minutes: 'min',
      hours: 'h',
    },
    auth: {
      login: 'Iniciar sesión',
      signup: 'Registrarse',
      logout: 'Cerrar sesión',
      email: 'Correo electrónico',
      password: 'Contraseña',
      forgotPassword: '¿Olvidaste tu contraseña?',
      resetPassword: 'Restablecer contraseña',
      createAccount: 'Crear cuenta',
      alreadyHaveAccount: '¿Ya tienes una cuenta?',
      dontHaveAccount: '¿No tienes una cuenta?',
      continueWithApple: 'Continuar con Apple',
      continueWithGoogle: 'Continuar con Google',
      continueAsGuest: 'Continuar como invitado',
      invalidEmail: 'Por favor, introduce un correo válido',
      invalidPassword: 'La contraseña debe tener al menos 8 caracteres',
      loginFailed: 'Error al iniciar sesión. Verifica tus credenciales.',
      signupFailed: 'Error al registrarse. Por favor, inténtalo de nuevo.',
    },
    onboarding: {
      welcome: 'Bienvenido a Restorae',
      subtitle: 'Tu santuario para el bienestar mental',
      getStarted: 'Comenzar',
      step1Title: 'Registra tu estado de ánimo',
      step1Description: 'Haz un seguimiento diario para entender tus patrones emocionales',
      step2Title: 'Encuentra tu calma',
      step2Description: 'Accede a ejercicios de respiración, técnicas de anclaje y más',
      step3Title: 'Crea rituales',
      step3Description: 'Construye rutinas personalizadas de mañana y noche',
    },
    tabs: {
      home: 'Inicio',
      tools: 'Herramientas',
      journal: 'Diario',
      stories: 'Historias',
      profile: 'Perfil',
    },
    home: {
      greeting: {
        morning: 'Buenos días',
        afternoon: 'Buenas tardes',
        evening: 'Buenas noches',
      },
      howAreYou: '¿Cómo te sientes?',
      quickActions: 'Acciones rápidas',
      breathe: 'Respirar',
      ground: 'Anclarse',
      reflect: 'Reflexionar',
      focus: 'Concentrarse',
    },
    mood: {
      title: 'Registro de ánimo',
      howFeeling: '¿Cómo te sientes?',
      selectMood: 'Selecciona tu estado de ánimo actual',
      addNote: 'Añadir una nota',
      noteOptional: 'opcional',
      notePlaceholder: '¿Qué tienes en mente...',
      saveCheckin: 'Guardar registro',
      continueWithout: 'Continuar sin nota',
      moods: {
        energized: 'Energético',
        calm: 'Tranquilo',
        good: 'Bien',
        anxious: 'Ansioso',
        low: 'Bajo',
        tough: 'Difícil',
      },
      result: {
        title: 'Registro completado',
        saved: 'Tu estado de ánimo ha sido registrado',
        viewHistory: 'Ver historial',
        backHome: 'Volver al inicio',
      },
      history: {
        title: 'Historial de ánimo',
        thisWeek: 'Esta semana',
        thisMonth: 'Este mes',
        noEntries: 'Sin registros de ánimo',
        startTracking: 'Comienza a registrar tu ánimo para ver patrones',
      },
    },
    tools: {
      title: 'Herramientas de bienestar',
      categories: {
        all: 'Todos',
        breathe: 'Respirar',
        body: 'Cuerpo',
        mind: 'Mente',
        sos: 'SOS',
      },
      breathing: {
        title: 'Respiración',
        description: 'patrones para calmar, energizar o concentrar',
        inhale: 'Inhala...',
        hold: 'Mantén suavemente...',
        exhale: 'Exhala...',
        tapToStart: 'Toca el orbe para comenzar',
        complete: 'Bellamente hecho',
        cycle: 'Respiración',
      },
      grounding: {
        title: 'Anclaje',
        description: 'técnicas para anclarte en el presente',
      },
      reset: {
        title: 'Reinicio corporal',
        description: 'ejercicios para liberar tensión física',
      },
      focus: {
        title: 'Concentración',
        description: 'sesiones con paisajes sonoros',
      },
      situational: {
        title: 'Situacional',
        description: 'guías para momentos específicos',
      },
      sos: {
        title: 'SOS',
        description: 'preajustes para alivio inmediato',
      },
    },
    journal: {
      title: 'Diario',
      newEntry: 'Nueva entrada',
      prompts: 'Sugerencias',
      entries: 'Entradas',
      searchPlaceholder: 'Buscar en tu diario...',
      emptyState: {
        title: 'Tu diario está vacío',
        description: 'Empieza a escribir para capturar tus pensamientos',
        cta: 'Escribir primera entrada',
      },
      entry: {
        placeholder: 'Empieza a escribir...',
        wordCount: 'palabras',
        autoSaving: 'Guardando...',
        saved: 'Guardado',
      },
      categories: {
        gratitude: 'Gratitud',
        reflection: 'Reflexión',
        growth: 'Crecimiento',
        release: 'Soltar',
      },
    },
    stories: {
      title: 'Historias para dormir',
      subtitle: 'Déjate llevar con relatos y paisajes sonoros relajantes',
      tonightsPick: 'Selección de esta noche',
      allStories: 'Todas las historias',
      categories: {
        all: 'Todas las historias',
        nature: 'Naturaleza',
        travel: 'Viajes',
        fantasy: 'Fantasía',
        meditation: 'Meditación',
        soundscapes: 'Paisajes sonoros',
        classics: 'Clásicos',
      },
      player: {
        sleepTimer: 'Temporizador de sueño',
        endOfStory: 'Fin de la historia',
        off: 'Desactivado',
      },
      unlock: {
        title: 'Desbloquea todas las historias',
        description: 'Accede a más de 20 historias premium, paisajes sonoros de 8 horas y nuevas historias cada mes.',
      },
    },
    rituals: {
      title: 'Rituales',
      morning: {
        title: 'Ritual matutino',
        description: 'Comienza tu día con intención',
      },
      evening: {
        title: 'Ritual nocturno',
        description: 'Relájate para un sueño reparador',
      },
      custom: {
        title: 'Rituales personalizados',
        create: 'Crear tu ritual',
        empty: 'Aún no has creado ningún ritual personalizado',
      },
      steps: 'pasos',
      duration: 'Duración',
    },
    profile: {
      title: 'Perfil',
      editProfile: 'Editar perfil',
      subscription: {
        title: 'Suscripción',
        free: 'Plan gratuito',
        premium: 'Premium',
        lifetime: 'De por vida',
        upgrade: 'Actualizar a Premium',
        manage: 'Gestionar suscripción',
      },
      settings: {
        appearance: 'Apariencia',
        soundHaptics: 'Sonido y vibración',
        reminders: 'Recordatorios',
        privacy: 'Privacidad y seguridad',
        language: 'Idioma',
        data: 'Datos y almacenamiento',
        support: 'Soporte',
        about: 'Acerca de',
      },
    },
    settings: {
      appearance: {
        title: 'Apariencia',
        theme: 'Tema',
        light: 'Claro',
        dark: 'Oscuro',
        system: 'Sistema',
        reduceMotion: 'Reducir movimiento',
      },
      sound: {
        title: 'Sonido y vibración',
        sound: 'Sonido',
        haptics: 'Retroalimentación háptica',
      },
      reminders: {
        title: 'Recordatorios',
        morning: 'Registro matutino',
        evening: 'Relajación nocturna',
        breathing: 'Recordatorios de respiración',
      },
      privacy: {
        title: 'Privacidad y seguridad',
        appLock: 'Bloqueo de app',
        biometric: 'Usar Face ID / Touch ID',
        dataExport: 'Exportar mis datos',
        deleteAccount: 'Eliminar cuenta',
      },
      language: {
        title: 'Idioma',
        current: 'Idioma actual',
        select: 'Seleccionar idioma',
      },
    },
    paywall: {
      title: 'Desbloquea Premium',
      subtitle: 'Acceso ilimitado a todas las funciones',
      features: {
        title: 'Funciones Premium',
        unlimitedTools: 'Ejercicios ilimitados de respiración y anclaje',
        allStories: 'Todas las historias y paisajes sonoros',
        advancedJournal: 'Funciones avanzadas del diario',
        customRituals: 'Rituales personalizados ilimitados',
        prioritySupport: 'Soporte prioritario',
      },
      subscribe: 'Suscribirse ahora',
      restore: 'Restaurar compras',
      terms: 'Términos de servicio',
      privacy: 'Política de privacidad',
      perMonth: '/mes',
      perYear: '/año',
      lifetime: 'Compra única',
      trial: 'Comenzar prueba gratuita de 7 días',
    },
    errors: {
      network: 'Sin conexión a internet',
      server: 'Error del servidor. Por favor, inténtalo de nuevo.',
      unknown: 'Algo salió mal',
      sessionExpired: 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.',
    },
    accessibility: {
      playButton: 'Reproducir',
      pauseButton: 'Pausar',
      closeButton: 'Cerrar',
      menuButton: 'Menú',
      moreOptions: 'Más opciones',
    },
  },
};

// =============================================================================
// I18N CLASS
// =============================================================================
class I18n {
  private currentLocale: SupportedLocale = 'en';
  private listeners: Set<(locale: SupportedLocale) => void> = new Set();

  async initialize(): Promise<void> {
    try {
      // Check for saved locale preference
      const savedLocale = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedLocale && this.isSupported(savedLocale)) {
        this.currentLocale = savedLocale as SupportedLocale;
      } else {
        // Detect device locale
        const locales = Localization.getLocales();
        const deviceLocale = locales[0]?.languageCode ?? 'en';
        if (this.isSupported(deviceLocale)) {
          this.currentLocale = deviceLocale as SupportedLocale;
        }
      }

      logger.info(`I18n initialized with locale: ${this.currentLocale}`);
    } catch (error) {
      logger.error('I18n initialization failed:', error);
    }
  }

  private isSupported(locale: string): boolean {
    return SUPPORTED_LOCALES.some(l => l.code === locale);
  }

  get locale(): SupportedLocale {
    return this.currentLocale;
  }

  get isRTL(): boolean {
    // Add RTL languages when supported (Arabic, Hebrew, etc.)
    return false;
  }

  async setLocale(locale: SupportedLocale): Promise<void> {
    if (!this.isSupported(locale)) {
      logger.warn(`Locale ${locale} is not supported`);
      return;
    }

    this.currentLocale = locale;
    await AsyncStorage.setItem(STORAGE_KEY, locale);
    
    // Notify listeners
    this.listeners.forEach(listener => listener(locale));
    
    logger.info(`Locale changed to: ${locale}`);
  }

  /**
   * Get translation by key path (e.g., 'home.greeting.morning')
   */
  t(key: string, params?: Record<string, string | number>): string {
    const keys = key.split('.');
    let value: unknown = translations[this.currentLocale];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in (value as Record<string, unknown>)) {
        value = (value as Record<string, unknown>)[k];
      } else {
        // Fallback to English
        value = translations.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in (value as Record<string, unknown>)) {
            value = (value as Record<string, unknown>)[fallbackKey];
          } else {
            return key; // Return key if not found
          }
        }
        break;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Replace parameters
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => {
        return params[paramKey]?.toString() || '';
      });
    }

    return value;
  }

  /**
   * Pluralization helper
   */
  plural(key: string, count: number, params?: Record<string, string | number>): string {
    const pluralKey = count === 1 ? `${key}.one` : `${key}.other`;
    return this.t(pluralKey, { count, ...params });
  }

  /**
   * Subscribe to locale changes
   */
  subscribe(listener: (locale: SupportedLocale) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get all translations for current locale
   */
  getTranslations(): typeof translations.en {
    return translations[this.currentLocale];
  }
}

// Export singleton
export const i18n = new I18n();

// Hook for React components
export function useTranslation() {
  return {
    t: (key: string, params?: Record<string, string | number>) => i18n.t(key, params),
    locale: i18n.locale,
    setLocale: (locale: SupportedLocale) => i18n.setLocale(locale),
    isRTL: i18n.isRTL,
  };
}

export default i18n;
