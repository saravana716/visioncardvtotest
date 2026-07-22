import React from 'react';
import Navbar from '../Components/Navbar/Navbar';
import Footers from '../Components/Footer/Footers';
import './Blogs.css';

const Blogs = () => {
    const blogPosts = [
        { id: 1, title: 'How to Choose the Right Frames for Your Face Shape', date: 'March 10, 2026', image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800' },
        { id: 2, title: 'The Benefits of Blue Cut Lenses for Digital Workers', date: 'March 05, 2026', image: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=800' },
        { id: 3, title: 'Summer Eyewear Trends: What to Wear in 2026', date: 'February 28, 2026', image: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800' }
    ];

    return (
        <div className="blogs-page-wrapper">
            <Navbar />
            <div className="blogs-header">
                <h1>Visionkart Blogs</h1>
                <p>Stay updated with the latest in eyewear and eye health.</p>
            </div>
            <div className="blogs-grid scroll-reveal">
                {blogPosts.map(post => (
                    <div key={post.id} className="blog-card">
                        <div className="blog-img">
                            <img src={post.image} alt={post.title} loading="lazy" decoding="async" />
                        </div>
                        <div className="blog-info">
                            <span>{post.date}</span>
                            <h3>{post.title}</h3>
                            <button className="read-more">Read More</button>
                        </div>
                    </div>
                ))}
            </div>
            <Footers />
        </div>
    );
};

export default Blogs;
