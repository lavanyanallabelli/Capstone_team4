import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Hero from './Hero';
import Features from './Features';
import Stats from './Stats';
import Community from './Community';
import CTA from './CTA';
import Footer from './Footer';

const Homepage = () => {
    const location = useLocation();

    useEffect(() => {
        // Handle hash scrolling when navigating to homepage with hash
        if (location.hash) {
            const element = document.querySelector(location.hash);
            if (element) {
                // Small delay to ensure the page has rendered
                setTimeout(() => {
                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }, 100);
            }
        }
    }, [location]);

    return (
        <div>
            <Navbar />
            <Hero />
            <Features />
            <Stats />
            <Community />
            <CTA />
            <Footer />
        </div>
    );
};

export default Homepage;
