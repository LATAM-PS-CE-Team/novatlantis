import React, { useState, useEffect, useRef } from 'react';
import {
  Avatar,
  Box,
  Button,
  ButtonGroup,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Alert
} from '@mui/material';
import {
  Shield as ShieldIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Logout as LogoutIcon,
  PhotoCamera as PhotoCameraIcon,
  Key as KeyIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Lock as LockIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Menu as MenuIcon,
  MenuOpen as MenuOpenIcon,
  Launch as LaunchIcon,
  AdminPanelSettings as AdminIcon,
  Save as SaveIcon,
  DeleteOutline as DeleteOutlineIcon,
  Language as LanguageIcon
} from '@mui/icons-material';

export type SupportedLanguage = 'pt-BR' | 'es-419' | 'en-US';

export function resolveInitialLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return 'pt-BR';
  const params = new URLSearchParams(window.location.search);
  const urlLang = params.get('lang');
  if (urlLang === 'pt-BR' || urlLang === 'es-419' || urlLang === 'en-US') {
    window.localStorage.setItem('novatlantis_lang', urlLang);
    return urlLang;
  }
  const saved = window.localStorage.getItem('novatlantis_lang');
  if (saved === 'pt-BR' || saved === 'es-419' || saved === 'en-US') {
    return saved;
  }
  const nav = (navigator.language || '').toLowerCase();
  if (nav.startsWith('es')) return 'es-419';
  if (nav.startsWith('en')) return 'en-US';
  return 'pt-BR';
}

export interface AuthUserProfile {
  nid: string;
  name: string;
  full_name: string;
  social_name: string;
  email: string;
  email_verified: boolean;
  status: string;
  must_change_password: boolean;
  avatarUrl: string | null;
  avatar_url?: string | null;
  phone_number: string;
  bio: string;
  role: string;
  profession: string;
  district: string;
  age: number;
  native_language: string;
}

interface FamilyMemberRecord {
  relation_id: string;
  relative_nid: string;
  relative_name: string;
  relative_age: number;
  relative_profession: string;
  relation_type: string;
  direction: string;
  has_legal_custody: boolean;
  is_emergency_contact: boolean;
}

interface TopNavUserWidgetProps {
  onUserAuthenticated?: (nid: string, user: AuthUserProfile, ssoToken?: string) => void;
  onUserLoggedOut?: () => void;
  currentNid?: string;
  openLoginTrigger?: number;
  loginReasonMessage?: string | null;
  citizenPortalUrl?: string;
  govBackstageUrl?: string;
  lang?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
}

type ProfileSection = 'PERSONAL_DATA' | 'PASSWORD_SECURITY' | 'FAMILY_READONLY' | 'SECURITY_ACCESS';

const WIDGET_I18N: Record<
  SupportedLanguage,
  {
    checking: string;
    signInWithNid: string;
    authTitle: string;
    authSubtitle: string;
    nidOrEmailLabel: string;
    passwordLabel: string;
    fillInitialPassword: string;
    simulateFirstLogin: string;
    quickTestTitle: string;
    signInContinue: string;
    authenticating: string;
    menuBtn: string;
    closeMenuBtn: string;
    profileTitle: string;
    secPersonal: string;
    secPassword: string;
    secFamily: string;
    secIdentity360: string;
    chooseSavePhoto: string;
    savingPhoto: string;
    restoreDefaultPhoto: string;
    socialNameLabel: string;
    emailLabel: string;
    phoneLabel: string;
    districtLabel: string;
    nativeLangLabel: string;
    bioLabel: string;
    moreProfileOptions: string;
    hideProfileOptions: string;
    saveProfileBtn: string;
    savingProfileBtn: string;
    openCitizenPortal: string;
    openBackstage: string;
    logoutBtn: string;
    switchCitizenBtn: string;
  }
> = {
  'pt-BR': {
    checking: 'Verificando...',
    signInWithNid: 'Entrar com NID',
    authTitle: 'Identidade Digital Soberana (NID)',
    authSubtitle: 'República de Novatlantis • Autenticação Unificada AlloyDB',
    nidOrEmailLabel: 'Identificador Nacional (NID) ou E-mail',
    passwordLabel: 'Senha de Acesso',
    fillInitialPassword: 'Preencher Senha Inicial do NID',
    simulateFirstLogin: 'Simular 1º Acesso (OTP)',
    quickTestTitle: 'CREDENCIAIS RÁPIDAS PARA TESTE (CLIQUE PARA PREENCHER):',
    signInContinue: 'Entrar e Continuar',
    authenticating: 'Autenticando no AlloyDB...',
    menuBtn: 'Menu',
    closeMenuBtn: 'Fechar Menu ✕',
    profileTitle: 'Perfil Soberano do Cidadão',
    secPersonal: 'Dados Cadastrais & Foto Oficial',
    secPassword: 'Segurança & Alteração de Senha',
    secFamily: 'Núcleo Familiar (Somente Leitura)',
    secIdentity360: 'Credenciais Identidade 360 & Portais',
    chooseSavePhoto: 'Escolher e Salvar Nova Foto (WEBP / PNG / JPG)',
    savingPhoto: 'Salvando Foto no Banco...',
    restoreDefaultPhoto: 'Restaurar Padrão',
    socialNameLabel: 'Nome de Exibição / Nome Social',
    emailLabel: 'E-mail Cadastral Soberano',
    phoneLabel: 'Telefone Soberano de Contato',
    districtLabel: 'Distrito Oficial de Residência',
    nativeLangLabel: 'Idioma Nativo / Preferencial (i18n)',
    bioLabel: 'Observações Cadastrais / Bio',
    moreProfileOptions: 'Mais Opções do Perfil (☰)',
    hideProfileOptions: 'Ocultar Mais Opções do Perfil',
    saveProfileBtn: 'Salvar Dados e Foto no AlloyDB',
    savingProfileBtn: 'Gravando no AlloyDB...',
    openCitizenPortal: 'Abrir Portal do Cidadão',
    openBackstage: 'Abrir Backstage',
    logoutBtn: 'Encerrar Sessão (Logout)',
    switchCitizenBtn: 'Alternar para Outro Cidadão (NID)'
  },
  'es-419': {
    checking: 'Verificando...',
    signInWithNid: 'Ingresar con NID',
    authTitle: 'Identidad Digital Soberana (NID)',
    authSubtitle: 'República de Novatlantis • Autenticación Unificada AlloyDB',
    nidOrEmailLabel: 'Identificador Nacional (NID) o Correo',
    passwordLabel: 'Contraseña de Acceso',
    fillInitialPassword: 'Completar Contraseña Inicial del NID',
    simulateFirstLogin: 'Simular 1er Acceso (OTP)',
    quickTestTitle: 'CREDENCIALES RÁPIDAS DE PRUEBA (CLIC PARA COMPLETAR):',
    signInContinue: 'Ingresar y Continuar',
    authenticating: 'Autenticando en AlloyDB...',
    menuBtn: 'Menú',
    closeMenuBtn: 'Cerrar Menú ✕',
    profileTitle: 'Perfil Soberano del Ciudadano',
    secPersonal: 'Datos Personales y Foto Oficial',
    secPassword: 'Seguridad y Cambio de Contraseña',
    secFamily: 'Núcleo Familiar (Solo Lectura)',
    secIdentity360: 'Credenciales Identidad 360 y Portales',
    chooseSavePhoto: 'Elegir y Guardar Nueva Foto (WEBP / PNG / JPG)',
    savingPhoto: 'Guardando Foto en Base de Datos...',
    restoreDefaultPhoto: 'Restaurar Predeterminada',
    socialNameLabel: 'Nombre Social / de Visualización',
    emailLabel: 'Correo Electrónico Soberano',
    phoneLabel: 'Teléfono Soberano de Contacto',
    districtLabel: 'Distrito Oficial de Residencia',
    nativeLangLabel: 'Idioma Nativo / Preferido (i18n)',
    bioLabel: 'Observaciones Registrales / Bio',
    moreProfileOptions: 'Más Opciones del Perfil (☰)',
    hideProfileOptions: 'Ocultar Más Opciones del Perfil',
    saveProfileBtn: 'Guardar Datos y Foto en AlloyDB',
    savingProfileBtn: 'Guardando en AlloyDB...',
    openCitizenPortal: 'Abrir Portal del Ciudadano',
    openBackstage: 'Abrir Backstage',
    logoutBtn: 'Cerrar Sesión (Logout)',
    switchCitizenBtn: 'Cambiar a Otro Ciudadano (NID)'
  },
  'en-US': {
    checking: 'Checking...',
    signInWithNid: 'Sign in with NID',
    authTitle: 'Sovereign Digital Identity (NID)',
    authSubtitle: 'Republic of Novatlantis • AlloyDB Unified Authentication',
    nidOrEmailLabel: 'National Identifier (NID) or Email',
    passwordLabel: 'Access Password',
    fillInitialPassword: 'Fill Initial NID Password',
    simulateFirstLogin: 'Simulate 1st Login (OTP)',
    quickTestTitle: 'QUICK TEST CREDENTIALS (CLICK TO AUTO-FILL):',
    signInContinue: 'Sign In & Continue',
    authenticating: 'Authenticating on AlloyDB...',
    menuBtn: 'Menu',
    closeMenuBtn: 'Close Menu ✕',
    profileTitle: 'Sovereign Citizen Profile',
    secPersonal: 'Personal Data & Official Photo',
    secPassword: 'Security & Password Change',
    secFamily: 'Family Nucleus (Read-Only)',
    secIdentity360: 'Identity 360 Credentials & Portals',
    chooseSavePhoto: 'Choose & Save New Photo (WEBP / PNG / JPG)',
    savingPhoto: 'Saving Photo to Database...',
    restoreDefaultPhoto: 'Restore Default',
    socialNameLabel: 'Display Name / Social Name',
    emailLabel: 'Sovereign Registered Email',
    phoneLabel: 'Sovereign Contact Phone',
    districtLabel: 'Official Residence District',
    nativeLangLabel: 'Native / Preferred Language (i18n)',
    bioLabel: 'Registration Notes / Bio',
    moreProfileOptions: 'More Profile Options (☰)',
    hideProfileOptions: 'Hide More Profile Options',
    saveProfileBtn: 'Save Data & Photo to AlloyDB',
    savingProfileBtn: 'Saving to AlloyDB...',
    openCitizenPortal: 'Open Citizen Portal',
    openBackstage: 'Open Backstage',
    logoutBtn: 'Sign Out (Logout)',
    switchCitizenBtn: 'Switch to Another Citizen (NID)'
  }
};

