import React, { useState, useEffect, useRef } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
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
  Launch as LaunchIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';

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
}

type ProfileSection = 'PERSONAL_DATA' | 'FAMILY_READONLY' | 'SECURITY_ACCESS';

export const TopNavUserWidget: React.FC<TopNavUserWidgetProps> = ({
  onUserAuthenticated,
  onUserLoggedOut,
  openLoginTrigger = 0,
  loginReasonMessage = null,
  citizenPortalUrl = 'https://novatlantis-citizen-portal-wpahcxvhuq-uc.a.run.app',
  govBackstageUrl = 'https://novatlantis-gov-backstage-wpahcxvhuq-uc.a.run.app'
}) => {
  const [user, setUser] = useState<AuthUserProfile | null>(null);
  const [ssoToken, setSsoToken] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Modals & Internal Hamburger Drawer State
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
  const [postalHintPassword, setPostalHintPassword] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Profile edit state
  const [editSocialName, setEditSocialName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBio, setEditBio] = useState('');
  const [profileStatusMsg, setProfileStatusMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Family Read-Only state
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberRecord[]>([]);
  const [loadingFamily, setLoadingFamily] = useState(false);

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
        setUser(data.user);
        setSsoToken(data.sso_token || null);
        setEditSocialName(data.user.social_name || data.user.full_name || '');
        setEditPhone(data.user.phone_number || '');
        setEditBio(data.user.bio || '');
        if (onUserAuthenticated) {
          onUserAuthenticated(data.user.nid, data.user, data.sso_token);
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
      const res = await fetch(`/api/v1/auth/postal-dispatch?nid=${encodeURIComponent(cleanTarget)}`);
      const data = await res.json();
      if (res.ok && data.initial_password) {
        setPostalHintPassword(data.initial_password);
        setPasswordInput(data.initial_password);
        setEmailInput(data.citizen?.email || '');
        setAuthNotice(
          `Credencial localizada no AlloyDB para ${data.citizen?.full_name || cleanTarget}: senha inicial ${data.initial_password}`
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
        setPasswordInput(data.initial_password || '');
        setPostalHintPassword(data.initial_password || null);
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
        setUser(data.user);
        setSsoToken(data.sso_token || null);
        setEditSocialName(data.user.social_name || data.user.full_name);
        setEditPhone(data.user.phone_number || '');
        setEditBio(data.user.bio || '');
        setLoginModalOpen(false);
        if (onUserAuthenticated) {
          onUserAuthenticated(data.user.nid, data.user, data.sso_token);
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
        setUser(data.user);
        setSsoToken(data.sso_token || null);
        setEditSocialName(data.user.social_name || data.user.full_name);
        setEditPhone(data.user.phone_number || '');
        setEditBio(data.user.bio || '');
        setLoginModalOpen(false);
        setAuthStep('LOGIN');
        if (onUserAuthenticated) {
          onUserAuthenticated(data.user.nid, data.user, data.sso_token);
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
    const res = await fetch('/api/v1/profile/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        nid: user.nid,
        social_name: editSocialName,
        phone_number: editPhone,
        bio: editBio
      })
    });
    const data = await res.json();
    if (res.ok && data.user) {
      setUser(data.user);
      setProfileStatusMsg('Dados cadastrais atualizados com sucesso no AlloyDB.');
      if (onUserAuthenticated) {
        onUserAuthenticated(data.user.nid, data.user, ssoToken || undefined);
      }
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowed = ['image/webp', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowed.includes(file.type.toLowerCase())) {
      setProfileStatusMsg('Erro: Apenas arquivos WEBP, PNG ou JPG são permitidos.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || '');
      const res = await fetch('/api/v1/profile/me/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nid: user.nid,
          avatar_url: dataUrl,
          mime_type: file.type
        })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        setProfileStatusMsg('Foto de perfil oficial validada e atualizada com sucesso!');
        if (onUserAuthenticated) {
          onUserAuthenticated(data.user.nid, data.user, ssoToken || undefined);
        }
      } else {
        setProfileStatusMsg(data.error || 'Erro ao enviar foto de perfil.');
      }
    };
    reader.readAsDataURL(file);
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

  const openProfileWithSection = (section: ProfileSection) => {
    setActiveProfileSection(section);
    setProfileStatusMsg(null);
    setProfileHamburgerOpen(false);
    setProfileModalOpen(true);
    if (section === 'FAMILY_READONLY' && user) {
      loadFamilyData(user.nid);
    }
  };

  const buildPortalUrlWithSso = (baseUrl: string) => {
    if (!ssoToken) return baseUrl;
    const sep = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${sep}sso_token=${encodeURIComponent(ssoToken)}`;
  };

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      {loadingSession ? (
        <Box sx={{ px: 2, py: 0.75, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={15} sx={{ color: '#0a2240' }} />
          <Typography variant="caption" sx={{ color: '#475569', fontWeight: 500 }}>
            Verificando...
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
          Entrar com NID
        </Button>
      ) : (
        <Paper
          variant="outlined"
          onClick={() => openProfileWithSection('PERSONAL_DATA')}
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
            src={user.avatarUrl || '/assets/pm_portrait.jpg'}
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
                Identidade Digital Soberana (NID)
              </Typography>
              <Typography variant="caption" sx={{ color: '#cbd5e1', display: 'block' }}>
                República de Novatlantis • Autenticação Unificada AlloyDB
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
                label="Identificador Nacional (NID) ou E-mail"
                value={nidInput}
                onChange={(e) => setNidInput(e.target.value)}
                placeholder="Ex: NID-000-0000-0001-9 ou admin@jopoco.altostrat.com"
                fullWidth
                required
                size="medium"
                InputProps={{ sx: { fontFamily: 'monospace' } }}
              />

              <TextField
                label="Senha de Acesso"
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Digite sua senha (ex: ATs32=34 ou senha postal)"
                fullWidth
                required
                size="medium"
              />

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<KeyIcon />}
                  onClick={() => lookupPostalInitialPassword(nidInput)}
                  sx={{ textTransform: 'none' }}
                >
                  Preencher Senha Inicial do NID
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  startIcon={<RefreshIcon />}
                  onClick={() => resetCitizenToFirstLogin(nidInput)}
                  sx={{ textTransform: 'none' }}
                >
                  Simular 1º Acesso (OTP)
                </Button>
              </Box>

              <Paper variant="outlined" sx={{ p: 1.75, bgcolor: '#f8fafc', borderRadius: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 1 }}>
                  CREDENCIAIS RÁPIDAS PARA TESTE (CLIQUE PARA PREENCHER):
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                  {[
                    { nid: 'NID-000-0000-0001-9', label: 'Primeiro-Ministro (jopoco)' },
                    { nid: 'NID-000-0000-0002-7', label: 'Secretária-Geral (Helena)' },
                    { nid: 'NID-000-0000-0004-3', label: 'Médica (Dra. Sofia)' },
                    { nid: 'NID-000-0000-0010-8', label: 'Cidadão/Estudante (Lucas)' }
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
                {submitting ? 'Autenticando no AlloyDB...' : 'Entrar e Continuar'}
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

      {/* MODAL 2: ÁREA INTERNA DO PERFIL DO CIDADÃO — NAVEGAÇÃO VIA MENU HAMBÚRGUER (☰) */}
      <Dialog
        open={profileModalOpen}
        onClose={() => {
          setProfileHamburgerOpen(false);
          setProfileModalOpen(false);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            minHeight: 500,
            position: 'relative',
            border: '1px solid #e2e8f0'
          }
        }}
      >
        {user && (
          <>
            {/* Top Bar da Área Interna do Perfil com Botão Hambúrguer (☰) */}
            <Box
              sx={{
                px: 2.5,
                py: 1.75,
                bgcolor: '#0a2240',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <IconButton
                  onClick={() => setProfileHamburgerOpen(true)}
                  sx={{
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: 1.5
                  }}
                  aria-label="Abrir Menu do Perfil"
                >
                  <MenuIcon />
                </IconButton>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                    Perfil Soberano do Cidadão •{' '}
                    {activeProfileSection === 'PERSONAL_DATA'
                      ? 'Dados Cadastrais & Foto'
                      : activeProfileSection === 'FAMILY_READONLY'
                      ? 'Núcleo Familiar (Somente Leitura)'
                      : 'Credenciais & Acesso Identidade 360'}
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#cbd5e1' }}>
                    {user.full_name} ({user.nid}) • Clique em ☰ para alternar seções do perfil
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={() => setProfileModalOpen(false)} sx={{ color: '#cbd5e1' }} size="small">
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Menu Hambúrguer Deslizante Interno do Perfil (Sem opções empilhadas lado a lado) */}
            <Drawer
              anchor="left"
              open={profileHamburgerOpen}
              onClose={() => setProfileHamburgerOpen(false)}
              PaperProps={{
                sx: {
                  width: 300,
                  bgcolor: '#ffffff',
                  borderRight: '1px solid #e2e8f0'
                }
              }}
            >
              <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0a2240', letterSpacing: '0.03em' }}>
                    MENU DO PERFIL (NID)
                  </Typography>
                  <IconButton size="small" onClick={() => setProfileHamburgerOpen(false)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    src={user.avatarUrl || '/assets/pm_portrait.jpg'}
                    sx={{ width: 44, height: 44, border: '2px solid #0a2240' }}
                  />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      {user.name}
                    </Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#475569' }}>
                      {user.nid}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <List sx={{ py: 1 }}>
                <ListItemButton
                  selected={activeProfileSection === 'PERSONAL_DATA'}
                  onClick={() => openProfileWithSection('PERSONAL_DATA')}
                >
                  <ListItemIcon>
                    <PersonIcon sx={{ color: '#0a2240' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Dados Cadastrais & Foto"
                    secondary="Nome social, foto ICAO e telefone"
                    primaryTypographyProps={{ fontWeight: 700, fontSize: '0.9rem' }}
                  />
                </ListItemButton>

                <ListItemButton
                  selected={activeProfileSection === 'FAMILY_READONLY'}
                  onClick={() => openProfileWithSection('FAMILY_READONLY')}
                >
                  <ListItemIcon>
                    <GroupIcon sx={{ color: '#0a2240' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Núcleo Familiar"
                    secondary="Vínculos civis (Somente Leitura)"
                    primaryTypographyProps={{ fontWeight: 700, fontSize: '0.9rem' }}
                  />
                </ListItemButton>

                <ListItemButton
                  selected={activeProfileSection === 'SECURITY_ACCESS'}
                  onClick={() => openProfileWithSection('SECURITY_ACCESS')}
                >
                  <ListItemIcon>
                    <ShieldIcon sx={{ color: '#0a2240' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Segurança & Identidade 360"
                    secondary="Papel RBAC, sessão e troca de conta"
                    primaryTypographyProps={{ fontWeight: 700, fontSize: '0.9rem' }}
                  />
                </ListItemButton>

                <Divider sx={{ my: 1.5 }} />

                <ListItemButton
                  component="a"
                  href={buildPortalUrlWithSso(citizenPortalUrl)}
                  onClick={() => setProfileHamburgerOpen(false)}
                >
                  <ListItemIcon>
                    <LaunchIcon sx={{ color: '#0369a1' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Abrir Portal do Cidadão"
                    secondary="Serviços digitais e prontuários"
                    primaryTypographyProps={{ fontWeight: 600, fontSize: '0.88rem' }}
                  />
                </ListItemButton>

                {user.role !== 'CITIZEN_COMMON' && (
                  <ListItemButton
                    component="a"
                    href={buildPortalUrlWithSso(govBackstageUrl)}
                    onClick={() => setProfileHamburgerOpen(false)}
                  >
                    <ListItemIcon>
                      <AdminIcon sx={{ color: '#0f766e' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Backstage Governamental"
                      secondary={`Acesso: ${user.role}`}
                      primaryTypographyProps={{ fontWeight: 600, fontSize: '0.88rem' }}
                    />
                  </ListItemButton>
                )}

                <Divider sx={{ my: 1.5 }} />

                <ListItemButton onClick={handleLogout} sx={{ color: '#b91c1c' }}>
                  <ListItemIcon>
                    <LogoutIcon sx={{ color: '#b91c1c' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Encerrar Sessão (Logout)"
                    secondary="Sair e limpar cookie de sessão"
                    primaryTypographyProps={{ fontWeight: 700, fontSize: '0.9rem' }}
                  />
                </ListItemButton>
              </List>
            </Drawer>

            <DialogContent sx={{ p: 3.5, bgcolor: '#fcfcfc' }}>
              {profileStatusMsg && (
                <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
                  {profileStatusMsg}
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
                    <Avatar
                      src={user.avatarUrl || '/assets/pm_portrait.jpg'}
                      alt={user.name}
                      sx={{ width: 76, height: 76, border: '2px solid #0a2240' }}
                    />
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
                        accept="image/webp,image/png,image/jpeg"
                        onChange={handleAvatarFileChange}
                        style={{ display: 'none' }}
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PhotoCameraIcon />}
                        onClick={() => fileInputRef.current?.click()}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        Atualizar Foto Oficial (WEBP / PNG / JPG)
                      </Button>
                    </Box>
                  </Paper>

                  <Box
                    component="form"
                    onSubmit={handleSaveProfile}
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}
                  >
                    <TextField
                      label="Nome de Exibição / Nome Social"
                      value={editSocialName}
                      onChange={(e) => setEditSocialName(e.target.value)}
                      fullWidth
                      size="medium"
                    />
                    <TextField
                      label="Telefone Soberano de Contato"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      fullWidth
                      size="medium"
                    />
                    <TextField
                      label="Observações Cadastrais"
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      multiline
                      rows={2}
                      fullWidth
                      size="medium"
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1 }}>
                      <Button
                        variant="outlined"
                        startIcon={<MenuIcon />}
                        onClick={() => setProfileHamburgerOpen(true)}
                        sx={{ textTransform: 'none' }}
                      >
                        Mais Opções do Perfil
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        sx={{ bgcolor: '#0a2240', textTransform: 'none', fontWeight: 700, px: 3 }}
                      >
                        Salvar Dados no AlloyDB
                      </Button>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* SEÇÃO 2: NÚCLEO FAMILIAR (SOMENTE LEITURA) */}
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
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
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
                </Box>
              )}

              {/* SEÇÃO 3: SEGURANÇA, PAPEL IDENTIDADE 360 & SESSÃO */}
              {activeProfileSection === 'SECURITY_ACCESS' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: '#ffffff' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0a2240', mb: 1 }}>
                      CREDENCIAL & PAPEL ATIVO NA IDENTIDADE 360
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
                    <Typography variant="body2">
                      • <strong>Status da Conta no AlloyDB:</strong>{' '}
                      <Chip size="small" color="success" label={user.status} icon={<CheckCircleIcon />} />
                    </Typography>
                  </Paper>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<KeyIcon />}
                      onClick={() => {
                        setProfileModalOpen(false);
                        setNidInput('');
                        setPasswordInput('');
                        setAuthStep('LOGIN');
                        setLoginModalOpen(true);
                      }}
                      sx={{ textTransform: 'none' }}
                    >
                      Alternar para Outro Cidadão (NID)
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<LogoutIcon />}
                      onClick={handleLogout}
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                      Encerrar Sessão Agora
                    </Button>
                  </Box>
                </Box>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default TopNavUserWidget;
