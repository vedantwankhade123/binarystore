import { useState } from 'react'
import { useAuth } from '../../features/auth/useAuth'
import { useCustomer } from '../../store/customer'
import { useFeedback } from '../../store/feedback'
import { completeProfileSchema } from '../../features/auth/schemas'
import { PasswordInput } from '../auth/AuthFields'
import { ProfileAvatar } from './ProfileAvatar'

export function ProfileSettings(){
 const {profile}=useCustomer(),{user,updateProfile,linkGoogle,setPassword,sendPasswordReset}=useAuth(),{notify}=useFeedback()
 const [draftAvatar,setAvatar]=useState<string|null>(null),[saving,setSaving]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[securityError,setSecurityError]=useState(''),[password,setPasswordValue]=useState(''),[confirm,setConfirm]=useState('')
 const avatar=draftAvatar??profile.avatar??''
 const providers=user?.providerIds||[],googleConnected=providers.includes('google.com'),passwordConnected=providers.includes('password')
 return <>
  <section className="checkout-panel profile-settings" id="settings">
   <h2>Profile settings</h2>
   <form className="profile-form" key={`${user?.id}-${profile.name}-${profile.phone}`} onSubmit={async event=>{
    event.preventDefault();setError('')
    const values=new FormData(event.currentTarget),parsed=completeProfileSchema.safeParse({displayName:String(values.get('displayName')||''),phone:String(values.get('phone')||''),newsletter:profile.preferences.newsletter,orderUpdates:profile.preferences.orderUpdates})
    if(!parsed.success){setError(parsed.error.issues[0].message);return}
    setSaving(true)
    try{await updateProfile({displayName:parsed.data.displayName,phone:parsed.data.phone,avatar:avatar.trim(),preferences:profile.preferences});notify('Profile settings saved')}
    catch(cause){setError(cause instanceof Error?cause.message:'Could not save your profile.')}
    finally{setSaving(false)}
   }}>
    <fieldset disabled={saving} className="profile-settings-fields">
     <div className="profile-picture-controls"><ProfileAvatar src={avatar} name={profile.name} large/><div><h3>Profile photo</h3><button type="button" className="text-button" disabled={!avatar} onClick={()=>setAvatar('')}>Remove photo</button></div></div>
     <div className="form-grid"><label>Display name<input name="displayName" required minLength={2} maxLength={80} autoComplete="name" defaultValue={profile.name}/></label><label>Phone number (optional)<input name="phone" type="tel" maxLength={25} autoComplete="tel" defaultValue={profile.phone}/></label></div>
     <label>Profile photo URL (optional)<input type="url" value={avatar} maxLength={2048} placeholder="https://…" onChange={event=>setAvatar(event.target.value)}/></label>
     {error&&<p className="field-error" role="alert">{error}</p>}
     <button className="button" type="submit">{saving?'Saving…':'Save profile settings'}</button>
    </fieldset>
   </form>
  </section>
  <section className="checkout-panel profile-settings" id="sign-in-methods">
   <h2>Sign-in methods</h2><p className="muted-copy">Use Google or a password to access the same account, orders, and saved items.</p>
   <div className="profile-signin-method"><div><strong>Google</strong><span>{googleConnected?'Connected':'Connect Google to this account'}</span></div>{googleConnected?<span className="profile-connected">Connected</span>:<button className="secondary-button" type="button" disabled={busy} onClick={async()=>{setBusy(true);setSecurityError('');try{await linkGoogle();notify('Google connected to your account')}catch(cause){setSecurityError(cause instanceof Error?cause.message:'Could not connect Google.')}finally{setBusy(false)}}}>{busy?'Please wait…':'Connect Google'}</button>}</div>
   <form className="auth-form auth-settings-form" onSubmit={async event=>{event.preventDefault();setSecurityError('');if(password!==confirm){setSecurityError('Passwords do not match.');return}setBusy(true);try{await setPassword(password);setPasswordValue('');setConfirm('');notify(passwordConnected?'Password updated':'Password sign-in enabled for your account')}catch(cause){setSecurityError(cause instanceof Error?cause.message:'Could not save your password.')}finally{setBusy(false)}}}>
    <fieldset disabled={busy}>
     <h3>{passwordConnected?'Change password':'Add a password'}</h3>
     <PasswordInput label="New password" id="settings-password" autoComplete="new-password" minLength={8} maxLength={128} required registration={{value:password,onChange:event=>setPasswordValue(event.target.value)}}/>
     <PasswordInput label="Confirm new password" id="settings-confirm-password" autoComplete="new-password" maxLength={128} required registration={{value:confirm,onChange:event=>setConfirm(event.target.value)}}/>
     <button type="submit" className="button">{busy?'Please wait…':passwordConnected?'Update password':'Enable password sign-in'}</button>
    </fieldset>
   </form>
   {passwordConnected&&<button className="text-button profile-reset-password" type="button" disabled={busy} onClick={async()=>{setBusy(true);setSecurityError('');try{await sendPasswordReset(user?.email||'');notify('Password reset email sent')}catch(cause){setSecurityError(cause instanceof Error?cause.message:'Could not send reset email.')}finally{setBusy(false)}}}>Send password reset email</button>}
   {securityError&&<p className="field-error" role="alert">{securityError}</p>}
  </section>
 </>
}