/**
 * Redimensiona e comprime imagens selecionadas pelo usuário para um DataURL JPEG/WEBP otimizado (máx 360x360),
 * garantindo upload instantâneo e gravação confiável no banco de dados (SQLite + AlloyDB PostgreSQL).
 */
async function compressImageFileToDataUrl(file: File): Promise<{ dataUrl: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo de imagem selecionado.'));
    reader.onload = () => {
      const rawDataUrl = String(reader.result || '');
      const img = new Image();
      img.onerror = () => {
        resolve({ dataUrl: rawDataUrl, mimeType: file.type || 'image/jpeg' });
      };
      img.onload = () => {
        try {
          const maxDim = 360;
          let width = img.width || 360;
          let height = img.height || 360;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ dataUrl: rawDataUrl, mimeType: file.type || 'image/jpeg' });
            return;
          }
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.86);
          resolve({ dataUrl: compressedDataUrl, mimeType: 'image/jpeg' });
        } catch {
          resolve({ dataUrl: rawDataUrl, mimeType: file.type || 'image/jpeg' });
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export const TopNavUserWidget: React.FC<TopNavUserWidgetProps> = ({
  onUserAuthenticated,
  onUserLoggedOut,
  openLoginTrigger = 0,
  loginReasonMessage = null,
  citizenPortalUrl = 'https://novatlantis-citizen-portal-wpahcxvhuq-uc.a.run.app',
  govBackstageUrl = 'https://novatlantis-gov-backstage-wpahcxvhuq-uc.a.run.app',
  lang: propLang,
  onLanguageChange
}) => {
  const [internalLang, setInternalLang] = useState<SupportedLanguage>(() => resolveInitialLanguage());
  const activeLang: SupportedLanguage = propLang || internalLang;
  const t = WIDGET_I18N[activeLang] || WIDGET_I18N['pt-BR'];

  const [user, setUser] = useState<AuthUserProfile | null>(null);
  const [ssoToken, setSsoToken] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Modals & Internal Non-Blocking Hamburger Menu State
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileHamburgerOpen, setProfileHamburgerOpen] = useState(false);
  const [activeProfileSection, setActiveProfileSection] = useState<ProfileSection>('PERSONAL_DATA');

  // Auth flow steps: 'LOGIN' | 'FIRST_LOGIN_SETUP' | 'VERIFY_EMAIL_OTP'
  const [authStep, setAuthStep] = useState<'LOGIN' | 'FIRST_LOGIN_SETUP' | 'VERIFY_EMAIL_OTP'>('LOGIN');
  const [nidInput, setNidInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [dispatchedOtpPreview, setDispatchedOtpPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [initialPasswordDisabled, setInitialPasswordDisabled] = useState(false);

  // Profile edit state
  const [editSocialName, setEditSocialName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editNativeLang, setEditNativeLang] = useState<SupportedLanguage>('pt-BR');
  const [editBio, setEditBio] = useState('');
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileStatusMsg, setProfileStatusMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Password Change state inside Profile Modal
  const [currentPasswordForChange, setCurrentPasswordForChange] = useState('');
  const [newPasswordForChange, setNewPasswordForChange] = useState('');
  const [confirmNewPasswordForChange, setConfirmNewPasswordForChange] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Family Read-Only state
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberRecord[]>([]);
  const [loadingFamily, setLoadingFamily] = useState(false);

  const handleSelectLanguage = (newLang: SupportedLanguage, markExplicitOverride = true) => {
    setInternalLang(newLang);
    setEditNativeLang(newLang);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('novatlantis_lang', newLang);
      if (markExplicitOverride) {
        window.localStorage.setItem('novatlantis_lang_explicit', '1');
      }
    }
    if (onLanguageChange) {
      onLanguageChange(newLang);
    }
  };

  const syncFormStateFromUser = (u: AuthUserProfile) => {
    setEditSocialName(u.social_name || u.full_name || u.name || '');
    setEditEmail(u.email || '');
    setEditPhone(u.phone_number || '');
    setEditDistrict(u.district || '');
    const userLang =
      u.native_language === 'es-419' || u.native_language === 'en-US' || u.native_language === 'pt-BR'
        ? (u.native_language as SupportedLanguage)
        : 'pt-BR';
    setEditNativeLang(userLang);
    setEditBio(u.bio || '');
    setPendingAvatarUrl(u.avatarUrl || u.avatar_url || null);

    // Camada 1 de i18n: se o usuário autenticado possui native_language e não fez override explícito manual, aplica o idioma do banco
    if (typeof window !== 'undefined' && !window.localStorage.getItem('novatlantis_lang_explicit')) {
      handleSelectLanguage(userLang, false);
    }
  };

  const fetchProfileSession = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlSsoToken = params.get('sso_token');
      const qs = urlSsoToken ? `?sso_token=${encodeURIComponent(urlSsoToken)}` : '';

      const res = await fetch(`/api/v1/profile/me${qs}`, { credentials: 'include' });
      if (urlSsoToken) {
        params.delete('sso_token');
        const cleanSearch = params.toString();
        window.history.replaceState({}, '', `${window.location.pathname}${cleanSearch ? `?${cleanSearch}` : ''}`);
      }

      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = await res.json();
      if (data.authenticated && data.user) {
        const normalizedUser: AuthUserProfile = {
          ...data.user,
          avatarUrl: data.user.avatarUrl || data.user.avatar_url || null
        };
        setUser(normalizedUser);
        setSsoToken(data.sso_token || null);
        syncFormStateFromUser(normalizedUser);
        if (onUserAuthenticated) {
          onUserAuthenticated(normalizedUser.nid, normalizedUser, data.sso_token);
        }
      } else {
        setUser(null);
        setSsoToken(null);
      }
    } catch {
      setUser(null);
      setSsoToken(null);
    } finally {
      setLoadingSession(false);
    }
  };

  useEffect(() => {
    fetchProfileSession();
  }, []);

  useEffect(() => {
    if (openLoginTrigger > 0 && !user) {
      setAuthStep('LOGIN');
      setAuthError(null);
      setAuthNotice(loginReasonMessage || 'Para solicitar este serviço oficial, identifique-se com seu NID e senha.');
      setLoginModalOpen(true);
    }
  }, [openLoginTrigger, loginReasonMessage, user]);

  // Verifica automaticamente se o NID informado já criou a primeira senha definitiva para desativar o botão de senha inicial
  useEffect(() => {
    if (!loginModalOpen) return;
    const cleanTarget = nidInput.trim();
    if (cleanTarget.length < 2) {
      setInitialPasswordDisabled(false);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/auth/postal-dispatch?nid=${encodeURIComponent(cleanTarget)}&check_only=1`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setInitialPasswordDisabled(Boolean(data.initial_password_disabled));
        }
      } catch {
        // ignore check error
      }
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [nidInput, loginModalOpen]);

  const loadFamilyData = async (targetNid: string) => {
    setLoadingFamily(true);
    try {
      const res = await fetch(`/api/v1/profile/family?nid=${encodeURIComponent(targetNid)}`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setFamilyMembers(data.family_members || []);
      }
    } finally {
      setLoadingFamily(false);
    }
  };

  const lookupPostalInitialPassword = async (targetNid: string) => {
    const cleanTarget = targetNid.trim();
    if (!cleanTarget) {
      setAuthError('Digite um NID ou selecione um perfil abaixo antes de consultar a senha inicial.');
      return;
    }
    setAuthError(null);
    try {
      const res = await fetch(`/api/v1/auth/postal-dispatch?nid=${encodeURIComponent(cleanTarget)}&check_only=1`);
      const data = await res.json();
      if (data.initial_password_disabled) {
        setInitialPasswordDisabled(true);
        setPasswordInput('');
        setEmailInput(data.citizen?.email || '');
        setAuthNotice(
          activeLang === 'es-419'
            ? `Por seguridad, la opción de contraseña inicial fue desactivada para ${data.citizen?.full_name || cleanTarget} porque ya creó su primera contraseña definitiva.`
            : activeLang === 'en-US'
            ? `For security, the initial password option has been disabled for ${data.citizen?.full_name || cleanTarget} because the first custom password has already been created.`
            : `Por segurança, a opção de preencher a senha inicial foi desativada para ${data.citizen?.full_name || cleanTarget} porque a primeira senha definitiva já foi criada.`
        );
        return;
      }
      if (res.ok && data.initial_password) {
        setInitialPasswordDisabled(false);
        setPasswordInput(data.initial_password);
        setEmailInput(data.citizen?.email || '');
        setAuthNotice(
          `Credencial localizada no AlloyDB para ${data.citizen?.full_name || cleanTarget}: senha inicial preenchida (${data.initial_password})`
        );
      } else {
        setAuthError(data.error || 'NID não encontrado no lote de 100.000 cidadãos.');
      }
    } catch {
      setAuthError('Falha ao consultar o lote postal de senhas iniciais.');
    }
  };

  const resetCitizenToFirstLogin = async (targetNid: string) => {
    const cleanTarget = targetNid.trim();
    if (!cleanTarget) {
      setAuthError('Informe o NID para simular o fluxo de 1º acesso.');
      return;
    }
    setAuthError(null);
    try {
      const res = await fetch('/api/v1/auth/reset-first-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nid: cleanTarget })
      });
      const data = await res.json();
      if (res.ok) {
        setInitialPasswordDisabled(false);
        setPasswordInput(data.initial_password || '');
        setAuthStep('LOGIN');
        setAuthNotice(
          `Status de ${cleanTarget} redefinido para FIRST_LOGIN_REQUIRED. Senha inicial preenchida (${data.initial_password}).`
        );
      }
    } catch {
      setAuthError('Erro ao redefinir status de primeiro acesso.');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthNotice(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nid: nidInput.trim(),
          password: passwordInput
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Credenciais inválidas.');
        return;
      }

      if (data.challenge === 'FIRST_LOGIN_REQUIRED') {
        setNidInput(data.nid || nidInput.trim());
        setEmailInput(data.current_email || emailInput || '');
        setAuthStep('FIRST_LOGIN_SETUP');
        setAuthNotice(data.message);
        return;
      }

      if (data.authenticated && data.user) {
        const normalizedUser: AuthUserProfile = {
          ...data.user,
          avatarUrl: data.user.avatarUrl || data.user.avatar_url || null
        };
        setUser(normalizedUser);
        setSsoToken(data.sso_token || null);
        syncFormStateFromUser(normalizedUser);
        setLoginModalOpen(false);
        if (onUserAuthenticated) {
          onUserAuthenticated(normalizedUser.nid, normalizedUser, data.sso_token);
        }
      }
    } catch {
      setAuthError('Falha de comunicação com o servidor de autenticação.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFirstLoginSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthNotice(null);

    if (newPasswordInput !== confirmPasswordInput) {
      setAuthError('A confirmação da nova senha não coincide.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/auth/first-login/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nid: nidInput.trim(),
          new_password: newPasswordInput,
          email: emailInput.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Não foi possível configurar a nova senha.');
        return;
      }

      setInitialPasswordDisabled(true);
      setDispatchedOtpPreview(data.otp_dispatch?.otp_code_preview || null);
      if (data.otp_dispatch?.otp_code_preview) {
        setOtpInput(data.otp_dispatch.otp_code_preview);
      }
      setAuthStep('VERIFY_EMAIL_OTP');
      setAuthNotice(data.message);
    } catch {
      setAuthError('Erro ao processar definição de senha e envio de código.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/auth/verify-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nid: nidInput.trim(),
          email: emailInput.trim(),
          code: otpInput.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Código de verificação inválido.');
        return;
      }

      if (data.verified && data.user) {
        const normalizedUser: AuthUserProfile = {
          ...data.user,
          avatarUrl: data.user.avatarUrl || data.user.avatar_url || null
        };
        setInitialPasswordDisabled(true);
        setUser(normalizedUser);
        setSsoToken(data.sso_token || null);
        syncFormStateFromUser(normalizedUser);
        setLoginModalOpen(false);
        setAuthStep('LOGIN');
        if (onUserAuthenticated) {
          onUserAuthenticated(normalizedUser.nid, normalizedUser, data.sso_token);
        }
      }
    } catch {
      setAuthError('Falha ao validar o código de 6 dígitos.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setAuthError(null);
    try {
      const res = await fetch('/api/v1/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nid: nidInput.trim(),
          email: emailInput.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Erro ao reenviar código.');
        return;
      }
      setDispatchedOtpPreview(data.otp_dispatch?.otp_code_preview || null);
      if (data.otp_dispatch?.otp_code_preview) {
        setOtpInput(data.otp_dispatch.otp_code_preview);
      }
      setAuthNotice('Novo código de 6 dígitos gerado e enviado com sucesso!');
    } catch {
      setAuthError('Falha ao reenviar código.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileStatusMsg(null);
    setProfileErrorMsg(null);
    setSavingProfile(true);
    try {
      const payload: Record<string, unknown> = {
        nid: user.nid,
        social_name: editSocialName.trim(),
        email: editEmail.trim(),
        phone_number: editPhone.trim(),
        district: editDistrict.trim(),
        native_language: editNativeLang,
        bio: editBio.trim()
      };
      if (pendingAvatarUrl !== null) {
        payload.avatar_url = pendingAvatarUrl;
      }

      const res = await fetch('/api/v1/profile/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.user) {
        const updatedUser: AuthUserProfile = {
          ...data.user,
          avatarUrl: data.user.avatarUrl || data.user.avatar_url || pendingAvatarUrl || null
        };
        setUser(updatedUser);
        handleSelectLanguage(editNativeLang, true);
        syncFormStateFromUser(updatedUser);
        setProfileStatusMsg('Perfil, idioma e foto oficial gravados com sucesso no banco de dados (AlloyDB + GDF)!');
        if (onUserAuthenticated) {
          onUserAuthenticated(updatedUser.nid, updatedUser, ssoToken || undefined);
        }
      } else {
        setProfileErrorMsg(data.error || 'Não foi possível salvar as alterações do perfil.');
      }
    } catch {
      setProfileErrorMsg('Erro de comunicação ao salvar os dados do perfil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setProfileStatusMsg(null);
    setProfileErrorMsg(null);

    const allowed = ['image/webp', 'image/png', 'image/jpeg', 'image/jpg'];
    if (file.type && !allowed.includes(file.type.toLowerCase())) {
      setProfileErrorMsg('Formato inválido: selecione uma imagem WEBP, PNG ou JPG.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const { dataUrl, mimeType } = await compressImageFileToDataUrl(file);
      setPendingAvatarUrl(dataUrl);

      const res = await fetch('/api/v1/profile/me/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nid: user.nid,
          avatar_url: dataUrl,
          mime_type: mimeType
        })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        const updatedUser: AuthUserProfile = {
          ...data.user,
          avatarUrl: data.user.avatarUrl || data.user.avatar_url || dataUrl
        };
        setUser(updatedUser);
        setPendingAvatarUrl(updatedUser.avatarUrl);
        setProfileStatusMsg('Foto de perfil salva no banco de dados (AlloyDB) e atualizada com sucesso!');
        if (onUserAuthenticated) {
          onUserAuthenticated(updatedUser.nid, updatedUser, ssoToken || undefined);
        }
      } else {
        setProfileErrorMsg(data.error || 'Erro ao armazenar a foto de perfil no banco de dados.');
      }
    } catch {
      setProfileErrorMsg('Falha ao processar e armazenar a foto de perfil.');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileStatusMsg(null);
    setProfileErrorMsg(null);

    if (newPasswordForChange !== confirmNewPasswordForChange) {
      setProfileErrorMsg('A confirmação da nova senha não coincide.');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch('/api/v1/profile/me/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nid: user.nid,
          current_password: currentPasswordForChange,
          new_password: newPasswordForChange
        })
      });
      const data = await res.json();
      if (res.ok && data.updated) {
        setInitialPasswordDisabled(true);
        setCurrentPasswordForChange('');
        setNewPasswordForChange('');
        setConfirmNewPasswordForChange('');
        setProfileStatusMsg(data.message || 'Senha de acesso atualizada com sucesso no AlloyDB! A senha inicial foi desativada.');
      } else {
        setProfileErrorMsg(data.error || 'Não foi possível alterar a senha.');
      }
    } catch {
      setProfileErrorMsg('Erro de comunicação ao atualizar a senha.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    setProfileHamburgerOpen(false);
    setProfileModalOpen(false);
    await fetch('/api/v1/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    setUser(null);
    setSsoToken(null);
    setPasswordInput('');
    if (onUserLoggedOut) {
      onUserLoggedOut();
    }
  };

  const selectProfileSection = (section: ProfileSection) => {
    setActiveProfileSection(section);
    setProfileStatusMsg(null);
    setProfileErrorMsg(null);
    if (!profileModalOpen) {
      setProfileHamburgerOpen(true);
    }
    setProfileModalOpen(true);
    if (section === 'FAMILY_READONLY' && user) {
      loadFamilyData(user.nid);
    }
  };

  const buildPortalUrlWithSso = (baseUrl: string, extraParams?: Record<string, string>) => {
    const params = new URLSearchParams();
    if (ssoToken) params.set('sso_token', ssoToken);
    if (activeLang) params.set('lang', activeLang);
    if (extraParams) {
      Object.entries(extraParams).forEach(([k, v]) => params.set(k, v));
    }
    const qs = params.toString();
    if (!qs) return baseUrl;
    const sep = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${sep}${qs}`;
  };

  const displayedAvatar = pendingAvatarUrl || user?.avatarUrl || user?.avatar_url || '/assets/pm_portrait.jpg';

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
      {/* SELETOR GLOBAL DE IDIOMAS (PT-BR / ES-419 / EN-US) PRESENTE EM 100% DAS PÁGINAS */}
      <Paper
        variant="outlined"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: 0.75,
          py: 0.35,
          borderRadius: 999,
          borderColor: '#cbd5e1',
          bgcolor: '#ffffff'
        }}
      >
        <LanguageIcon sx={{ fontSize: 16, color: '#0a2240', ml: 0.5, mr: 0.25 }} />
        <ButtonGroup variant="text" size="small" aria-label="Seletor de Idioma da República de Novatlantis">
          {(
            [
              { code: 'pt-BR', short: 'PT', title: 'Português (pt-BR)' },
              { code: 'es-419', short: 'ES', title: 'Español (es-419)' },
              { code: 'en-US', short: 'EN', title: 'English (en-US)' }
            ] as { code: SupportedLanguage; short: string; title: string }[]
          ).map((item) => {
            const isSelected = activeLang === item.code;
            return (
              <Tooltip key={item.code} title={item.title} arrow>
                <Button
                  onClick={() => handleSelectLanguage(item.code, true)}
                  sx={{
                    minWidth: 34,
                    px: 1,
                    py: 0.25,
                    fontSize: '0.74rem',
                    fontWeight: isSelected ? 800 : 600,
                    borderRadius: '999px !important',
                    border: 'none !important',
                    bgcolor: isSelected ? '#0a2240' : 'transparent',
                    color: isSelected ? '#ffffff' : '#334155',
                    '&:hover': {
                      bgcolor: isSelected ? '#163a66' : '#f1f5f9'
                    }
                  }}
                >
                  {item.short}
                </Button>
              </Tooltip>
            );
          })}
        </ButtonGroup>
      </Paper>

      {loadingSession ? (
        <Box sx={{ px: 2, py: 0.75, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={15} sx={{ color: '#0a2240' }} />
          <Typography variant="caption" sx={{ color: '#475569', fontWeight: 500 }}>
            {t.checking}
          </Typography>
        </Box>
      ) : !user ? (
        <Button
          variant="outlined"
          size="medium"
          startIcon={<ShieldIcon sx={{ fontSize: 18 }} />}
          onClick={() => {
            setAuthStep('LOGIN');
            setAuthError(null);
            setAuthNotice(null);
            setLoginModalOpen(true);
          }}
          sx={{
            px: 2.25,
            py: 0.85,
            fontWeight: 700,
            fontSize: '0.88rem',
            borderRadius: 999,
            textTransform: 'none',
            color: '#0a2240',
            borderColor: '#cbd5e1',
            bgcolor: '#ffffff',
            '&:hover': {
              borderColor: '#0a2240',
              bgcolor: '#f8fafc'
            }
          }}
        >
          {t.signInWithNid}
        </Button>
      ) : (
        <Paper
          variant="outlined"
          onClick={() => {
            setProfileHamburgerOpen(true);
            selectProfileSection('PERSONAL_DATA');
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            pl: 1,
            pr: 1.75,
            py: 0.6,
            borderRadius: 999,
            cursor: 'pointer',
            borderColor: '#cbd5e1',
            bgcolor: '#ffffff',
            transition: 'all 0.15s ease',
            '&:hover': {
              borderColor: '#0a2240',
              bgcolor: '#f8fafc'
            }
          }}
        >
          <Avatar
            src={displayedAvatar}
            alt={user.name}
            sx={{
              width: 34,
              height: 34,
              border: '1.5px solid #0a2240',
              bgcolor: '#0a2240',
              fontSize: '0.85rem',
              fontWeight: 700
            }}
          >
            {user.name.charAt(0)}
          </Avatar>
          <Box sx={{ textAlign: 'left' }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.15, fontSize: '0.84rem' }}
            >
              {user.name}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontFamily: 'monospace',
                color: '#64748b',
                display: 'block',
                fontSize: '0.7rem'
              }}
            >
              {user.nid}
            </Typography>
          </Box>
          <MenuIcon sx={{ color: '#0a2240', fontSize: 20, ml: 0.5 }} />
        </Paper>
      )}

      {/* MODAL 1: AUTENTICAÇÃO SOBERANA (NID / SENHA / 1º ACESSO OTP) */}
      <Dialog
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 50px rgba(10, 34, 64, 0.14)'
          }
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2.25,
            bgcolor: '#0a2240',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ShieldIcon sx={{ color: '#93c5fd' }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {t.authTitle}
              </Typography>
              <Typography variant="caption" sx={{ color: '#cbd5e1', display: 'block' }}>
                {t.authSubtitle}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setLoginModalOpen(false)} sx={{ color: '#cbd5e1' }} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          {authError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {authError}
            </Alert>
          )}

          {authNotice && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              {authNotice}
            </Alert>
          )}

          {authStep === 'LOGIN' && (
            <Box component="form" onSubmit={handleLoginSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label={t.nidOrEmailLabel}
                value={nidInput}
                onChange={(e) => setNidInput(e.target.value)}
                placeholder="Ex: NID-000-0000-0001-9 ou jt@novatlantis.gov.cloud"
                fullWidth
                required
                size="medium"
                InputProps={{ sx: { fontFamily: 'monospace' } }}
              />

              <TextField
                label={t.passwordLabel}
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Digite sua senha (ex: Novatlantis@0001-9)"
                fullWidth
                required
                size="medium"
              />

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<KeyIcon />}
                  disabled={initialPasswordDisabled}
                  onClick={() => lookupPostalInitialPassword(nidInput)}
                  sx={{ textTransform: 'none' }}
                >
                  {t.fillInitialPassword}
                </Button>
                {initialPasswordDisabled && (
                  <Chip
                    size="small"
                    color="default"
                    label={
                      activeLang === 'es-419'
                        ? 'Contraseña inicial desactivada (1ra contraseña creada)'
                        : activeLang === 'en-US'
                        ? 'Initial password disabled (1st password created)'
                        : 'Senha inicial desativada (1ª senha já criada)'
                    }
                    sx={{ fontSize: '0.72rem', fontWeight: 700, bgcolor: '#fee2e2', color: '#991b1b' }}
                  />
                )}
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  startIcon={<RefreshIcon />}
                  onClick={() => resetCitizenToFirstLogin(nidInput)}
                  sx={{ textTransform: 'none' }}
                >
                  {t.simulateFirstLogin}
                </Button>
              </Box>

              <Paper variant="outlined" sx={{ p: 1.75, bgcolor: '#f8fafc', borderRadius: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 1 }}>
                  {t.quickTestTitle}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                  {[
                    { nid: 'NID-000-0000-0001-9', label: 'Primeiro-Ministro (Joao Thiago Poço - JT)' },
                    { nid: 'NID-000-0000-0002-7', label: 'Secretário-Geral (Dr. Aurelius)' },
                    { nid: 'NID-000-0000-0004-3', label: 'Médica (Dra. Sofia)' },
                    { nid: 'NID-000-0000-0010-8', label: 'Cidadão/Estudante (Pedro)' }
                  ].map((preset) => (
                    <Chip
                      key={preset.nid}
                      label={preset.label}
                      size="small"
                      onClick={() => {
                        setNidInput(preset.nid);
                        lookupPostalInitialPassword(preset.nid);
                      }}
                      sx={{ cursor: 'pointer', fontWeight: 600 }}
                    />
                  ))}
                </Box>
              </Paper>

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={submitting}
                fullWidth
                sx={{
                  py: 1.35,
                  bgcolor: '#0a2240',
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: 2,
                  '&:hover': { bgcolor: '#163a66' }
                }}
              >
                {submitting ? t.authenticating : t.signInContinue}
              </Button>
            </Box>
          )}

          {authStep === 'FIRST_LOGIN_SETUP' && (
            <Box
              component="form"
              onSubmit={handleFirstLoginSetupSubmit}
              sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <Alert severity="warning">
                <strong>Primeiro Acesso ({nidInput}):</strong> Defina sua senha definitiva (mínimo 8 caracteres, letras
                e números) e informe seu e-mail para receber o código OTP de 6 dígitos.
              </Alert>

              <TextField
                label="Nova Senha Definitiva"
                type="password"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="Ex: NovaSenha#2026"
                fullWidth
                required
                size="small"
              />
              <TextField
                label="Confirmar Nova Senha"
                type="password"
                value={confirmPasswordInput}
                onChange={(e) => setConfirmPasswordInput(e.target.value)}
                placeholder="Repita a nova senha"
                fullWidth
                required
                size="small"
              />
              <TextField
                label="E-mail Pessoal para Recebimento do Código OTP"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="cidadao@email.com"
                fullWidth
                required
                size="small"
              />

              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button variant="outlined" onClick={() => setAuthStep('LOGIN')} sx={{ textTransform: 'none' }}>
                  Voltar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={submitting}
                  sx={{ bgcolor: '#0a2240', textTransform: 'none', fontWeight: 700 }}
                >
                  {submitting ? 'Gerando Código...' : 'Salvar Senha e Enviar Código OTP'}
                </Button>
              </Box>
            </Box>
          )}

          {authStep === 'VERIFY_EMAIL_OTP' && (
            <Box
              component="form"
              onSubmit={handleVerifyOtpSubmit}
              sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <Alert severity="success" icon={<EmailIcon />}>
                Código numérico de 6 dígitos enviado para <strong>{emailInput}</strong>.
                {dispatchedOtpPreview && (
                  <Box sx={{ mt: 1, p: 1, bgcolor: '#fff', borderRadius: 1, border: '1px solid #86efac' }}>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                      CÓDIGO OTP:{' '}
                      <span style={{ fontSize: '1.1rem', letterSpacing: '0.18em' }}>{dispatchedOtpPreview}</span>
                    </Typography>
                  </Box>
                )}
              </Alert>

              <TextField
                label="Código de Verificação (6 Dígitos)"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                fullWidth
                required
                inputProps={{
                  maxLength: 6,
                  style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.35em', fontFamily: 'monospace' }
                }}
              />

              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button variant="outlined" onClick={handleResendOtp} sx={{ textTransform: 'none' }}>
                  Reenviar Código
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="success"
                  fullWidth
                  disabled={submitting || otpInput.length !== 6}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  {submitting ? 'Validando...' : 'Confirmar Código e Ativar Conta'}
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* PÁGINA INTEIRA DO PERFIL DO CIDADÃO COM NAVIGATION DRAWER (SIDEBAR PERSISTENTE) ESTILO GOOGLE MATERIAL DESIGN */}
      <Dialog
        open={profileModalOpen}
        fullScreen
        onClose={() => {
          setProfileModalOpen(false);
        }}
        PaperProps={{
          sx: {
            bgcolor: '#fcfbf9',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }
        }}
      >
        {user && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
            {/* Top AppBar da Página Inteira do Perfil (Estilo Google Material Design) */}
            <Box
              sx={{
                px: { xs: 2, md: 3 },
                py: 1.5,
                bgcolor: '#0a2240',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.14)',
                flexShrink: 0
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <IconButton
                  onClick={() => setProfileHamburgerOpen((prev) => !prev)}
                  sx={{
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.35)',
                    borderRadius: 2,
                    p: 0.85,
                    bgcolor: profileHamburgerOpen ? 'rgba(255,255,255,0.16)' : 'transparent',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.24)' }
                  }}
                  aria-label="Alternar Navigation Drawer do Perfil"
                >
                  {profileHamburgerOpen ? <MenuOpenIcon /> : <MenuIcon />}
                </IconButton>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                    {t.profileTitle} •{' '}
                    {activeProfileSection === 'PERSONAL_DATA'
                      ? t.secPersonal
                      : activeProfileSection === 'PASSWORD_SECURITY'
                      ? t.secPassword
                      : activeProfileSection === 'FAMILY_READONLY'
                      ? t.secFamily
                      : t.secIdentity360}
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#cbd5e1' }}>
                    {user.full_name} ({user.nid}) • Papel: {user.role}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CloseIcon />}
                  onClick={() => setProfileModalOpen(false)}
                  sx={{
                    color: '#ffffff',
                    borderColor: 'rgba(255,255,255,0.45)',
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: 2,
                    px: 2,
                    '&:hover': { borderColor: '#ffffff', bgcolor: 'rgba(255,255,255,0.12)' }
                  }}
                >
                  {t.closeMenuBtn}
                </Button>
              </Box>
            </Box>

            {/* Layout Flex Lado a Lado: Navigation Drawer (Sidebar Persistente) à Esquerda + Página Inteira à Direita */}
            <Box sx={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              {/* Navigation Drawer Persistente (Sidebar Google Material Design — Empurra o conteúdo sem overlay) */}
              <Box
                component="aside"
                sx={{
                  width: profileHamburgerOpen ? { xs: 280, sm: 320, md: 340 } : 0,
                  flexShrink: 0,
                  bgcolor: '#ffffff',
                  borderRight: profileHamburgerOpen ? '1px solid #cbd5e1' : 'none',
                  transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                  overflowY: profileHamburgerOpen ? 'auto' : 'hidden',
                  overflowX: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <Box sx={{ p: 2.25, minWidth: 280 }}>
                  {/* Resumo do Cidadão na Sidebar */}
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.75,
                      mb: 2,
                      borderRadius: 2.5,
                      bgcolor: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5
                    }}
                  >
                    <Avatar
                      src={displayedAvatar}
                      alt={user.name}
                      sx={{ width: 46, height: 46, border: '2px solid #0a2240' }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#0a2240' }} noWrap>
                        {user.full_name}
                      </Typography>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#475569', display: 'block' }} noWrap>
                        {user.nid}
                      </Typography>
                    </Box>
                  </Paper>

                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 800, color: '#64748b', letterSpacing: '0.06em', px: 1, display: 'block', mb: 1 }}
                  >
                    SEÇÕES DO PERFIL SOBERANO (☰)
                  </Typography>

                  <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    <ListItemButton
                      selected={activeProfileSection === 'PERSONAL_DATA'}
                      onClick={() => selectProfileSection('PERSONAL_DATA')}
                      sx={{
                        borderRadius: 2,
                        py: 1.25,
                        bgcolor: activeProfileSection === 'PERSONAL_DATA' ? '#e2e8f0' : 'transparent',
                        '&.Mui-selected': { bgcolor: '#e2e8f0', borderLeft: '4px solid #0a2240' }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <PersonIcon sx={{ color: '#0a2240' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={`1. ${t.secPersonal}`}
                        secondary="Foto oficial, nome social, idioma, e-mail e endereço"
                        primaryTypographyProps={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}
                        secondaryTypographyProps={{ fontSize: '0.74rem' }}
                      />
                    </ListItemButton>

                    <ListItemButton
                      selected={activeProfileSection === 'PASSWORD_SECURITY'}
                      onClick={() => selectProfileSection('PASSWORD_SECURITY')}
                      sx={{
                        borderRadius: 2,
                        py: 1.25,
                        bgcolor: activeProfileSection === 'PASSWORD_SECURITY' ? '#e2e8f0' : 'transparent',
                        '&.Mui-selected': { bgcolor: '#e2e8f0', borderLeft: '4px solid #0a2240' }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <KeyIcon sx={{ color: '#0a2240' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={`2. ${t.secPassword}`}
                        secondary="Alterar senha soberana no AlloyDB"
                        primaryTypographyProps={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}
                        secondaryTypographyProps={{ fontSize: '0.74rem' }}
                      />
                    </ListItemButton>

                    <ListItemButton
                      selected={activeProfileSection === 'FAMILY_READONLY'}
                      onClick={() => selectProfileSection('FAMILY_READONLY')}
                      sx={{
                        borderRadius: 2,
                        py: 1.25,
                        bgcolor: activeProfileSection === 'FAMILY_READONLY' ? '#e2e8f0' : 'transparent',
                        '&.Mui-selected': { bgcolor: '#e2e8f0', borderLeft: '4px solid #0a2240' }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <GroupIcon sx={{ color: '#0a2240' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={`3. ${t.secFamily}`}
                        secondary="Árvore familiar Read-Only no GDF"
                        primaryTypographyProps={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}
                        secondaryTypographyProps={{ fontSize: '0.74rem' }}
                      />
                    </ListItemButton>

                    <ListItemButton
                      selected={activeProfileSection === 'SECURITY_ACCESS'}
                      onClick={() => selectProfileSection('SECURITY_ACCESS')}
                      sx={{
                        borderRadius: 2,
                        py: 1.25,
                        bgcolor: activeProfileSection === 'SECURITY_ACCESS' ? '#e2e8f0' : 'transparent',
                        '&.Mui-selected': { bgcolor: '#e2e8f0', borderLeft: '4px solid #0a2240' }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <ShieldIcon sx={{ color: '#0a2240' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={`4. ${t.secIdentity360}`}
                        secondary="Papel RBAC, SSO e alternar conta"
                        primaryTypographyProps={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}
                        secondaryTypographyProps={{ fontSize: '0.74rem' }}
                      />
                    </ListItemButton>
                  </List>

                  <Divider sx={{ my: 2 }} />

                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 800, color: '#64748b', letterSpacing: '0.06em', px: 1, display: 'block', mb: 1 }}
                  >
                    ATALHOS DE MÓDULOS (SSO)
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<LaunchIcon />}
                      component="a"
                      href={buildPortalUrlWithSso(citizenPortalUrl)}
                      sx={{ justifyContent: 'flex-start', textTransform: 'none', fontWeight: 700 }}
                    >
                      {t.openCitizenPortal}
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<LaunchIcon />}
                      component="a"
                      href={buildPortalUrlWithSso(citizenPortalUrl, { tab: 'urban_311' })}
                      sx={{ justifyContent: 'flex-start', textTransform: 'none', fontWeight: 600 }}
                    >
                      Módulo Zeladoria Urbana 311
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<LaunchIcon />}
                      component="a"
                      href={buildPortalUrlWithSso(citizenPortalUrl, { tab: 'emergency_911' })}
                      sx={{ justifyContent: 'flex-start', textTransform: 'none', fontWeight: 600 }}
                    >
                      Módulo Emergência 911 (SOS)
                    </Button>
                    {user.role !== 'CITIZEN_COMMON' && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="secondary"
                        startIcon={<AdminIcon />}
                        component="a"
                        href={buildPortalUrlWithSso(govBackstageUrl)}
                        sx={{ justifyContent: 'flex-start', textTransform: 'none', fontWeight: 700 }}
                      >
                        {t.openBackstage}
                      </Button>
                    )}
                  </Box>
                </Box>

                <Box sx={{ p: 2.25, borderTop: '1px solid #e2e8f0', minWidth: 280 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    startIcon={<LogoutIcon />}
                    onClick={handleLogout}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    {t.logoutBtn}
                  </Button>
                </Box>
              </Box>

              {/* Área Principal da Página Inteira do Perfil */}
              <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2.5, md: 5 }, bgcolor: '#fcfbf9' }}>
                <Box sx={{ maxWidth: 980, mx: 'auto' }}>
              {profileStatusMsg && (
                <Alert
                  severity="success"
                  onClose={() => setProfileStatusMsg(null)}
                  sx={{ mb: 2.5, borderRadius: 2, fontWeight: 600 }}
                >
                  {profileStatusMsg}
                </Alert>
              )}

              {profileErrorMsg && (
                <Alert
                  severity="error"
                  onClose={() => setProfileErrorMsg(null)}
                  sx={{ mb: 2.5, borderRadius: 2, fontWeight: 600 }}
                >
                  {profileErrorMsg}
                </Alert>
              )}

              {/* SEÇÃO 1: DADOS CADASTRAIS & FOTO */}
              {activeProfileSection === 'PERSONAL_DATA' && (
                <Box>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      mb: 3,
                      borderRadius: 2.5,
                      bgcolor: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2.5,
                      flexWrap: 'wrap'
                    }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <Avatar
                        src={displayedAvatar}
                        alt={user.name}
                        sx={{
                          width: 84,
                          height: 84,
                          border: '2.5px solid #0a2240',
                          boxShadow: '0 4px 14px rgba(10,34,64,0.15)'
                        }}
                      />
                      {uploadingAvatar && (
                        <Box
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            bgcolor: 'rgba(255,255,255,0.75)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <CircularProgress size={26} />
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        {user.full_name}
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#475569', mb: 1.25 }}>
                        {user.nid} • {user.email} • Distrito: {user.district}
                      </Typography>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/webp,image/png,image/jpeg,image/jpg"
                        onChange={handleAvatarFileChange}
                        style={{ display: 'none' }}
                      />

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="contained"
                          disabled={uploadingAvatar}
                          startIcon={<PhotoCameraIcon />}
                          onClick={() => fileInputRef.current?.click()}
                          sx={{
                            bgcolor: '#0a2240',
                            textTransform: 'none',
                            fontWeight: 700,
                            '&:hover': { bgcolor: '#163a66' }
                          }}
                        >
                          {uploadingAvatar ? t.savingPhoto : t.chooseSavePhoto}
                        </Button>

                        {pendingAvatarUrl && pendingAvatarUrl !== '/assets/pm_portrait.jpg' && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="inherit"
                            startIcon={<DeleteOutlineIcon />}
                            onClick={async () => {
                              const defaultAvatar = '/assets/pm_portrait.jpg';
                              setPendingAvatarUrl(defaultAvatar);
                              const res = await fetch('/api/v1/profile/me/avatar', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({
                                  nid: user.nid,
                                  avatar_url: defaultAvatar,
                                  mime_type: 'image/jpeg'
                                })
                              });
                              const data = await res.json();
                              if (res.ok && data.user) {
                                setUser(data.user);
                                setProfileStatusMsg('Foto restaurada para o retrato oficial padrão.');
                                if (onUserAuthenticated) {
                                  onUserAuthenticated(data.user.nid, data.user, ssoToken || undefined);
                                }
                              }
                            }}
                            sx={{ textTransform: 'none' }}
                          >
                            {t.restoreDefaultPhoto}
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Paper>

                  <Box
                    component="form"
                    onSubmit={handleSaveProfile}
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                  >
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                      <TextField
                        label={t.socialNameLabel}
                        value={editSocialName}
                        onChange={(e) => setEditSocialName(e.target.value)}
                        fullWidth
                        size="medium"
                      />
                      <TextField
                        label={t.emailLabel}
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        fullWidth
                        size="medium"
                      />
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
                      <TextField
                        label={t.phoneLabel}
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="+55 11 99999-0000"
                        fullWidth
                        size="medium"
                      />
                      <TextField
                        label={t.districtLabel}
                        value={editDistrict}
                        onChange={(e) => setEditDistrict(e.target.value)}
                        fullWidth
                        size="medium"
                      />
                      <TextField
                        select
                        label={t.nativeLangLabel}
                        value={editNativeLang}
                        onChange={(e) => {
                          const newL = e.target.value as SupportedLanguage;
                          setEditNativeLang(newL);
                          handleSelectLanguage(newL, true);
                        }}
                        fullWidth
                        size="medium"
                      >
                        <MenuItem value="pt-BR">Português (pt-BR)</MenuItem>
                        <MenuItem value="es-419">Español (es-419)</MenuItem>
                        <MenuItem value="en-US">English (en-US)</MenuItem>
                      </TextField>
                    </Box>

                    <TextField
                      label={t.bioLabel}
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      multiline
                      rows={2}
                      fullWidth
                      size="medium"
                    />

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 1.5,
                        pt: 1
                      }}
                    >
                      <Button
                        type="button"
                        variant="outlined"
                        startIcon={profileHamburgerOpen ? <MenuOpenIcon /> : <MenuIcon />}
                        onClick={() => setProfileHamburgerOpen((prev) => !prev)}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          borderColor: '#0a2240',
                          color: '#0a2240'
                        }}
                      >
                        {profileHamburgerOpen ? t.hideProfileOptions : t.moreProfileOptions}
                      </Button>

                      <Button
                        type="submit"
                        variant="contained"
                        disabled={savingProfile}
                        startIcon={<SaveIcon />}
                        sx={{
                          bgcolor: '#0a2240',
                          textTransform: 'none',
                          fontWeight: 700,
                          px: 3,
                          '&:hover': { bgcolor: '#163a66' }
                        }}
                      >
                        {savingProfile ? t.savingProfileBtn : t.saveProfileBtn}
                      </Button>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* SEÇÃO 2: SEGURANÇA & ALTERAÇÃO DE SENHA */}
              {activeProfileSection === 'PASSWORD_SECURITY' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Alert severity="info" icon={<KeyIcon />} sx={{ borderRadius: 2 }}>
                    <strong>Segurança Criptográfica Soberana:</strong> Altere sua senha de acesso ao ecossistema
                    Novatlantis. A nova credencial é sincronizada com hash seguro no banco de dados AlloyDB.
                  </Alert>

                  <Paper
                    component="form"
                    onSubmit={handleChangePasswordSubmit}
                    variant="outlined"
                    sx={{ p: 3, borderRadius: 2.5, bgcolor: '#ffffff', display: 'flex', flexDirection: 'column', gap: 2 }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0a2240' }}>
                      Alterar Senha de Acesso ({user.nid})
                    </Typography>

                    <TextField
                      label="Senha Atual (Opcional se já autenticado na sessão)"
                      type="password"
                      value={currentPasswordForChange}
                      onChange={(e) => setCurrentPasswordForChange(e.target.value)}
                      fullWidth
                      size="medium"
                    />

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                      <TextField
                        label="Nova Senha (mínimo 8 caracteres, letras e números)"
                        type="password"
                        value={newPasswordForChange}
                        onChange={(e) => setNewPasswordForChange(e.target.value)}
                        required
                        fullWidth
                        size="medium"
                      />
                      <TextField
                        label="Confirmar Nova Senha"
                        type="password"
                        value={confirmNewPasswordForChange}
                        onChange={(e) => setConfirmNewPasswordForChange(e.target.value)}
                        required
                        fullWidth
                        size="medium"
                      />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1 }}>
                      <Button
                        type="button"
                        variant="outlined"
                        startIcon={<PersonIcon />}
                        onClick={() => selectProfileSection('PERSONAL_DATA')}
                        sx={{ textTransform: 'none' }}
                      >
                        Voltar para Dados Cadastrais
                      </Button>

                      <Button
                        type="submit"
                        variant="contained"
                        disabled={changingPassword}
                        startIcon={<SaveIcon />}
                        sx={{ bgcolor: '#0a2240', textTransform: 'none', fontWeight: 700 }}
                      >
                        {changingPassword ? 'Atualizando Senha...' : 'Confirmar Nova Senha no AlloyDB'}
                      </Button>
                    </Box>
                  </Paper>
                </Box>
              )}

              {/* SEÇÃO 3: NÚCLEO FAMILIAR (SOMENTE LEITURA) */}
              {activeProfileSection === 'FAMILY_READONLY' && (
                <Box>
                  <Alert severity="info" icon={<VisibilityIcon />} sx={{ mb: 2.5, borderRadius: 2 }}>
                    <strong>Registro Civil Soberano (Somente Leitura):</strong> Os vínculos familiares são mantidos pelo
                    AlloyDB Central e protegidos contra edição direta pelo usuário (HTTP 403 em mutações).
                  </Alert>

                  {loadingFamily ? (
                    <Box sx={{ py: 5, textAlign: 'center' }}>
                      <CircularProgress size={28} />
                    </Box>
                  ) : familyMembers.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                      Nenhum vínculo familiar direto registrado para este NID.
                    </Typography>
                  ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 2.5 }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>NID Familiar</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Nome Completo</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Parentesco</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Idade</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Governança</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {familyMembers.map((fm) => (
                            <TableRow key={fm.relation_id} hover>
                              <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#0a2240' }}>
                                {fm.relative_nid}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>{fm.relative_name}</TableCell>
                              <TableCell>
                                <Chip label={fm.relation_type} size="small" variant="outlined" />
                              </TableCell>
                              <TableCell>{fm.relative_age} anos</TableCell>
                              <TableCell>
                                <Chip
                                  icon={<LockIcon sx={{ fontSize: '12px !important' }} />}
                                  label="Somente Leitura"
                                  size="small"
                                  sx={{ fontSize: '0.7rem' }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<PersonIcon />}
                      onClick={() => selectProfileSection('PERSONAL_DATA')}
                      sx={{ textTransform: 'none' }}
                    >
                      Voltar para Dados Cadastrais
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<MenuIcon />}
                      onClick={() => setProfileHamburgerOpen(true)}
                      sx={{ textTransform: 'none' }}
                    >
                      {t.moreProfileOptions}
                    </Button>
                  </Box>
                </Box>
              )}

              {/* SEÇÃO 4: SEGURANÇA, PAPEL IDENTIDADE 360 & SESSÃO */}
              {activeProfileSection === 'SECURITY_ACCESS' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: '#ffffff' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0a2240', mb: 1.5 }}>
                      CREDENCIAL SOBERANA & PAPEL ATIVO NA IDENTIDADE 360
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.75 }}>
                      • <strong>NID Soberano:</strong> <code>{user.nid}</code>
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.75 }}>
                      • <strong>Papel RBAC Governamental:</strong> <code>{user.role}</code>
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.75 }}>
                      • <strong>Profissão / Especialidade:</strong> {user.profession}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1.5 }}>
                      • <strong>Status da Conta no AlloyDB:</strong>{' '}
                      <Chip size="small" color="success" label={user.status} icon={<CheckCircleIcon />} />
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />

                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 1 }}>
                      ACESSO RÁPIDO AOS AMBIENTES COM SINGLE SIGN-ON (SSO):
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap' }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<LaunchIcon />}
                        component="a"
                        href={buildPortalUrlWithSso(citizenPortalUrl)}
                        sx={{ bgcolor: '#0a2240', textTransform: 'none', fontWeight: 700 }}
                      >
                        {t.openCitizenPortal}
                      </Button>
                      {user.role !== 'CITIZEN_COMMON' && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<AdminIcon />}
                          component="a"
                          href={buildPortalUrlWithSso(govBackstageUrl)}
                          sx={{ textTransform: 'none', fontWeight: 700, borderColor: '#0a2240', color: '#0a2240' }}
                        >
                          {t.openBackstage} ({user.role})
                        </Button>
                      )}
                    </Box>
                  </Paper>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, pt: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<KeyIcon />}
                      onClick={() => {
                        setProfileHamburgerOpen(false);
                        setProfileModalOpen(false);
                        setNidInput('');
                        setPasswordInput('');
                        setAuthStep('LOGIN');
                        setLoginModalOpen(true);
                      }}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      {t.switchCitizenBtn}
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<LogoutIcon />}
                      onClick={handleLogout}
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                      {t.logoutBtn}
                    </Button>
                  </Box>
                </Box>
              )}
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </Dialog>
    </Box>
  );
};

export default TopNavUserWidget;
