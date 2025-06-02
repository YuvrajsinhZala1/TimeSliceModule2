import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { slotService } from '../../services/slotService';
import { logInfo, logComponent, logError, logPerformance } from '../../utils/logger';
import { formatCredits, truncateText } from '../../utils/helpers';
import CountingAnimation from '../../components/Animations/CountingAnimation';
import ParticleSystem from '../../components/Animations/ParticleSystem';
import MorphingShapes from '../../components/Animations/MorphingShapes';
import { useAnimation } from '../../hooks/useAnimation';
import styles from './Home.module.css';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [featuredSlots, setFeaturedSlots] = useState([]);
  const [stats, setStats] = useState({ totalSlots: 0, totalUsers: 0, totalSessions: 0 });
  const [loading, setLoading] = useState(true);

  // Animation hooks
  const heroAnimation = useAnimation();
  const statsAnimation = useAnimation();
  const featuresAnimation = useAnimation();

  useEffect(() => {
    logComponent('Home', 'mounted');
    const startTime = logPerformance('home_page_load');
    
    fetchHomeData();
    
    return () => {
      logPerformance('home_page_load', startTime);
    };
  }, []);

  const fetchHomeData = async () => {
    try {
      logInfo('Fetching home page data');
      setLoading(true);

      // Fetch featured slots
      const slotsResponse = await slotService.getSlots({ 
        limit: 6, 
        featured: true,
        status: 'available' 
      });
      
      if (slotsResponse.success) {
        setFeaturedSlots(slotsResponse.data.slots || []);
      }

      // Simulate stats (in real app, this would come from an API)
      setStats({
        totalSlots: 1250,
        totalUsers: 890,
        totalSessions: 3400
      });

      logInfo('Home page data loaded successfully');
    } catch (error) {
      logError('Error fetching home page data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  const handleExploreSlots = () => {
    navigate('/explore');
  };

  return (
    <div className={styles.homePage}>
      {/* Background Effects */}
      <div className={styles.backgroundEffects}>
        <ParticleSystem count={30} />
        <MorphingShapes />
      </div>

      {/* Hero Section */}
      <section className={`${styles.heroSection} ${heroAnimation.isVisible ? styles.heroVisible : ''}`} ref={heroAnimation.elementRef}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <div className={styles.heroText}>
              <h1 className={styles.heroTitle}>
                Share Your Time, 
                <span className={styles.gradientText}> Share Your Skills</span>
              </h1>
              <p className={styles.heroSubtitle}>
                TimeSlice is the micro time marketplace where professionals exchange 
                knowledge, skills, and experience in focused sessions.
              </p>
              
              <div className={styles.heroButtons}>
                <button 
                  onClick={handleGetStarted}
                  className={`${styles.primaryButton} ${styles.getStartedButton}`}
                >
                  {user ? 'Go to Dashboard' : 'Get Started'}
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                <button 
                  onClick={handleExploreSlots}
                  className={styles.secondaryButton}
                >
                  Explore Sessions
                </button>
              </div>

              {user && (
                <div className={styles.userWelcome}>
                  <div className={styles.welcomeCard}>
                    <p>Welcome back, <strong>{user.username}</strong>!</p>
                    <div className={styles.userStats}>
                      <span className={styles.credits}>
                        💰 {formatCredits(user.credits)} credits
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.heroVisual}>
              <div className={styles.floatingCards}>
                <div className={`${styles.floatingCard} ${styles.card1}`}>
                  <div className={styles.cardIcon}>💻</div>
                  <h4>Code Review</h4>
                  <p>30 mins • 5 credits</p>
                </div>
                <div className={`${styles.floatingCard} ${styles.card2}`}>
                  <div className={styles.cardIcon}>🎨</div>
                  <h4>Design Feedback</h4>
                  <p>60 mins • 8 credits</p>
                </div>
                <div className={`${styles.floatingCard} ${styles.card3}`}>
                  <div className={styles.cardIcon}>📈</div>
                  <h4>Business Strategy</h4>
                  <p>45 mins • 12 credits</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={`${styles.statsSection} ${statsAnimation.isVisible ? styles.statsVisible : ''}`} ref={statsAnimation.elementRef}>
        <div className={styles.container}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>
                <CountingAnimation 
                  end={stats.totalSlots} 
                  suffix="+"
                  trigger={statsAnimation.isVisible}
                />
              </div>
              <div className={styles.statLabel}>Active Sessions</div>
            </div>
            
            <div className={styles.statCard}>
              <div className={styles.statNumber}>
                <CountingAnimation 
                  end={stats.totalUsers} 
                  suffix="+"
                  trigger={statsAnimation.isVisible}
                />
              </div>
              <div className={styles.statLabel}>Professionals</div>
            </div>
            
            <div className={styles.statCard}>
              <div className={styles.statNumber}>
                <CountingAnimation 
                  end={stats.totalSessions} 
                  suffix="+"
                  trigger={statsAnimation.isVisible}
                />
              </div>
              <div className={styles.statLabel}>Completed Sessions</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`${styles.featuresSection} ${featuresAnimation.isVisible ? styles.featuresVisible : ''}`} ref={featuresAnimation.elementRef}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>Why Choose TimeSlice?</h2>
            <p>The most efficient way to share and learn from industry experts</p>
          </div>

          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h3>Quality Guaranteed</h3>
              <p>All sessions are rated and reviewed by the community to ensure high-quality experiences.</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                  <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                </svg>
              </div>
              <h3>Flexible Timing</h3>
              <p>Book sessions that fit your schedule. From quick 30-minute consultations to in-depth sessions.</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
                </svg>
              </div>
              <h3>Fair Pricing</h3>
              <p>Transparent credit-based system ensures fair compensation for mentors and affordable learning for students.</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-1 16H9V7h9v14z"/>
                </svg>
              </div>
              <h3>Learn & Earn</h3>
              <p>Share your expertise to earn credits, then use those credits to learn from others in the community.</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2.5-9H18V0h-2v2H8V0H6v2H4.5C3.67 2 3 2.67 3 3.5v15C3 19.33 3.67 20 4.5 20h15c.83 0 1.5-.67 1.5-1.5v-15C21 2.67 20.33 2 19.5 2z"/>
                </svg>
              </div>
              <h3>Easy Scheduling</h3>
              <p>Built-in calendar integration makes it simple to schedule and manage your sessions.</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                </svg>
              </div>
              <h3>Secure Platform</h3>
              <p>Safe and secure environment with verified profiles and protected payment processing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Slots Section */}
      {featuredSlots.length > 0 && (
        <section className={styles.featuredSection}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2>Featured Sessions</h2>
              <p>Popular time slots from top-rated professionals</p>
            </div>

            <div className={styles.slotsGrid}>
              {featuredSlots.map((slot, index) => (
                <div key={slot._id} className={styles.slotCard} style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className={styles.slotHeader}>
                    <div className={styles.slotCategory}>{slot.category}</div>
                    <div className={styles.slotPrice}>{slot.cost} credits</div>
                  </div>
                  
                  <h3 className={styles.slotTitle}>{slot.title}</h3>
                  <p className={styles.slotDescription}>
                    {truncateText(slot.description, 100)}
                  </p>
                  
                  <div className={styles.slotMeta}>
                    <div className={styles.slotDuration}>
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                      </svg>
                      <span>{slot.duration} mins</span>
                    </div>
                    
                    <div className={styles.slotRating}>
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                      <span>{slot.rating || 5.0}</span>
                    </div>
                  </div>
                  
                  <div className={styles.slotAuthor}>
                    <div className={styles.authorAvatar}>
                      {slot.createdBy?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span>by {slot.createdBy?.username || 'Anonymous'}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.sectionFooter}>
              <button onClick={handleExploreSlots} className={styles.exploreButton}>
                View All Sessions
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <h2>Ready to Get Started?</h2>
            <p>Join thousands of professionals sharing knowledge and growing together</p>
            
            <div className={styles.ctaButtons}>
              {!user ? (
                <>
                  <Link to="/signup" className={styles.primaryButton}>
                    Create Account
                  </Link>
                  <Link to="/login" className={styles.secondaryButton}>
                    Sign In
                  </Link>
                </>
              ) : (
                <Link to="/dashboard" className={styles.primaryButton}>
                  Go to Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;