import { useAuth } from '../../features/auth/useAuth'
import { Link } from 'react-router-dom'
export function AuthStatus(){const {error,user}=useAuth();if(error)return <div className="storage-warning" role="alert">{error}</div>;return user&&!user.emailVerified?<div className="shopping-sync-notice">Verify your email to check out or start your store. <Link className="text-button" to="/auth/verify-email">Verify email</Link></div>:null}
