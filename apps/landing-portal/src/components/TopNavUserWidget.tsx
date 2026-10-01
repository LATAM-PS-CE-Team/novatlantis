import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Mail,
  KeyRound,
  User,
  Users,
  Camera,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  FileText
} from 'lucide-react';

export interface AuthenticatedUser {
  nid: string;
  name: string;
  full_name: string;
  social_name: string;
  email: string;
  email_verified: boolean;
  credential_status: string;
  must_change_password: boolean;
  avatarUrl: string;
  phone_number: string;
  bio: string;
  role: string;
  iam_role: string;
  profession: string;
  specialty: string;
  district: string;
}

interface TopNavUserWidgetProps {
  currentNid?: string;
  onUserAuthenticated?: (nid: string, user: AuthenticatedUser) => void;
  onUserLoggedOut?: () => void;
}

export const TopNavUserWidget: React.FC<TopNavUserWidgetProps> = ({
  currentNid,
  onUserAuthenticated,
  onUserLoggedOut
}) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Modals: 'none' | 'login' | 'first_login_setup' | 'verify_otp' | 'profile' | 'family'
  const [activeModal, setActiveModal] = useState<
    'none' | 'login' | 'first_login_setup' | 'verify_otp' | 'profile' | 'family'
  >('none');

  // Login Form State
  const [loginNid, setLoginNid] = useState(currentNid || 'NID-000-0000-0001-9');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [postalDispatchInfo, setPostalDispatchInfo] = useState<any>(null);

  // First Login Setup Form State
  const [setupEmail, setSetupEmail] = useState('');
  const [setupNewPassword, setSetupNewPassword] = useState('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');

  // Verify OTP Code Form State
  const [otpCode, setOtpCode] = useState('');
  const [dispatchedEmailPreview, setDispatchedEmailPreview] = useState<{
    from: string;
    to: string;
    subject: string;
    otp_code: string;
  } | null>(null);

  // Profile Edit State
  const [profileSocialName, setProfileSocialName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('');
  const [profileStatusMsg, setProfileStatusMsg] = useState<string | null>(null);

  // Read-Only Family State
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [familyReadOnlyTestResult, setFamilyReadOnlyTestResult] = useState<string | null>(null);

  const fetchCurrentProfile = async (fallbackNid?: string) => {
    try {
      const url = fallbackNid
        ? `/api/v1/profile/me?nid=${encodeURIComponent(fallbackNid)}`
        : '/api/v1/profile/me';
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        setProfileSocialName(data.user.social_name || data.user.name);
        setProfilePhone(data.user.phone_number || '');
        setProfileBio(data.user.bio || '');
        setProfileAvatarUrl(data.user.avatarUrl || '/assets/coat_of_arms.jpg');
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCurrentProfile(currentNid || 'NID-000-0000-0001-9');
  }, [currentNid]);

  const handleConsultPostalPassword = async (targetNid?: string) => {
    const nidToLookup = (targetNid || loginNid || 'NID-000-0000-0001-9').trim().toUpperCase();
    setAuthError(null);
    try {
      const res = await fetch(`/api/v1/auth/postal-dispatch?nid=${encodeURIComponent(nidToLookup)}`);
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'NID não encontrado.');
        return;
      }
      setPostalDispatchInfo(data);
      setLoginPassword(data.initial_temp_password);
      setAuthInfo(
        `Carta-Senha Oficial localizada para ${data.full_name}: senha inicial "${data.initial_temp_password}" preenchida automaticamente.`
      );
    } catch (e: any) {
      setAuthError(e.message);
    }
  };

  const handleResetToFirstLogin = async () => {
    const nidToReset = (loginNid || 'NID-000-0000-0001-9').trim().toUpperCase();
    setAuthError(null);
    try {
      const res = await fetch('/api/v1/auth/reset-first-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nid: nidToReset })
      });
      const data = await res.json();
      if (res.ok && data.reset) {
        setLoginPassword(data.initial_temp_password);
        setPostalDispatchInfo(null);
        setAuthInfo(
          `NID ${data.nid} configurado como FIRST_LOGIN_REQUIRED! Senha inicial temporária "${data.initial_temp_password}" preenchida. Clique em "Autenticar com NID" para iniciar o fluxo de 1º acesso e OTP.`
        );
      }
    } catch (e: any) {
      setAuthError(e.message);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthInfo(null);
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nid: loginNid.trim().toUpperCase(),
          password: loginPassword
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Falha na autenticação.');
        return;
      }

      if (data.challenge === 'FIRST_LOGIN_REQUIRED') {
        setSetupEmail(data.current_email || '');
        setSetupNewPassword('');
        setSetupConfirmPassword('');
        setActiveModal('first_login_setup');
        return;
      }

      if (data.authenticated && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        setActiveModal('none');
        setDropdownOpen(false);
        if (onUserAuthenticated) {
          onUserAuthenticated(data.user.nid, data.user);
        }
      }
    } catch (e: any) {
      setAuthError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFirstLoginSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (setupNewPassword.length < 8) {
      setAuthError('A nova senha definitiva deve ter no mínimo 8 caracteres.');
      return;
    }
    if (setupNewPassword !== setupConfirmPassword) {
      setAuthError('A confirmação de senha não coincide com a nova senha.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/first-login/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nid: loginNid.trim().toUpperCase(),
          email: setupEmail.trim(),
          newPassword: setupNewPassword
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Erro ao configurar primeiro acesso.');
        return;
      }

      setDispatchedEmailPreview(data.dispatched_email_preview || null);
      setOtpCode(data.dispatched_email_preview?.otp_code || '');
      setActiveModal('verify_otp');
    } catch (e: any) {
      setAuthError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/verify-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nid: loginNid.trim().toUpperCase(),
          email: setupEmail.trim(),
          code: otpCode.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Código de verificação inválido.');
        return;
      }

      if (data.verified && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        setActiveModal('none');
        setDropdownOpen(false);
        if (onUserAuthenticated) {
          onUserAuthenticated(data.user.nid, data.user);
        }
      }
    } catch (e: any) {
      setAuthError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setAuthError(null);
    const res = await fetch('/api/v1/auth/resend-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        nid: loginNid.trim().toUpperCase(),
        email: setupEmail.trim()
      })
    });
    const data = await res.json();
    if (res.ok && data.dispatched_email_preview) {
      setDispatchedEmailPreview(data.dispatched_email_preview);
      setOtpCode(data.dispatched_email_preview.otp_code);
      setAuthInfo('Novo código OTP de 6 dígitos gerado e enviado para o seu e-mail.');
    } else {
      setAuthError(data.error || 'Erro ao reenviar código.');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
    setIsAuthenticated(false);
    setUser(null);
    setDropdownOpen(false);
    if (onUserLoggedOut) {
      onUserLoggedOut();
    }
  };

  const openProfileModal = () => {
    if (user) {
      setProfileSocialName(user.social_name || user.name);
      setProfilePhone(user.phone_number || '');
      setProfileBio(user.bio || '');
      setProfileAvatarUrl(user.avatarUrl || '/assets/coat_of_arms.jpg');
    }
    setProfileStatusMsg(null);
    setDropdownOpen(false);
    setActiveModal('profile');
  };

  const openFamilyModal = async () => {
    setDropdownOpen(false);
    setFamilyReadOnlyTestResult(null);
    setActiveModal('family');
    try {
      const res = await fetch(
        `/api/v1/profile/family?nid=${encodeURIComponent(user?.nid || 'NID-000-0000-0001-9')}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      setFamilyMembers(data.family_members || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const res = await fetch('/api/v1/profile/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        nid: user.nid,
        social_name: profileSocialName,
        phone_number: profilePhone,
        bio: profileBio
      })
    });
    const data = await res.json();
    if (res.ok && data.user) {
      setUser(data.user);
      setProfileStatusMsg('Dados cadastrais básicos atualizados com sucesso em citizen_profiles.');
      if (onUserAuthenticated) {
        onUserAuthenticated(data.user.nid, data.user);
      }
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const allowed = ['image/webp', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      setProfileStatusMsg('Erro: Apenas imagens WEBP, PNG ou JPG são permitidas.');
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
        setProfileAvatarUrl(data.user.avatarUrl);
        setProfileStatusMsg(`Foto de perfil (${file.type}) validada e salva com sucesso!`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTestFamilyWriteForbidden = async () => {
    const res = await fetch('/api/v1/profile/family', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'attempt_mutation' })
    });
    const data = await res.json();
    setFamilyReadOnlyTestResult(`HTTP ${res.status} — ${data.error}: ${data.message}`);
  };

  return (
    <>
      {/* COMPONENTE DE TOPO DIREITO (TopNavUserWidget - Seção 6.2 da Especificação) */}
      {!isAuthenticated || !user ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setAuthError(null);
              setAuthInfo(null);
              setActiveModal('login');
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition flex items-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            Entrar com NID
          </button>
        </div>
      ) : (
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-1.5 rounded-full hover:bg-slate-100 transition focus:outline-none border border-slate-200 bg-white pr-3"
            aria-expanded={dropdownOpen}
          >
            <img
              src={user.avatarUrl || '/assets/coat_of_arms.jpg'}
              alt={user.name}
              className="w-9 h-9 rounded-full object-cover border border-slate-300"
            />
            <div className="text-left hidden md:block">
              <p className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</p>
              <p className="text-[11px] font-mono text-slate-500">{user.nid}</p>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs text-slate-500">Autenticado como</p>
                <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-medium bg-blue-100 text-blue-800 rounded">
                    {user.role}
                  </span>
                  <span
                    className={`inline-block px-1.5 py-0.5 text-[10px] font-mono rounded ${
                      user.email_verified
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {user.email_verified ? 'E-mail Verificado' : '1º Acesso Pendente'}
                  </span>
                </div>
              </div>

              <button
                onClick={openProfileModal}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left"
              >
                <User className="w-4 h-4 text-slate-500" />
                Meu Perfil e Foto
              </button>

              <button
                onClick={openFamilyModal}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left"
              >
                <Users className="w-4 h-4 text-slate-500" />
                Núcleo Familiar
                <span className="ml-auto text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                  Visualização
                </span>
              </button>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  setAuthError(null);
                  setAuthInfo(null);
                  setActiveModal('login');
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-blue-700 hover:bg-blue-50 text-left font-medium"
              >
                <KeyRound className="w-4 h-4" />
                Autenticar outro NID / 1º Acesso
              </button>

              <div className="border-t border-slate-100 my-1"></div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
              >
                <LogOut className="w-4 h-4" />
                Encerrar Sessão
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: LOGIN COM NID E SENHA (/login) */}
      {activeModal === 'login' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full border-2 border-[#002046] shadow-2xl overflow-hidden">
            <div className="bg-[#002046] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-[#b4c5ff]" />
                <div>
                  <h3 className="font-serif-authority font-bold text-base">
                    Autenticação Soberana por NID
                  </h3>
                  <p className="text-[11px] text-slate-300 font-mono">
                    POST /api/v1/auth/login • Argon2id & Cookies HttpOnly
                  </p>
                </div>
              </div>
              <button onClick={() => setActiveModal('none')} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="p-6 space-y-4 text-xs">
              {authError && (
                <div className="p-3 rounded bg-red-50 border border-red-300 text-red-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}
              {authInfo && (
                <div className="p-3 rounded bg-blue-50 border border-blue-200 text-blue-950 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <span>{authInfo}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-[#002046] mb-1">
                  Número de Identificação Digital (NID)
                </label>
                <input
                  type="text"
                  value={loginNid}
                  onChange={(e) => setLoginNid(e.target.value)}
                  placeholder="Ex: NID-000-0000-0001-9"
                  className="w-full border border-slate-300 rounded px-3 py-2.5 font-mono text-sm focus:border-[#002046] focus:outline-none"
                  required
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {[
                    { nid: 'NID-000-0000-0001-9', label: 'Jopoco (PM Root)' },
                    { nid: 'NID-000-0000-0003-5', label: 'Helena (IAM 360)' },
                    { nid: 'NID-000-0000-0004-3', label: 'Dra. Sofia (Saúde)' },
                    { nid: 'NID-000-0000-0006-0', label: 'Prof. Lucas (Edu)' },
                    { nid: 'NID-000-0000-0010-8', label: 'Pedro (Estudante)' }
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset.nid}
                      onClick={() => {
                        setLoginNid(preset.nid);
                        handleConsultPostalPassword(preset.nid);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-[#dae2ff] text-[#002046] font-mono text-[10px] border border-slate-300"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#002046] mb-1">
                  Senha de Acesso (Inicial ou Definitiva)
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Digite sua senha..."
                  className="w-full border border-slate-300 rounded px-3 py-2.5 font-mono text-sm focus:border-[#002046] focus:outline-none"
                  required
                />
              </div>

              {/* Auxiliar do Balcão Postal de Cidadania (Seção 4.1) */}
              <div className="p-3 rounded bg-[#f8f9fb] border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase font-bold text-[#002046]">
                    Balcão Postal de Cidadania (Migração 100k Cidadãos)
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleConsultPostalPassword()}
                      className="px-2 py-1 rounded bg-[#dae2ff] text-[#001848] font-semibold text-[11px] hover:bg-[#b4c5ff]"
                    >
                      Consultar Senha Inicial
                    </button>
                    <button
                      type="button"
                      onClick={handleResetToFirstLogin}
                      className="px-2 py-1 rounded bg-slate-200 text-slate-800 font-semibold text-[11px] hover:bg-slate-300 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Simular 1º Acesso
                    </button>
                  </div>
                </div>
                {postalDispatchInfo && (
                  <div className="text-[11px] font-mono text-slate-700 bg-white p-2 rounded border border-slate-200">
                    <div>Cidadão: <strong>{postalDispatchInfo.full_name}</strong></div>
                    <div>
                      Senha Inicial Randômica: <strong className="text-blue-800">{postalDispatchInfo.initial_temp_password}</strong>
                    </div>
                    <div>
                      Status Atual: <strong>{postalDispatchInfo.credential_state?.status}</strong>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#002046] text-white font-bold py-3 rounded text-sm hover:bg-[#00356e] transition"
              >
                {loading ? 'Verificando Credenciais Argon2id...' : 'Entrar com NID'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PRIMEIRO ACESSO - CADASTRO DE E-MAIL E TROCA DE SENHA (/auth/setup-first-login) */}
      {activeModal === 'first_login_setup' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full border-2 border-[#002046] shadow-2xl overflow-hidden">
            <div className="bg-[#002046] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-bold">
                  CHALLENGE: FIRST_LOGIN_REQUIRED
                </span>
                <h3 className="font-serif-authority font-bold text-base mt-1">
                  Configuração Obrigatória de Primeiro Acesso ({loginNid})
                </h3>
              </div>
              <button onClick={() => setActiveModal('none')} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFirstLoginSetupSubmit} className="p-6 space-y-4 text-xs">
              {authError && (
                <div className="p-3 rounded bg-red-50 border border-red-300 text-red-900">
                  {authError}
                </div>
              )}

              <p className="text-slate-600 leading-relaxed">
                Por segurança constitucional, você deve substituir sua senha temporária inicial por uma <strong>senha definitiva</strong> e validar seu <strong>e-mail</strong> com um código OTP de 6 dígitos.
              </p>

              <div>
                <label className="block font-bold text-[#002046] mb-1">
                  E-mail para Vinculação e Recebimento do Código OTP
                </label>
                <input
                  type="email"
                  value={setupEmail}
                  onChange={(e) => setSetupEmail(e.target.value)}
                  placeholder="seu.nome@novatlantis.gov.cloud"
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#002046] mb-1">
                  Nova Senha Definitiva (Mínimo 8 caracteres)
                </label>
                <input
                  type="password"
                  value={setupNewPassword}
                  onChange={(e) => setSetupNewPassword(e.target.value)}
                  placeholder="Digite sua nova senha forte..."
                  className="w-full border border-slate-300 rounded px-3 py-2 font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#002046] mb-1">
                  Confirmar Nova Senha Definitiva
                </label>
                <input
                  type="password"
                  value={setupConfirmPassword}
                  onChange={(e) => setSetupConfirmPassword(e.target.value)}
                  placeholder="Repita sua nova senha..."
                  className="w-full border border-slate-300 rounded px-3 py-2 font-mono text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-700 text-white font-bold py-3 rounded text-sm hover:bg-blue-800 transition"
              >
                {loading ? 'Gerando Código OTP de 6 Dígitos...' : 'Salvar Nova Senha e Enviar Código OTP'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VALIDAÇÃO DE CÓDIGO OTP DE 6 DÍGITOS (/auth/verify-code) */}
      {activeModal === 'verify_otp' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full border-2 border-[#002046] shadow-2xl overflow-hidden">
            <div className="bg-[#002046] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#b4c5ff]" />
                <div>
                  <h3 className="font-serif-authority font-bold text-base">
                    Validação de E-mail Institucional (OTP 6 Dígitos)
                  </h3>
                  <p className="text-[11px] text-slate-300 font-mono">
                    Validade: 10 minutos • Limite: 3 tentativas
                  </p>
                </div>
              </div>
              <button onClick={() => setActiveModal('none')} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVerifyOtpSubmit} className="p-6 space-y-4 text-xs">
              {authError && (
                <div className="p-3 rounded bg-red-50 border border-red-300 text-red-900">
                  {authError}
                </div>
              )}
              {authInfo && (
                <div className="p-3 rounded bg-emerald-50 border border-emerald-300 text-emerald-900">
                  {authInfo}
                </div>
              )}

              {/* Previsualização Fiel do E-mail Despachado (Template da Seção 4.2) */}
              {dispatchedEmailPreview && (
                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-2">
                  <div className="text-[10px] font-mono uppercase text-slate-500 flex justify-between">
                    <span>CAIXA POSTAL SOBERANA (SMTP OUTBOX)</span>
                    <span>PARA: {dispatchedEmailPreview.to}</span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm">
                    Validação de E-mail Institucional ({loginNid})
                  </div>
                  <p className="text-slate-600 text-xs">
                    Utilize o código de verificação abaixo para confirmar sua identidade:
                  </p>
                  <div className="text-2xl font-mono font-bold tracking-[6px] text-center text-blue-800 bg-blue-50 py-3 rounded border border-blue-200">
                    {dispatchedEmailPreview.otp_code}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-[#002046] mb-1">
                  Digite o Código de 6 Dígitos
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="000000"
                  className="w-full border-2 border-[#002046] rounded px-3 py-2.5 font-mono text-center text-xl tracking-[8px] font-bold"
                  required
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="px-3 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Reenviar Código OTP
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-700 text-white font-bold py-2.5 rounded text-sm hover:bg-blue-800 transition"
                >
                  {loading ? 'Validando OTP...' : 'Confirmar Código e Ativar Acesso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: MEU PERFIL E FOTO (/perfil) */}
      {activeModal === 'profile' && user && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full border-2 border-[#002046] shadow-2xl overflow-hidden">
            <div className="bg-[#002046] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#b4c5ff]" />
                <div>
                  <h3 className="font-serif-authority font-bold text-base">
                    Meu Perfil e Foto ({user.nid})
                  </h3>
                  <p className="text-[11px] text-slate-300 font-mono">
                    PUT /api/v1/profile/me • POST /api/v1/profile/me/avatar
                  </p>
                </div>
              </div>
              <button onClick={() => setActiveModal('none')} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4 text-xs">
              {profileStatusMsg && (
                <div className="p-3 rounded bg-emerald-50 border border-emerald-300 text-emerald-950 font-medium">
                  {profileStatusMsg}
                </div>
              )}

              <div className="flex items-center gap-4 pb-3 border-b border-slate-200">
                <img
                  src={profileAvatarUrl || '/assets/coat_of_arms.jpg'}
                  alt={user.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#002046]"
                />
                <div className="space-y-1.5">
                  <div className="font-bold text-sm text-[#002046]">{user.full_name}</div>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#dae2ff] text-[#001848] font-semibold cursor-pointer hover:bg-[#b4c5ff] transition">
                    <Camera className="w-3.5 h-3.5" />
                    Enviar Foto (WEBP, PNG, JPG)
                    <input
                      type="file"
                      accept="image/webp,image/png,image/jpeg"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#002046] mb-1">Nome Social / Nome de Exibição</label>
                <input
                  type="text"
                  value={profileSocialName}
                  onChange={(e) => setProfileSocialName(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-[#002046] mb-1">Telefone de Contato</label>
                <input
                  type="text"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-[#002046] mb-1">Biografia Cívica / Profissional</label>
                <textarea
                  rows={3}
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#002046] text-white font-bold py-2.5 rounded hover:bg-[#00356e] transition"
              >
                Salvar Alterações de Perfil
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: NÚCLEO FAMILIAR ESTRITAMENTE SOMENTE LEITURA (/perfil/familia) */}
      {activeModal === 'family' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full border-2 border-[#002046] shadow-2xl overflow-hidden">
            <div className="bg-[#002046] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-[#b4c5ff]" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif-authority font-bold text-base">
                      Núcleo Familiar ({user?.nid})
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-[#b4c5ff] rounded border border-[#b4c5ff]/30">
                      SOMENTE LEITURA (READ-ONLY)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-mono">
                    GET /api/v1/profile/family • Mantido exclusivamente pelo Registro Civil Central
                  </p>
                </div>
              </div>
              <button onClick={() => setActiveModal('none')} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="p-3 rounded bg-slate-100 border-l-4 border-[#002046] text-slate-700 flex items-center justify-between gap-2">
                <span>
                  <strong className="text-[#002046]">Regra de Negócio Crítica:</strong> Os dados de parentesco e dependência são mantidos unicamente pelo Registro Civil Central em modo estritamente <em>somente leitura</em>. Qualquer tentativa de escrita retorna <code className="font-mono">403 Forbidden (ERRO_READ_ONLY_FAMILY)</code>.
                </span>
                <button
                  type="button"
                  onClick={handleTestFamilyWriteForbidden}
                  className="shrink-0 px-2.5 py-1.5 rounded bg-slate-200 hover:bg-slate-300 text-[#002046] font-mono text-[10px] font-bold"
                >
                  Testar Bloqueio 403
                </button>
              </div>

              {familyReadOnlyTestResult && (
                <div className="p-2.5 rounded bg-amber-50 border border-amber-300 font-mono text-[11px] text-amber-950">
                  {familyReadOnlyTestResult}
                </div>
              )}

              <div className="space-y-2">
                {familyMembers.length === 0 ? (
                  <p className="text-slate-500 py-4 text-center">Nenhum vínculo familiar encontrado.</p>
                ) : (
                  familyMembers.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded bg-[#f8f9fb] border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-bold text-sm text-[#002046]">{m.relative_name}</div>
                        <div className="font-mono text-[11px] text-slate-600">
                          {m.relative_nid} • {m.relative_age} anos • {m.relative_profession} ({m.relative_district})
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-[#dae2ff] text-[#001848] font-mono text-[11px] font-bold">
                        {m.relation_type}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
