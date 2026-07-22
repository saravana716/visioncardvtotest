import React, { useState } from 'react';
import { db } from '../../firebase.config';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';
import './NewsLetter.css';

const NewsLetter = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async (e) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        try {
            // Check if already subscribed
            const q = query(collection(db, 'subscribers'), where('email', '==', email.toLowerCase()));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                toast.error("You're already subscribed!");
                setLoading(false);
                return;
            }

            await addDoc(collection(db, 'subscribers'), {
                email: email.toLowerCase(),
                subscribedAt: serverTimestamp()
            });

            toast.success("Welcome! You're now subscribed.");
            setEmail('');
        } catch (error) {
            console.error("Error subscribing:", error);
            toast.error("Subscription failed. Please try again.");
        }
        setLoading(false);
    };

    return (
        <section className="newsletter-section">
            <div className="newsletter-container">
                <div className="newsletter-content">
                    <h2>Join the Visionkart Insiders</h2>
                    <p>Get exclusive access to new designer collections, private sales, and eyewear trends before anyone else.</p>
                </div>
                <form className="newsletter-form" onSubmit={handleSubscribe}>
                    <div className="input-group">
                        <input 
                            type="email" 
                            placeholder="Your primary email address" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <button type="submit" disabled={loading}>
                            {loading ? 'Joining...' : 'Subscribe'}
                        </button>
                    </div>
                    <p className="privacy-note">By subscribing, you agree to our Privacy Policy and Terms of Service.</p>
                </form>
            </div>
        </section>
    );
};

export default NewsLetter;
