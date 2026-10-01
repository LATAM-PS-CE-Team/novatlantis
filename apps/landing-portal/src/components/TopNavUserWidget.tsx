import React, { useState, useEffect, useRef } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
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
  ExpandMore as ExpandMoreIcon,
  Storage as StorageIcon
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
  onUserAuthenticated?: (nid: string, user: AuthUserProfile) => void;
  onUserLoggedOut?: () => void;
  currentNid?: string;
}

export const TopNavUserWidget: React.FC<TopNavUserWidgetProps> = ({
  onUserAuthenticated,
  onUserLoggedOut,
  currentNid
}) => {
  const [user, setUser] = useState<AuthUserProfile | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  // Modals state
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [familyModalOpen, setFamilyModalOpen] = useState(false);

  // Auth flow steps: 'LOGIN' | 'FIRST_LOGIN_SETUP' | 'VERIFY_EMAIL_OTP'
  const [authStep, setAuthStep] = useState<'LOGIN' | 'FIRST_LOGIN_SETUP' | 'VERIFY_EMAIL_OTP'>('LOGIN');
  const [nidInput, setNidInput] = useState('NID-000-0000-0001-9');
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

  const fetchProfileSession = async (overrideNid?: string) => {
    try {
      const qs = overrideNid ? `?nid=${encodeURIComponent(overrideNid)}` : '';
      const res = await fetch(`/api/v1/profile/me${qs}`, { credentials: 'include' });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
        setEditSocialName(data.user.social_name || data.user.full_name || '');
        setEditPhone(data.user.phone_number || '');
        setEditBio(data.user.bio || '');
        if (onUserAuthenticated) {
          onUserAuthenticated(data.user.nid, data.user);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoadingSession(false);
    }
  };

  useEffect(() => {
    fetchProfileSession(currentNid);
  }, [currentNid]);

  const lookupPostalInitialPassword = async (targetNid: string) => {
    setAuthError(null);
    try {
      const res = await fetch(`/api/v1/auth/postal-dispatch?nid=${encodeURIComponent(targetNid.trim())}`);
      const data = await res.json();
      if (res.ok && data.initial_password) {
        setPostalHintPassword(data.initial_password);
        setPasswordInput(data.initial_password);
        setEmailInput(data.citizen?.email || '');
        setAuthNotice(
          `Carta-Senha Inicial localizada no lote AlloyDB para ${data.citizen?.full_name || targetNid}: ${data.initial_password}`
        );
      } else {
        setAuthError(data.error || 'NID não encontrado no lote de 100.000 cidadãos.');
      }
    } catch {
      setAuthError('Falha ao consultar o lote postal de senhas iniciais.');
    }
  };

  const resetCitizenToFirstLogin = async (targetNid: string) => {
    setAuthError(null);
    try {
      const res = await fetch('/api/v1/auth/reset-first-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nid: targetNid.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordInput(data.initial_password || '');
        setPostalHintPassword(data.initial_password || null);
        setAuthStep('LOGIN');
        setAuthNotice(
          `Status de ${targetNid} redefinido para FIRST_LOGIN_REQUIRED no AlloyDB. Senha inicial preenchida (${data.initial_password}).`
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
        setEditSocialName(data.user.social_name || data.user.full_name);
        setEditPhone(data.user.phone_number || '');
        setEditBio(data.user.bio || '');
        setLoginModalOpen(false);
        if (onUserAuthenticated) {
          onUserAuthenticated(data.user.nid, data.user);
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
        setEditSocialName(data.user.social_name || data.user.full_name);
        setEditPhone(data.user.phone_number || '');
        setEditBio(data.user.bio || '');
        setLoginModalOpen(false);
        setAuthStep('LOGIN');
        if (onUserAuthenticated) {
          onUserAuthenticated(data.user.nid, data.user);
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
        onUserAuthenticated(data.user.nid, data.user);
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
          onUserAuthenticated(data.user.nid, data.user);
        }
      } else {
        setProfileStatusMsg(data.error || 'Erro ao enviar foto de perfil.');
      }
    };
    reader.readAsDataURL(file);
  };

  const openReadOnlyFamilyModal = async () => {
    setMenuAnchorEl(null);
    setFamilyModalOpen(true);
    if (!user) return;
    setLoadingFamily(true);
    try {
      const res = await fetch(`/api/v1/profile/family?nid=${encodeURIComponent(user.nid)}`, {
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

  const handleLogout = async () => {
    setMenuAnchorEl(null);
    await fetch('/api/v1/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    setUser(null);
    if (onUserLoggedOut) {
      onUserLoggedOut();
    }
  };

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      {loadingSession ? (
        <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={16} color="primary" />
          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
            Validando Sessão...
          </Typography>
        </Box>
      ) : !user ? (
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<ShieldIcon />}
          onClick={() => {
            setAuthStep('LOGIN');
            setAuthError(null);
            setAuthNotice(null);
            setLoginModalOpen(true);
          }}
          sx={{
            px: 3,
            py: 1.25,
            fontWeight: 700,
            fontSize: '0.95rem',
            borderRadius: 2,
            bgcolor: '#002046',
            '&:hover': { bgcolor: '#00356e' }
          }}
        >
          Entrar com NID
        </Button>
      ) : (
        <>
          <Paper
            variant="outlined"
            onClick={(e) => setMenuAnchorEl(e.currentTarget)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 2,
              py: 0.9,
              borderRadius: 999,
              cursor: 'pointer',
              borderColor: '#cbd5e1',
              transition: 'all 0.15s ease',
              '&:hover': {
                borderColor: '#002046',
                bgcolor: '#f8fafc',
                boxShadow: '0 2px 8px rgba(0,32,70,0.08)'
              }
            }}
          >
            <Avatar
              src={user.avatarUrl || '/assets/pm_portrait.jpg'}
              alt="Avatar do Cidadão"
              sx={{
                width: 42,
                height: 42,
                border: '2px solid #002046',
                bgcolor: '#002046',
                fontWeight: 700
              }}
            >
              {user.name.charAt(0)}
            </Avatar>
            <Box sx={{ textAlign: 'left', pr: 0.5 }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2, fontSize: '0.95rem' }}
              >
                {user.name}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontFamily: 'monospace',
                  color: '#475569',
                  display: 'block',
                  fontSize: '0.78rem',
                  letterSpacing: '0.02em'
                }}
              >
                {user.nid}
              </Typography>
            </Box>
            <ExpandMoreIcon sx={{ color: '#475569', fontSize: 20 }} />
          </Paper>

          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={() => setMenuAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              elevation: 4,
              sx: { width: 310, mt: 1, borderRadius: 2, border: '1px solid #e2e8f0' }
            }}
          >
            <Box sx={{ px: 2, py: 1.5, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Chip
                  size="small"
                  icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                  label="SESSÃO ATIVA • ALLOYDB"
                  color="success"
                  variant="outlined"
                  sx={{ fontFamily: 'monospace', fontSize: '0.68rem', fontWeight: 700, height: 22 }}
                />
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                  {user.role}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', noWrap: true }}>
                {user.email}
              </Typography>
            </Box>

            <MenuItem
              onClick={() => {
                setMenuAnchorEl(null);
                setProfileStatusMsg(null);
                setProfileModalOpen(true);
              }}
              sx={{ py: 1.25 }}
            >
              <ListItemIcon>
                <PersonIcon fontSize="small" sx={{ color: '#002046' }} />
              </ListItemIcon>
              <ListItemText
                primary="Meu Perfil e Foto"
                secondary="Atualizar avatar, nome social e telefone"
                primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }}
                secondaryTypographyProps={{ fontSize: '0.74rem' }}
              />
            </MenuItem>

            <MenuItem onClick={openReadOnlyFamilyModal} sx={{ py: 1.25 }}>
              <ListItemIcon>
                <GroupIcon fontSize="small" sx={{ color: '#002046' }} />
              </ListItemIcon>
              <ListItemText
                primary="Núcleo Familiar (Visualização)"
                secondary="Vínculos civis somente leitura"
                primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }}
                secondaryTypographyProps={{ fontSize: '0.74rem' }}
              />
            </MenuItem>

            <MenuItem
              onClick={() => {
                setMenuAnchorEl(null);
                setNidInput(user.nid);
                setPasswordInput('');
                setAuthStep('LOGIN');
                setAuthError(null);
                setAuthNotice(null);
                setLoginModalOpen(true);
              }}
              sx={{ py: 1.25 }}
            >
              <ListItemIcon>
                <KeyIcon fontSize="small" sx={{ color: '#475569' }} />
              </ListItemIcon>
              <ListItemText
                primary="Alternar Cidadão (Login NID)"
                primaryTypographyProps={{ fontSize: '0.86rem', fontWeight: 500 }}
              />
            </MenuItem>

            <Divider />

            <MenuItem onClick={handleLogout} sx={{ py: 1.25, color: '#b91c1c' }}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" sx={{ color: '#b91c1c' }} />
              </ListItemIcon>
              <ListItemText
                primary="Encerrar Sessão"
                primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 700 }}
              />
            </MenuItem>
          </Menu>
        </>
      )}

      {/* MODAL 1: AUTENTICAÇÃO SOBERANA & FLUXO DE PRIMEIRO ACESSO COM OTP DE 6 DÍGITOS */}
      <Dialog
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2.5, overflow: 'hidden' } }}
      >
        <DialogTitle
          sx={{
            bgcolor: '#002046',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ShieldIcon sx={{ color: '#b4c5ff' }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                Autenticação Soberana • Identidade Nacional (NID)
              </Typography>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#b4c5ff' }}>
                AlloyDB for PostgreSQL 15 • Argon2id • 2FA E-mail OTP
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setLoginModalOpen(false)} sx={{ color: '#cbd5e1' }} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3, pb: 3 }}>
          {/* Stepper Indicator */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2.5, mt: 1 }}>
            <Chip
              label="1. Credenciais NID"
              size="small"
              color={authStep === 'LOGIN' ? 'primary' : 'default'}
              sx={{ flex: 1, fontFamily: 'monospace', fontWeight: 700 }}
            />
            <Chip
              label="2. Troca de Senha + E-mail"
              size="small"
              color={authStep === 'FIRST_LOGIN_SETUP' ? 'primary' : 'default'}
              sx={{ flex: 1, fontFamily: 'monospace', fontWeight: 700 }}
            />
            <Chip
              label="3. Código OTP (6 Dígitos)"
              size="small"
              color={authStep === 'VERIFY_EMAIL_OTP' ? 'primary' : 'default'}
              sx={{ flex: 1, fontFamily: 'monospace', fontWeight: 700 }}
            />
          </Box>

          {authError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {authError}
            </Alert>
          )}

          {authNotice && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {authNotice}
            </Alert>
          )}

          {authStep === 'LOGIN' && (
            <Box component="form" onSubmit={handleLoginSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Identificador Nacional (NID) ou E-mail"
                value={nidInput}
                onChange={(e) => setNidInput(e.target.value)}
                placeholder="Ex: NID-000-0000-0001-9"
                fullWidth
                required
                size="small"
                InputProps={{ sx: { fontFamily: 'monospace' } }}
              />
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<KeyIcon />}
                  onClick={() => lookupPostalInitialPassword(nidInput)}
                >
                  Consultar Senha Inicial (Lote 100k)
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  startIcon={<RefreshIcon />}
                  onClick={() => resetCitizenToFirstLogin(nidInput)}
                >
                  Simular 1º Acesso
                </Button>
              </Box>

              <TextField
                label="Senha de Acesso"
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Digite sua senha inicial ou definitiva"
                fullWidth
                required
                size="small"
              />
              {postalHintPassword && (
                <Typography variant="caption" color="text.secondary">
                  Senha inicial localizada: <code>{postalHintPassword}</code> (Primeiro-Ministro também aceita{' '}
                  <code>ATs32=34</code>).
                </Typography>
              )}

              <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#f8fafc' }}>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, display: 'block', mb: 1 }}>
                  CONTAS SOBERANAS PARA TESTE RÁPIDO (ALLOYDB 100K):
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {[
                    { nid: 'NID-000-0000-0001-9', label: 'Primeiro-Ministro (jopoco)' },
                    { nid: 'NID-000-0000-0002-7', label: 'Secretária-Geral (Helena)' },
                    { nid: 'NID-000-0000-0004-3', label: 'Médica Telemed (Dra. Sofia)' },
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
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              </Paper>

              <Button type="submit" variant="contained" color="primary" size="large" disabled={submitting} fullWidth>
                {submitting ? 'Verificando Hash Argon2id no AlloyDB...' : 'Autenticar com NID'}
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
                <strong>Primeiro Acesso Detectado ({nidInput}):</strong> Defina sua senha definitiva (mínimo 8
                caracteres, letras e números) e vincule seu e-mail pessoal para receber o código OTP de 6 dígitos.
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
                <Button variant="outlined" onClick={() => setAuthStep('LOGIN')}>
                  Voltar
                </Button>
                <Button type="submit" variant="contained" color="primary" fullWidth disabled={submitting}>
                  {submitting ? 'Gerando Código Criptográfico...' : 'Salvar Nova Senha e Enviar Código de 6 Dígitos'}
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
                Enviamos um código numérico de 6 dígitos para <strong>{emailInput}</strong> (expira em 10 minutos • máx.
                3 tentativas).
                {dispatchedOtpPreview && (
                  <Box sx={{ mt: 1, p: 1, bgcolor: '#fff', borderRadius: 1, border: '1px solid #86efac' }}>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                      CÓDIGO OTP DISPARADO:{' '}
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
                <Button variant="outlined" onClick={handleResendOtp}>
                  Reenviar Código
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="success"
                  fullWidth
                  disabled={submitting || otpInput.length !== 6}
                >
                  {submitting ? 'Validando OTP...' : 'Confirmar Código e Ativar Conta'}
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 2: MEU PERFIL E FOTO */}
      <Dialog open={profileModalOpen} onClose={() => setProfileModalOpen(false)} maxWidth="sm" fullWidth>
        {user && (
          <>
            <DialogTitle
              sx={{
                bgcolor: '#002046',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon sx={{ color: '#b4c5ff' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Meu Perfil Cidadão & Foto Oficial
                </Typography>
              </Box>
              <IconButton onClick={() => setProfileModalOpen(false)} sx={{ color: '#cbd5e1' }} size="small">
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              {profileStatusMsg && (
                <Alert severity="info" sx={{ mb: 2, mt: 1 }}>
                  {profileStatusMsg}
                </Alert>
              )}

              <Paper variant="outlined" sx={{ p: 2, mb: 2.5, mt: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={user.avatarUrl || '/assets/pm_portrait.jpg'}
                  alt={user.name}
                  sx={{ width: 68, height: 68, border: '2px solid #002046' }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {user.full_name}
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block', mb: 1 }}>
                    {user.nid} • {user.email}
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
                    variant="contained"
                    startIcon={<PhotoCameraIcon />}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Enviar Nova Foto (WEBP/PNG/JPG)
                  </Button>
                </Box>
              </Paper>

              <Box component="form" onSubmit={handleSaveProfile} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Nome de Exibição / Nome Social"
                  value={editSocialName}
                  onChange={(e) => setEditSocialName(e.target.value)}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Telefone Soberano"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Nota Cadastral"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  multiline
                  rows={2}
                  fullWidth
                  size="small"
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button onClick={() => setProfileModalOpen(false)}>Fechar</Button>
                  <Button type="submit" variant="contained" color="primary">
                    Salvar Alterações
                  </Button>
                </Box>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* MODAL 3: NÚCLEO FAMILIAR (ESTRITAMENTE SOMENTE LEITURA / READ-ONLY) */}
      <Dialog open={familyModalOpen} onClose={() => setFamilyModalOpen(false)} maxWidth="md" fullWidth>
        {user && (
          <>
            <DialogTitle
              sx={{
                bgcolor: '#002046',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GroupIcon sx={{ color: '#b4c5ff' }} />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Núcleo Familiar Soberano (Modo Somente Leitura)
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#b4c5ff' }}>
                    Titular: {user.full_name} ({user.nid})
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={() => setFamilyModalOpen(false)} sx={{ color: '#cbd5e1' }} size="small">
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 2.5 }}>
              <Alert severity="warning" icon={<VisibilityIcon />} sx={{ mb: 2, mt: 1 }}>
                <strong>REGRA DE GOVERNANÇA CIVIL (SOMENTE LEITURA):</strong> Os dados de parentesco e dependência são
                mantidos unicamente pelo Registro Civil Central no AlloyDB. Endpoints <code>POST/PUT/PATCH/DELETE</code>{' '}
                em <code>/api/v1/profile/family</code> retornam <code>403 Forbidden</code>.
              </Alert>

              {loadingFamily ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <CircularProgress size={28} />
                </Box>
              ) : familyMembers.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  Nenhum vínculo familiar direto registrado para este NID.
                </Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>NID Familiar</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Nome Completo</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Parentesco</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Idade</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status Civil</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {familyMembers.map((fm) => (
                        <TableRow key={fm.relation_id} hover>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#002046' }}>
                            {fm.relative_nid}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{fm.relative_name}</TableCell>
                          <TableCell>
                            <Chip label={fm.relation_type} size="small" color="primary" variant="outlined" />
                          </TableCell>
                          <TableCell>{fm.relative_age} anos</TableCell>
                          <TableCell>
                            <Chip
                              icon={<LockIcon sx={{ fontSize: '12px !important' }} />}
                              label="Registro Imutável"
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
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default TopNavUserWidget;
