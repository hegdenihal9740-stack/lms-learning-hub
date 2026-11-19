import portalLogo from '@/assets/skillai-fee-logo.png'
import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Camera, Check, GraduationCap, LockKeyhole, Mail, MapPin, Phone, Save, Trash2, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DEMO_USER, USER, profileKey, setCurrentUser } from './data.js'
import { useCloudAuth } from '@/components/auth-provider'
import { saveRecoveryPassword, signInWithEmail } from './cloudAuth'
import {
  DEMO_PASSWORD_KEY,
  getPasswordValidationError,
  getStudentProfileFieldErrors,
  getStudentProfileValidationError,
  hashStudentPassword,
  verifyStudentPassword,
} from './studentOnboarding.js'
import './profile.css'

const personalFields = [
  ['studentId', 'Register No'], ['applicationNo', 'Application No'], ['name', 'Name'],
  ['gender', 'Gender'], ['birthDate', 'Birth Date', 'date'], ['birthPlace', 'Place of Birth'],
  ['motherTongue', 'Mother Tongue'], ['bloodGroup', 'Blood Group'], ['aadhaar', 'Aadhaar Number'],
  ['email', 'Email', 'email'], ['phone', 'Phone Number', 'tel'], ['address', 'Address'],
]
const academicFields = [['program', 'Program'], ['batch', 'Batch'], ['admissionYear', 'Admission Year']]
const educationFields = [['education', 'Education']]
function baseProfile() {
  return {
    ...Object.fromEntries([...personalFields, ...academicFields, ...educationFields].map(([key]) => [key, USER[key] || (key === 'education' ? [] : '')])),
    photo: USER.photo || '',
  }
}
function displayValue(key, value) {
  if (!value) return '—'
  if (key === 'birthDate' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value.split('-').reverse().join('-')
  if (key === 'education' && Array.isArray(value)) {
    return value.map((item, index) =>
      `${index + 1}. ${item.qualification || '—'} — ${item.institute || '—'}\nYear of passing: ${item.yearOfPassing || '—'} · Percentage/Grade: ${item.percentage || '—'}`
    ).join('\n\n')
  }
  return value
}

export default function StudentProfile({ updateData }) {
  const { user: cloudUser } = useCloudAuth()
  const [profile, setProfile] = useState(baseProfile)
  const [draft, setDraft] = useState(baseProfile)
  const [tab, setTab] = useState('profile')
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [photoError, setPhotoError] = useState('')
  const [photoBusy, setPhotoBusy] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordNotice, setPasswordNotice] = useState('')
  const [passwordBusy, setPasswordBusy] = useState(false)
  const photoInput = useRef(null)
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(profileKey()) || 'null')
      if (stored) {
        const merged = { ...baseProfile(), ...stored, studentId: USER.studentId }
        for (const [key] of [...personalFields, ...academicFields, ...educationFields]) {
          if (!merged[key]) merged[key] = USER[key] || ''
        }
        setProfile(merged)
        setDraft(merged)
      }
    } catch {
      setProfileError('Saved personal information could not be loaded.')
    }
  }, [])
  const profileFieldErrors = editing
    ? getStudentProfileFieldErrors({ ...draft, photo: draft.photo || USER.photo })
    : {}
  function saveProfile(event) {
    event.preventDefault()
    setProfileError('')
    const next = { ...profile, ...draft }
    const validationError = getStudentProfileValidationError({
      ...next,
      photo: next.photo || USER.photo,
    })
    if (validationError) {
      setProfileError(validationError)
      return
    }
    try {
      localStorage.setItem(profileKey(), JSON.stringify(next))
      setCurrentUser({ ...USER, ...next })
      setProfile(next)
      setDraft(next)
      setEditing(false)
      setSaved(true)
      updateData?.((current) => ({ ...current }))
    } catch {
      setProfileError('Your personal information could not be saved. Check browser storage and try again.')
    }
  }
  function cancelProfileEdit() {
    setDraft(profile)
    setProfileError('')
    setEditing(false)
  }
  async function changePassword(event) {
    event.preventDefault()
    setPasswordError('')
    setPasswordNotice('')
    if (!currentPassword) {
      setPasswordError('Enter your current password.')
      return
    }
    const validationError = getPasswordValidationError(newPassword)
    if (validationError) {
      setPasswordError(validationError)
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('The new passwords do not match.')
      return
    }
    if (!globalThis.isSecureContext) {
      setPasswordError('Password changes require a secure HTTPS connection. Use localhost on this device or open an HTTPS address.')
      return
    }
    if (USER.email === DEMO_USER.email && !globalThis.crypto?.subtle) {
      setPasswordError('Secure password hashing is unavailable in this browser. Use an up-to-date browser and try again.')
      return
    }

    setPasswordBusy(true)
    try {
      if (USER.email === DEMO_USER.email) {
        const savedHash = localStorage.getItem(DEMO_PASSWORD_KEY)
        const currentPasswordValid = savedHash
          ? await verifyStudentPassword(currentPassword, savedHash)
          : currentPassword === DEMO_USER.password
        if (!currentPasswordValid) {
          setPasswordError('Your current password is incorrect.')
          return
        }
        localStorage.setItem(DEMO_PASSWORD_KEY, await hashStudentPassword(newPassword))
      } else {
        if (!cloudUser?.email) {
          setPasswordError('Your account session has expired. Sign in again before changing your password.')
          return
        }
        const { error: signInError } = await signInWithEmail(cloudUser.email, currentPassword)
        if (signInError) {
          setPasswordError(signInError.message || 'Your current password is incorrect.')
          return
        }
        const { error: updateError } = await saveRecoveryPassword(newPassword)
        if (updateError) {
          setPasswordError(updateError.message || 'Your password could not be changed.')
          return
        }
      }
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordNotice('Your password has been changed.')
    } catch (reason) {
      setPasswordError(
        reason instanceof Error ? reason.message : 'Your password could not be changed. Please try again.',
      )
    } finally {
      setPasswordBusy(false)
    }
  }
  function storePhoto(photo) {
    const next = { ...profile, photo }
    try {
      localStorage.setItem(profileKey(), JSON.stringify(next))
      setProfile(next)
      setSaved(true)
      setPhotoError('')
    } catch {
      setPhotoError('Your photo could not be saved. Free some browser storage and try again.')
    }
  }
  async function uploadPhoto(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setPhotoError('')
    setPhotoBusy(true)
    try {
      const source = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const image = await new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = source
      })
      const canvas = document.createElement('canvas')
      const scale = Math.min(1, 640 / Math.max(image.width, image.height))
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Photo processing unavailable')
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      storePhoto(canvas.toDataURL('image/jpeg', 0.85))
    } catch {
      setPhotoError('This photo could not be opened. Please choose a JPG, PNG or WebP image.')
    } finally {
      setPhotoBusy(false)
    }
  }
  const fields = tab === 'profile'
    ? personalFields
    : tab === 'education'
      ? educationFields
      : academicFields
  const initials = (profile.name || '').split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()
  return <div className="student-profile-page">
    <section className="student-profile-summary" aria-label="Student profile">
      <div className="student-profile-cover"><img className="portal-logo portal-logo-profile" src={portalLogo} alt="Skill AI"/></div>
      <div className="student-profile-avatar" aria-label={profile.name}>{profile.photo ? <img src={profile.photo} alt={`${profile.name || 'Student'} profile photo`}/> : initials || <UserRound size={36}/>}</div>
      <div className="student-profile-photo-actions">
        <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Student photo" hidden onChange={uploadPhoto}/>
        <Button variant="outline" size="sm" disabled={photoBusy} onClick={() => photoInput.current?.click()}><Camera size={16}/>{photoBusy ? 'Saving photo…' : profile.photo ? 'Change photo' : 'Add photo'}</Button>
        {profile.photo && <Button variant="ghost" size="icon" disabled={photoBusy} aria-label="Remove photo" title="Remove photo" onClick={() => storePhoto('')}><Trash2 size={16}/></Button>}
      </div>
      {photoError && <p className="student-profile-photo-error" role="alert">{photoError}</p>}
      <h1>{profile.name || 'Student'}</h1>
      <p className="student-profile-program">{profile.program || '—'}</p>
      <p className="student-profile-batch">{profile.batch || '—'}</p>
      <div className="student-profile-contact">
        <div><UserRound size={17}/><span>Reg No: {profile.studentId || '—'}</span></div>
        <div><CalendarDays size={17}/><span>Admission Year: {profile.admissionYear || '—'}</span></div>
        <div><Mail size={17}/><span>{profile.email || '—'}</span></div>
        <div><Phone size={17}/><span>{profile.phone || '—'}</span></div>
        <div className="student-profile-address"><MapPin size={18}/><span>{profile.address || '—'}</span></div>
      </div>
      <div className="student-profile-tabs" role="tablist" aria-label="Student information">
        <Button variant="ghost" role="tab" id="personal-tab" aria-controls="student-details" aria-selected={tab === 'profile'} onClick={() => setTab('profile')}><UserRound/>Profile</Button>
        <Button variant="ghost" role="tab" id="education-tab" aria-controls="student-details" aria-selected={tab === 'education'} onClick={() => setTab('education')}><GraduationCap/>Education</Button>
        <Button variant="ghost" role="tab" id="academic-tab" aria-controls="student-details" aria-selected={tab === 'academics'} onClick={() => setTab('academics')}><GraduationCap/>Academics</Button>
        <Button variant="ghost" role="tab" id="security-tab" aria-controls="student-details" aria-selected={tab === 'security'} onClick={() => setTab('security')}><LockKeyhole/>Security</Button>
      </div>
    </section>
    <section className="student-profile-details" id="student-details" role="tabpanel" aria-labelledby={tab === 'profile' ? 'personal-tab' : `${tab}-tab`}>
      <header>
        <h2>{tab === 'profile' ? 'My Profile' : tab === 'education' ? 'Education Information' : tab === 'security' ? 'Security' : 'Academics'}</h2>
        {tab === 'profile' && (editing
          ? <div className="student-profile-actions">
              <Button type="button" variant="outline" onClick={cancelProfileEdit}>Cancel</Button>
              <Button type="submit" form="student-profile-edit-form" className="primary-button"><Save size={15}/> Save information</Button>
            </div>
          : <div className="student-profile-actions">
              <span className="student-profile-readonly">Personal information</span>
              <Button type="button" variant="outline" onClick={() => { setDraft(profile); setProfileError(''); setEditing(true) }}>Edit information</Button>
            </div>)}
      </header>
      {saved && <p className="student-profile-saved" role="status"><Check size={16}/>Changes saved</p>}
      {profileError && <p className="student-profile-error" role="alert">{profileError}</p>}
      {tab === 'security' ? (
        <form className="student-profile-security" onSubmit={changePassword}>
          <p>Change your account password. Your current password is required to confirm the change.</p>
          {passwordError && <p className="student-profile-error" role="alert">{passwordError}</p>}
          {passwordNotice && <p className="student-profile-saved" role="status"><Check size={16}/>{passwordNotice}</p>}
          <label>Current password<input type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)}/></label>
          <label>New password<input type="password" autoComplete="new-password" required value={newPassword} onChange={(event) => setNewPassword(event.target.value)}/></label>
          <small>Use at least 8 characters, including uppercase and lowercase letters, a number, and a special character.</small>
          <label>Confirm new password<input type="password" autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)}/></label>
          <Button className="primary-button" type="submit" disabled={passwordBusy}>{passwordBusy ? 'Updating…' : 'Change password'}</Button>
        </form>
      ) : editing && tab === 'profile' ? (
        <form id="student-profile-edit-form" onSubmit={saveProfile}>
          <dl>{fields.map(([key, label, type]) => {
            const readOnly = ['studentId', 'applicationNo', 'email'].includes(key)
            const fieldError = profileFieldErrors[key]
            return <div key={key}>
              <dt>{label}</dt>
              <dd>
                {key === 'address'
                  ? <textarea aria-label={label} rows={3} value={draft[key] || ''} aria-invalid={Boolean(fieldError)} onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))}/>
                  : <input aria-label={label} type={type || 'text'} inputMode={key === 'aadhaar' ? 'numeric' : undefined} maxLength={key === 'aadhaar' ? 12 : undefined} readOnly={readOnly} value={draft[key] || ''} aria-invalid={Boolean(fieldError)} onChange={(event) => setDraft((current) => ({ ...current, [key]: key === 'aadhaar' ? event.target.value.replace(/\D/g, '').slice(0, 12) : event.target.value }))}/>}
                {fieldError && <small className="student-profile-error">{fieldError}</small>}
              </dd>
            </div>
          })}</dl>
        </form>
      ) : (
        <dl>{fields.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{displayValue(key, profile[key])}</dd></div>)}</dl>
      )}
    </section>
  </div>
}