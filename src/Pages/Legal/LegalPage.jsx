import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './LegalPage.css';
import Navbar from '../../Components/Navbar/Navbar';
import Footers from '../../Components/Footer/Footers';
import { MdChevronRight, MdMenuOpen } from 'react-icons/md';

const LegalPage = ({ title, content }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeSection, setActiveSection] = useState("");
    const [showMobileNav, setShowMobileNav] = useState(false);
    const observer = useRef(null);

    const legalLinks = [
        { name: "Terms & Conditions", path: "/terms-and-conditions" },
        { name: "Privacy Policy", path: "/privacy-policy" },
        { name: "Refund & Return Policy", path: "/refund-and-return" },
        { name: "Shipping & Delivery Policy", path: "/shipping-policy" },
        { name: "Prescription Policy", path: "/prescription-policy" },
        { name: "Customer Support Policy", path: "/customer-support" },
        { name: "FAQ", path: "/faq" }
    ];

    useEffect(() => {
        window.scrollTo(0, 0);
        setShowMobileNav(false);
    }, [location.pathname]);

    useEffect(() => {
        // Setup Intersection Observer for dynamic scroll tracking
        const options = { rootMargin: '-100px 0px -60% 0px', threshold: 0 };
        
        observer.current = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        }, options);

        const sections = document.querySelectorAll('.legal-doc-section');
        sections.forEach((section) => observer.current.observe(section));

        return () => observer.current.disconnect();
    }, [content]);

    const slugify = (text) => text.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');

    return (
        <div className="docs-layout-container">
            <Navbar />

            {/* Mobile Policy Selector Toggle */}
            <div className="mobile-policy-toggle" onClick={() => setShowMobileNav(!showMobileNav)}>
                <MdMenuOpen />
                <span>Switch Policy</span>
            </div>

            <div className={`legal-docs-main ${showMobileNav ? 'show-nav' : ''}`}>
                {/* Left: Global Policy Navigation */}
                <aside className="docs-sidebar-nav">
                    <nav>
                        <p className="nav-group-title">Policies</p>
                        {legalLinks.map((link, idx) => (
                            <div 
                                key={idx} 
                                className={`docs-nav-link ${location.pathname === link.path ? 'active' : ''}`}
                                onClick={() => navigate(link.path)}
                            >
                                {link.name}
                            </div>
                        ))}
                    </nav>
                </aside>

                {/* Center: Main Documentation content */}
                <main className="docs-content-flow">
                    <header className="docs-article-header">
                        <div className="docs-breadcrumbs">Legal Center / {title}</div>
                        <h1>{title}</h1>
                        <p className="docs-last-updated">Last modified April 6, 2024</p>
                    </header>

                    <article className="docs-article-body">
                        {content.map((section, idx) => {
                            const sectionId = section.heading ? slugify(section.heading) : `sec-${idx}`;
                            return (
                                <section key={idx} id={sectionId} className="legal-doc-section">
                                    {section.heading && <h2>{section.heading}</h2>}
                                    {section.text && <p>{section.text}</p>}
                                    {section.list && (
                                        <ul className="docs-list">
                                            {section.list.map((item, i) => (
                                                <li key={i}>{item}</li>
                                            ))}
                                        </ul>
                                    )}
                                </section>
                            );
                        })}
                    </article>
                </main>

                {/* Right: Table of Contents (Active Tracking) */}
                <aside className="docs-toc-sidebar">
                    <div className="toc-sticky">
                        <p className="toc-title">On this page</p>
                        <nav>
                            {content.filter(s => s.heading).map((section, idx) => {
                                const sectionId = slugify(section.heading);
                                return (
                                    <a 
                                        key={idx} 
                                        href={`#${sectionId}`}
                                        className={`toc-link ${activeSection === sectionId ? 'active' : ''}`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                    >
                                        {section.heading}
                                    </a>
                                );
                            })}
                        </nav>
                    </div>
                </aside>
            </div>

            <Footers />
        </div>
    );
};

export default LegalPage;
