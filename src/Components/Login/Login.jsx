import React, { useState, useEffect } from 'react'
import logo from "../../assets/vision_cart_logo.png"
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import "../SignUp/SignUp.css"
import { friendlyAuthError } from '../../utils/firebaseErrors'
import { auth, db } from '../../firebase.config'
import { collection, query, where, getDocs } from 'firebase/firestore'
import {
  signInWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  sendPasswordResetEmail
} from 'firebase/auth'

const Login = () => {
  const navigate = useNavigate();
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'phone'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Pre-fill the email from a previous "Remember Me" login so returning users
  // don't retype their address. Only the email is stored — never the password.
  useEffect(() => {
    const saved = localStorage.getItem('vk_remembered_email');
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  // Persist (or clear) the remembered email based on the checkbox.
  const syncRememberedEmail = () => {
    if (rememberMe) {
      localStorage.setItem('vk_remembered_email', email);
    } else {
      localStorage.removeItem('vk_remembered_email');
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      syncRememberedEmail();
      toast.success("Successfully logged in!");
      navigate('/');
    } catch (err) {
      console.error("Email login error:", err);
      toast.error(friendlyAuthError(err, 'Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

    const setupRecaptcha = async () => {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 
          'size': 'invisible' 
        });
        await window.recaptchaVerifier.render();
      }
    };

    const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setupRecaptcha();
      
      const appVerifier = window.recaptchaVerifier;
      let formattedPhone = phoneNumber.trim();
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+91${formattedPhone}`;
      }
      
      // Check if the phone number is registered in Firestore
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("phoneNumber", "==", phoneNumber.trim()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        toast.error("This number is not registered. Please sign up first.");
        setLoading(false);
        return;
      }
      
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      toast.success("OTP sent successfully!");
    } catch (err) {
      console.error("Phone auth error:", err);
      toast.error("Could not send OTP. Please check the number and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      toast.success("Phone verified successfully!");
      navigate('/');
    } catch (err) {
      console.error("OTP verification error:", err);
      toast.error(friendlyAuthError(err, 'OTP verification failed.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address first.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent! Check your inbox.");
      setShowForgotPassword(false);
    } catch (err) {
      console.error("Password reset error:", err);
      toast.error(friendlyAuthError(err, 'Could not send reset email. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className='signup'>
    <div className='signupLeft'>
        <img src={logo} alt="" onClick={() => navigate('/')} style={{cursor: 'pointer'}} />
    </div>
    <div className='signupRight'>
        <div className='signupForm'>
    <h1>{showForgotPassword ? 'Reset Password' : 'Log in'}</h1>
    
    <div className='signup-container'>
    {!showForgotPassword && (
      <div className='login-toggle'>
          <p 
            className={loginMethod === 'email' ? 'active' : ''}
            onClick={() => {setLoginMethod('email'); setConfirmationResult(null);}}
          >Email Login</p>
          <p 
            className={loginMethod === 'phone' ? 'active' : ''}
            onClick={() => setLoginMethod('phone')}
          >Phone Login</p>
      </div>
    )}

    {showForgotPassword ? (
      <form onSubmit={handleResetPassword} className="login-form-inner">
        <div className='forminput'>
            <h4><label htmlFor="resetEmail">Email Address</label></h4>
            <input
              id="resetEmail"
              type="email"
              placeholder='name@example.com'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p>We'll send a password reset link to this email.</p>
        </div>
        <div className='formButtons'>
            <button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <button 
              type="button" 
              className="back-btn" 
              onClick={() => setShowForgotPassword(false)}
              style={{marginTop: '10px', background: 'transparent', color: 'var(--text-color)', border: '1px solid var(--border-color)', width: '100%', padding: '10px', borderRadius: '5px', cursor: 'pointer'}}
            >
              Back to Login
            </button>
        </div>
      </form>
    ) : (
      loginMethod === 'email' ? (
        <form onSubmit={handleEmailLogin} className="login-form-inner">
          <div className='forminput'>
              <h4><label htmlFor="loginEmail">Email Address</label></h4>
              <input
                id="loginEmail"
                type="email"
                placeholder='name@example.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
          </div>
          <div className='forminput' style={{ position: 'relative' }}>
              <h4><label htmlFor="loginPassword">Password</label></h4>
              <input
                id="loginPassword"
                type={showPassword ? "text" : "password"}
                placeholder='Enter your password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: '45px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
                style={{
                    position: 'absolute',
                    right: '15px',
                    top: '42px',
                    cursor: 'pointer',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    background: 'transparent',
                    border: 'none',
                    padding: 0
                }}
              >
                {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
              </button>
          </div>
          <div className='formButtons'>
              <button type="submit" disabled={loading}>
                {loading ? 'Logging in...' : 'Log in'}
              </button>
          </div>
        </form>
      ) : (
        !confirmationResult ? (
          <form onSubmit={handleSendOtp} className="login-form-inner">
            <div className='forminput'>
                <h4><label htmlFor="loginPhone">Phone Number</label></h4>
                <input
                  id="loginPhone"
                  type="tel"
                  placeholder='e.g. 9876543210'
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
                <p>We'll send a 6-digit code to verify your number.</p>
            </div>
            <div className='formButtons'>
                <button type="submit" disabled={loading}>
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="login-form-inner">
            <div className='forminput'>
                <h4><label htmlFor="loginOtp">Enter OTP</label></h4>
                <input
                  id="loginOtp"
                  type="text"
                  placeholder='6-digit code'
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
                <p>Code sent to {phoneNumber}</p>
            </div>
            <div className='formButtons'>
                <button type="submit" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
            </div>
          </form>
        )
      )
    )}
    
    <div id="recaptcha-container"></div>
    
    <div className='formContent'>
        <div className='remember-forgot'>
            {loginMethod === 'email' && !showForgotPassword && (
              <label className='remember-me'>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember Me
              </label>
            )}
            {!showForgotPassword && (
              <p className='link-text' onClick={() => setShowForgotPassword(true)}>Forgot Password?</p>
            )}
        </div>
        <p className='pname' style={{textAlign: 'center', marginTop: '10px'}}>
          Don’t have an account? <span className='link-text' onClick={() => navigate('/signup')}>Sign up</span>
        </p>
    </div>
    </div>
        </div>
    </div>
    </div>
    </>
  )
}

export default Login