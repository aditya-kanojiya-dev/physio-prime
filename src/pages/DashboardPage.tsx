import React, { useState } from 'react';
import { User, FileText, Bell, Shield, Edit3, Save, X, CheckCircle2, AlertCircle, Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { hasPendingOnlinePayment } from '../lib/adapters';
import { supabase } from '../lib/supabase';
import { Field } from '../components/ui/Field';
import { hasErrors, matches, minLen, numInRange, phone10, required, type Errors } from '../lib/validate';

const fieldCls =
  'w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20';

type ProfileErrors = Errors<'name' | 'phone' | 'weight' | 'height'>;

export const DashboardPage: React.FC = () => {
  const { user, hydrated } = useAuth();
  const { appointments } = useBooking();
  const [activeTab, setActiveTab] = useState<'profile' | 'records' | 'notifications' | 'privacy'>('profile');

  if (!hydrated) {
    return (
      <div className="pt-28 pb-20 min-h-screen flex items-center justify-center">
        <p className="text-sm font-semibold text-slate-400">Loading your profile...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Profile Banner Header */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl bg-white flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-teal-400 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              {initials(user.name)}
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h1 className="text-2xl font-extrabold text-slate-900">{user.name}</h1>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-100 text-teal-600">
                  Patient
                </span>
              </div>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-center">
              <p className="text-xs text-slate-500 font-semibold">Completed Sessions</p>
              <p className="text-lg font-extrabold text-blue-600">
                {appointments.filter(a => a.status === 'completed').length}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200 text-center">
              <p className="text-xs text-slate-500 font-semibold">Upcoming Sessions</p>
              <p className="text-lg font-extrabold text-teal-600">
                {appointments.filter(a => a.status === 'upcoming' && !hasPendingOnlinePayment(a)).length}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
          {(
            [
              { id: 'profile', label: 'Personal Profile', icon: User },
              { id: 'records', label: 'Digital Prescriptions', icon: FileText },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'privacy', label: 'Privacy & Security', icon: Shield },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl bg-white">
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'records' && <RecordsTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'privacy' && <PrivacyTab />}
        </div>

      </div>
    </div>
  );
};

function initials(name: string) {
  return (name || '?')
    .split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function ProfileTab() {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [dob, setDob] = useState(user?.dob || '');
  const [weight, setWeight] = useState(user?.weight || '');
  const [height, setHeight] = useState(user?.height || '');
  const [address, setAddress] = useState(addressText(user?.address));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const startEdit = () => {
    setName(user.name || '');
    setPhone(user.phone || '');
    setGender(user.gender || '');
    setDob(user.dob || '');
    setWeight(user.weight || '');
    setHeight(user.height || '');
    setAddress(addressText(user.address));
    setError(null);
    setErrors({});
    setSaved(false);
    setEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const next: ProfileErrors = {
      name: required(name, 'Name'),
      phone: phone.trim() ? phone10(phone) : undefined,
      weight: weight.trim() ? numInRange(weight, 1, 500, 'Weight') : undefined,
      height: height.trim() ? numInRange(height, 1, 250, 'Height') : undefined,
    };
    setErrors(next);
    if (hasErrors(next)) return;

    const phoneDigits = (phone || '').replace(/\D/g, '');
    setLoading(true);
    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim() ? phoneDigits : null,
        gender: gender || null,
        dob: dob || null,
        weight: weight || null,
        height: height || null,
        address: address.trim() ? { text: address.trim() } : null,
      });
      setEditing(false);
      setSaved(true);
    } catch (err) {
      setError((err as Error)?.message || 'Could not save changes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-extrabold text-slate-900">Account Details</h3>
        {!editing && (
          <button
            onClick={startEdit}
            className="text-xs font-bold text-blue-600 flex items-center gap-1"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Profile
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSave} noValidate className="space-y-4 max-w-lg">
          <Field id="profile-name" label="Full Name" error={errors.name}>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors((p) => ({ ...p, name: undefined }));
              }}
              className={fieldCls}
            />
          </Field>

          <Field
            id="profile-email"
            label="Email Address"
            hint="Email cannot be changed here."
            labelClass="ml-1 text-xs font-bold text-slate-700"
          >
            <input
              type="email"
              value={user.email || ''}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-400 outline-none cursor-not-allowed"
              disabled
            />
          </Field>

          <Field id="profile-phone" label="Phone Number" error={errors.phone}>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setErrors((p) => ({ ...p, phone: undefined }));
              }}
              placeholder="+91 98765 43210"
              className={fieldCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field id="profile-gender" label="Gender">
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 shadow-sm"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>

            <Field id="profile-dob" label="Date of Birth">
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 shadow-sm"
              />
            </Field>

            <Field id="profile-weight" label="Weight (kg)" error={errors.weight}>
              <input
                type="number"
                min="1"
                max="500"
                step="0.1"
                value={weight}
                onChange={(e) => {
                  setWeight(e.target.value);
                  setErrors((p) => ({ ...p, weight: undefined }));
                }}
                placeholder="e.g. 65"
                className={fieldCls}
              />
            </Field>

            <Field id="profile-height" label="Height (cm)" error={errors.height}>
              <input
                type="number"
                min="1"
                max="250"
                step="0.1"
                value={height}
                onChange={(e) => {
                  setHeight(e.target.value);
                  setErrors((p) => ({ ...p, height: undefined }));
                }}
                placeholder="e.g. 168"
                className={fieldCls}
              />
            </Field>
          </div>

          <Field id="profile-address" label="Address">
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your address"
              className={fieldCls}
            />
          </Field>

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 font-bold text-xs text-slate-600 flex items-center gap-2"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          {saved && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              Profile updated successfully.
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 font-semibold">Full Name</span>
              <p className="font-extrabold text-sm text-slate-900">{user.name}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 font-semibold">Email Address</span>
              <p className="font-extrabold text-sm text-slate-900">{user.email || '—'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 font-semibold">Phone Number</span>
              <p className="font-extrabold text-sm text-slate-900">{user.phone || '—'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 font-semibold">Gender</span>
              <p className="font-extrabold text-sm capitalize text-slate-900">{user.gender || '—'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 font-semibold">Date of Birth</span>
              <p className="font-extrabold text-sm text-slate-900">{user.dob ? formatDob(user.dob) : '—'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 font-semibold">Weight / Height</span>
              <p className="font-extrabold text-sm text-slate-900">
                {user.weight ? `${user.weight} kg` : '—'} · {user.height ? `${user.height} cm` : '—'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 sm:col-span-2">
              <span className="text-slate-400 font-semibold">Address</span>
              <p className="font-extrabold text-sm text-slate-900">{addressText(user.address) || '—'}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function addressText(address: Record<string, unknown> | null | undefined): string {
  if (!address || typeof address !== 'object') return '';
  const primary = address.text ?? address.address ?? address.line1;
  return typeof primary === 'string' ? primary : '';
}

function formatDob(dob: string): string {
  return new Date(`${dob}T00:00:00`).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function RecordsTab() {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-extrabold text-slate-900">Digital EHR & Session Summaries</h3>
      <p className="text-xs text-slate-500">Your session notes and prescriptions will appear here after your first appointment.</p>
    </div>
  );
}

function NotificationsTab() {
  return (
    <div className="space-y-4 text-xs">
      <h3 className="text-xl font-extrabold text-slate-900">Notification Settings</h3>
      <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <input type="checkbox" defaultChecked className="accent-blue-600" />
        <span className="font-semibold text-slate-900">SMS & WhatsApp doctor arrival tracking alerts</span>
      </label>
      <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <input type="checkbox" defaultChecked className="accent-blue-600" />
        <span className="font-semibold text-slate-900">Weekly ergonomic posture exercise reminders</span>
      </label>
    </div>
  );
}

function PrivacyTab() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors<'currentPassword' | 'newPassword' | 'confirmPassword'>>({});
  const [saved, setSaved] = useState(false);

  if (!user?.email) return null;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const next: Errors<'currentPassword' | 'newPassword' | 'confirmPassword'> = {
      currentPassword: required(currentPassword, 'Current password'),
      newPassword: newPassword
        ? minLen(newPassword, 8, 'New password')
        : 'New password is required',
      confirmPassword: !confirmPassword
        ? 'Confirm your new password'
        : matches(newPassword, confirmPassword),
    };
    setErrors(next);
    if (hasErrors(next)) return;

    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email as string,
        password: currentPassword,
      });
      if (signInError) throw new Error('Current password is incorrect.');
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSaved(true);
    } catch (err) {
      setError((err as Error)?.message || 'Could not change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-xs max-w-lg">
      <div>
        <h3 className="text-xl font-extrabold text-slate-900">Privacy & Security Controls</h3>
        <p className="mt-1 text-slate-500">Your health data is encrypted according to HIPAA and ISO-27001 medical standards.</p>
      </div>

      <form onSubmit={handleChangePassword} noValidate className="space-y-4">
        <h4 className="flex items-center gap-2 font-bold text-slate-900">
          <KeyRound className="w-4 h-4" /> Change Account Password
        </h4>

        <Field id="current-password" label="Current Password" error={errors.currentPassword}>
          <PasswordInput
            value={currentPassword}
            onChange={(v) => {
              setCurrentPassword(v);
              setErrors((p) => ({ ...p, currentPassword: undefined }));
            }}
            show={showPassword}
            setShow={setShowPassword}
            autoComplete="current-password"
          />
        </Field>

        <Field id="new-password" label="New Password" error={errors.newPassword}>
          <PasswordInput
            value={newPassword}
            onChange={(v) => {
              setNewPassword(v);
              setErrors((p) => ({ ...p, newPassword: undefined }));
            }}
            show={showPassword}
            setShow={setShowPassword}
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
        </Field>

        <Field id="confirm-new-password" label="Confirm New Password" error={errors.confirmPassword}>
          <PasswordInput
            value={confirmPassword}
            onChange={(v) => {
              setConfirmPassword(v);
              setErrors((p) => ({ ...p, confirmPassword: undefined }));
            }}
            show={showPassword}
            setShow={setShowPassword}
            autoComplete="new-password"
          />
        </Field>

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {saved && (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            Password changed successfully.
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-70"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
          Update Password
        </button>
      </form>
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  show,
  setShow,
  autoComplete,
  placeholder,
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  setShow: (v: boolean) => void;
  autoComplete: string;
  placeholder?: string;
} & Record<string, unknown>) {
  const inputClass =
    'w-full px-4 py-3 pr-11 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20';
  return (
    <div className="relative">
      <input
        {...rest}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:text-slate-600"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
