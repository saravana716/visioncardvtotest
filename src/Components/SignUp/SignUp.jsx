import React, { useState } from 'react'
import logo from "../../assets/vision_cart_logo.png"
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import "./SignUp.css"
import { auth, db } from '../../firebase.config'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { setDoc, doc } from 'firebase/firestore'
import { friendlyAuthError } from '../../utils/firebaseErrors'

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.email || !formData.password || !formData.firstName || !formData.phoneNumber) {
      toast.error('Please fill in all required fields (including phone number).');
      setLoading(false);
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&*!]).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      toast.error(
        <span>
          <strong>Password must meet the following requirements:</strong><br />
          ✅ At least 8 characters<br />
          ✅ One uppercase letter (A-Z)<br />
          ✅ One lowercase letter (a-z)<br />
          ✅ One number (0-9)<br />
          ✅ One special character (@#$%^&*!)
        </span>,
        { duration: 6000 }
      );
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        createdAt: new Date().toISOString()
      });

      toast.success("Account created successfully!");
      navigate('/');
    } catch (err) {
      console.error("Signup error:", err);
      toast.error(friendlyAuthError(err, 'Could not create your account. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className='signup'>
    <div className='signupLeft'>
        <img src={logo} alt="VisionKart" onClick={() => navigate('/')} style={{cursor: 'pointer'}} />
    </div>
    <div className='signupRight'>
        <form className='signupForm' onSubmit={handleSignUp}>
    <h1>Sign Up</h1>
    <div className='forminput'>
        <h4><label htmlFor="signupFirstName">First name</label></h4>
        <input
          id="signupFirstName"
          type="text"
          name="firstName"
          placeholder='Enter Your First Name'
          value={formData.firstName}
          onChange={handleChange}
          required
        />
    </div>
    <div className='forminput'>
        <h4><label htmlFor="signupLastName">Last name</label></h4>
        <input
          id="signupLastName"
          type="text"
          name="lastName"
          placeholder='Enter Your Last Name'
          value={formData.lastName}
          onChange={handleChange}
        />
    </div>
    <div className='forminput'>
        <h4><label htmlFor="signupEmail">Email</label></h4>
        <input
          id="signupEmail"
          type="email"
          name="email"
          placeholder='Enter Your Email'
          value={formData.email}
          onChange={handleChange}
          required
        />
    </div>
    <div className='forminput' style={{ position: 'relative' }}>
        <h4><label htmlFor="signupPassword">Password</label></h4>
        <input
          id="signupPassword"
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder='Enter Your Password'
          value={formData.password}
          onChange={handleChange}
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
    <div className='forminput'>
        <h4><label htmlFor="signupPhone">Phone Number</label></h4>
        <input
          id="signupPhone"
          type="tel"
          name="phoneNumber"
          placeholder='Enter Your Phone Number (e.g. 9876543210)'
          value={formData.phoneNumber}
          onChange={handleChange}
          required
        />
    </div>

    <div className='formButtons'>
        <button type="submit" disabled={loading}>
          {loading ? 'Signing up...' : 'Sign up'}
        </button>
    </div>
    <div className='formContent'>
        <p className='pname'>By clicking "Sign Up" you accept the Terms of Service and Privacy Policy.</p>
        <p className='pname' style={{textAlign: 'center', marginTop: '10px'}}>
          Already have an account? <span className='link-text' onClick={() => navigate('/login')}>Log in</span>
        </p>
    </div>
        </form>
    </div>
    </div>
    </>
  )
}

export default SignUp
