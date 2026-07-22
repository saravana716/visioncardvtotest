import React, { useState, useEffect } from 'react';
import { FaStar, FaRegStar, FaUserCircle } from 'react-icons/fa';
import { addProductReview, getProductReviews } from '../../services/firestoreService';
import { auth } from '../../firebase.config';
import toast from 'react-hot-toast';
import './ReviewsSection.css';

const ReviewsSection = ({ productId }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(5);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchReviews = async () => {
            const data = await getProductReviews(productId);
            setReviews(data);
            setLoading(false);
        };
        fetchReviews();
    }, [productId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) {
            toast.error("Please login to leave a review");
            return;
        }

        if (comment.trim().length < 5) {
            toast.error("Comment is too short");
            return;
        }

        setSubmitting(true);
        // Phone-OTP accounts have neither displayName nor email, so guard every
        // access (user.email.split(...) crashed for them and wedged the button).
        const reviewData = {
            userId: user.uid,
            userName: user.displayName || user.email?.split('@')[0] || user.phoneNumber || 'Customer',
            rating,
            comment,
            userPhoto: user.photoURL || null
        };

        try {
            const result = await addProductReview(productId, reviewData);
            if (result.success) {
                toast.success("Review submitted!");
                setComment('');
                setRating(5);
                const data = await getProductReviews(productId);
                setReviews(data);
            } else {
                toast.error("Could not submit your review. Please try again.");
            }
        } catch (err) {
            console.error("Review submission failed:", err);
            toast.error("Could not submit your review. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Just now';
        const date = timestamp.toDate();
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const averageRating = reviews.length > 0 
        ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
        : 0;

    return (
        <div className="reviews-section-v2">
            <div className="reviews-header-v2">
                <div className="rev-summary-main">
                    <h2>Customer Reviews</h2>
                    <div className="rating-overview">
                        <span className="avg-num">{averageRating}</span>
                        <div className="avg-stars">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <FaStar key={s} className={s <= averageRating ? 'star filled' : 'star'} />
                            ))}
                        </div>
                        <span className="total-revs">Based on {reviews.length} reviews</span>
                    </div>
                </div>
                
                <div className="review-form-container">
                    <h3>Share your thoughts</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="star-rating-input">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                    type="button"
                                    key={s}
                                    className={s <= (hover || rating) ? 'star-btn filled' : 'star-btn'}
                                    onClick={() => setRating(s)}
                                    onMouseEnter={() => setHover(s)}
                                    onMouseLeave={() => setHover(0)}
                                >
                                    <FaStar />
                                </button>
                            ))}
                        </div>
                        <textarea 
                            placeholder="Tell us about your experience..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            required
                        />
                        <button type="submit" className="submit-rev-btn" disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Post Review'}
                        </button>
                    </form>
                </div>
            </div>

            <div className="reviews-list-v2">
                {loading ? (
                    <div className="rev-loader">Loading reviews...</div>
                ) : reviews.length === 0 ? (
                    <div className="no-reviews-state">
                        <p>No reviews yet. Be the first to share your experience!</p>
                    </div>
                ) : (
                    reviews.map((rev) => (
                        <div key={rev.id} className="review-card-v2 fade-in">
                            <div className="rev-user-info">
                                <div className="user-initials">
                                    {rev.userPhoto ? (
                                        <img src={rev.userPhoto} alt={rev.userName} loading="lazy" decoding="async" />
                                    ) : (
                                        <FaUserCircle />
                                    )}
                                </div>
                                <div className="user-meta">
                                    <strong>{rev.userName}</strong>
                                    <span>{formatDate(rev.createdAt)}</span>
                                </div>
                                <div className="rev-stars">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <FaStar key={s} className={s <= rev.rating ? 'filled' : ''} />
                                    ))}
                                </div>
                            </div>
                            <p className="rev-comment">{rev.comment}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ReviewsSection;
