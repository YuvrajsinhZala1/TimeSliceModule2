import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logInfo, logInteraction, logError } from '../utils/logger';

// Simple component replacements for missing imports
const InteractiveBackground = ({ mousePosition }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <div 
        className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20 transition-all duration-1000"
        style={{
          transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`
        }}
      />
    </div>
  );
};

const FloatingElements = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-full animate-pulse"
          style={{
            left: `${20 + (i * 15)}%`,
            top: `${10 + (i * 12)}%`,
            animationDelay: `${i * 2}s`,
            animationDuration: `${4 + i}s`
          }}
        />
      ))}
    </div>
  );
};

const ParticleSystem = ({ count = 50 }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {[...Array(Math.min(count, 20))].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white/30 rounded-full animate-bounce"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${2 + Math.random() * 3}s`
          }}
        />
      ))}
    </div>
  );
};

const MorphingShapes = () => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full animate-pulse transform rotate-45" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full animate-pulse transform -rotate-45" />
    </div>
  );
};

const CountingAnimation = ({ end, duration = 2000, className, suffix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    let animationId;

    const animate = (timestamp) => {
      try {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        
        setCount(Math.floor(progress * end));

        if (progress < 1) {
          animationId = requestAnimationFrame(animate);
        }
      } catch (error) {
        logError('CountingAnimation: Animation error', error);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [end, duration]);

  return (
    <span className={className}>
      {count}{suffix}
    </span>
  );
};

const Home = () => {
  const { user } = useAuth();
  const heroRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    logInfo('Enhanced Home page loaded');
    
    const handleMouseMove = (e) => {
      try {
        setMousePosition({ x: e.clientX, y: e.clientY });
      } catch (error) {
        logError('Home: Error tracking mouse position', error);
      }
    };

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      try {
        entries.forEach(entry => {
          setIsVisible(prev => ({
            ...prev,
            [entry.target.id]: entry.isIntersecting
          }));
        });
      } catch (error) {
        logError('Home: Error in intersection observer', error);
      }
    }, observerOptions);

    document.addEventListener('mousemove', handleMouseMove);
    document.querySelectorAll('[data-animate]').forEach(el => {
      if (el.id) observer.observe(el);
    });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      observer.disconnect();
    };
  }, []);

  const handleGetStartedClick = () => {
    logInteraction({ tagName: 'BUTTON' }, 'get_started_clicked');
  };

  const handleExploreClick = () => {
    logInteraction({ tagName: 'BUTTON' }, 'explore_slots_clicked');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Interactive Background */}
      <InteractiveBackground mousePosition={mousePosition} />
      
      {/* Particle System */}
      <ParticleSystem count={50} />
      
      {/* Floating Elements */}
      <FloatingElements />

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40" />
        
        {/* Morphing Background Shapes */}
        <MorphingShapes />
        
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          {/* Main Heading with Gradient Text */}
          <div 
            className="mb-8 transform transition-all duration-1000 ease-out"
            style={{
              transform: `perspective(1000px) rotateX(${mousePosition.y * 0.01}deg) rotateY(${mousePosition.x * 0.01}deg)`
            }}
          >
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black leading-tight mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
                Exchange Time,
              </span>
              <br />
              <span className="bg-gradient-to-r from-pink-400 via-red-400 to-yellow-400 bg-clip-text text-transparent animate-pulse">
                Share Knowledge
              </span>
            </h1>
            
            {/* Glowing subtitle */}
            <p className="text-xl sm:text-2xl lg:text-3xl text-white/80 max-w-4xl mx-auto leading-relaxed">
              A revolutionary micro time marketplace where{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300 font-semibold">
                expertise meets opportunity
              </span>
              {' '}in 30-60 minute sessions
            </p>
          </div>

          {/* Interactive CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={handleGetStartedClick}
                  className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl text-white font-bold text-lg shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/50 hover:shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-purple-700 rounded-2xl blur opacity-0 group-hover:opacity-75 transition-opacity duration-300" />
                  <span className="relative z-10 flex items-center gap-3">
                    <span>Enter Dashboard</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </Link>
                <Link
                  to="/explore"
                  onClick={handleExploreClick}
                  className="group relative px-8 py-4 bg-white/10 backdrop-blur-lg rounded-2xl text-white font-bold text-lg border border-white/20 shadow-xl transform transition-all duration-300 hover:scale-105 hover:bg-white/20"
                >
                  <span className="flex items-center gap-3">
                    <span>🔍</span>
                    <span>Explore Slots</span>
                  </span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/signup"
                  onClick={handleGetStartedClick}
                  className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl text-white font-bold text-lg shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/50 hover:shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-purple-700 rounded-2xl blur opacity-0 group-hover:opacity-75 transition-opacity duration-300" />
                  <span className="relative z-10 flex items-center gap-3">
                    <span>Start Your Journey</span>
                    <span className="group-hover:translate-x-1 transition-transform">✨</span>
                  </span>
                </Link>
                <Link
                  to="/explore"
                  onClick={handleExploreClick}
                  className="group relative px-8 py-4 bg-white/10 backdrop-blur-lg rounded-2xl text-white font-bold text-lg border border-white/20 shadow-xl transform transition-all duration-300 hover:scale-105 hover:bg-white/20"
                >
                  <span className="flex items-center gap-3">
                    <span>🔍</span>
                    <span>Explore First</span>
                  </span>
                </Link>
              </>
            )}
          </div>

          {/* Stats with Counting Animation */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {[
              { number: 1247, label: 'Active Users', suffix: '+' },
              { number: 3891, label: 'Sessions Completed', suffix: '+' },
              { number: 156, label: 'Expert Mentors', suffix: '+' },
              { number: 98, label: 'Satisfaction Rate', suffix: '%' }
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="relative inline-block">
                  <CountingAnimation 
                    end={stat.number} 
                    duration={2000}
                    className="text-3xl md:text-4xl font-black text-white"
                    suffix={stat.suffix}
                  />
                  <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity blur" />
                </div>
                <p className="text-white/60 text-sm mt-2 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/60 animate-bounce">
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm">Discover More</span>
            <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with Glassmorphism */}
      <section id="features" data-animate className="relative py-24 bg-gradient-to-b from-transparent to-black/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Revolutionary Features
              </span>
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Experience the future of knowledge exchange with cutting-edge features designed for modern learners
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: '🚀',
                title: 'Instant Time Slots',
                description: 'Create 30-60 minute sessions in seconds. AI-powered matching connects you with perfect learners.',
                gradient: 'from-cyan-500 to-blue-600'
              },
              {
                icon: '⚡',
                title: 'Smart Credit System',
                description: 'Earn by teaching, spend by learning. Dynamic pricing ensures fair value exchange.',
                gradient: 'from-purple-500 to-pink-600'
              },
              {
                icon: '🎯',
                title: 'AI Discovery Engine',
                description: 'Advanced algorithms match your skills with opportunities. Never miss the perfect session.',
                gradient: 'from-orange-500 to-red-600'
              },
              {
                icon: '🌟',
                title: 'Reputation System',
                description: 'Build your expertise brand with verified reviews and skill endorsements.',
                gradient: 'from-green-500 to-teal-600'
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className={`group relative p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 transform ${
                  isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
                }`}
                style={{ 
                  animationDelay: `${index * 150}ms`,
                  transitionDelay: `${index * 150}ms`
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-300`} />
                
                <div className="relative z-10">
                  <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-purple-400 transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-white/70 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section with 3D Cards */}
      <section id="categories" data-animate className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              <span className="bg-gradient-to-r from-pink-400 to-yellow-400 bg-clip-text text-transparent">
                Trending Categories
              </span>
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Dive into the most popular skill categories and find your perfect learning path
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {[
              { name: 'Programming', icon: '💻', count: '245+', color: 'from-blue-500 to-cyan-500' },
              { name: 'Design', icon: '🎨', count: '156+', color: 'from-purple-500 to-pink-500' },
              { name: 'Marketing', icon: '📊', count: '89+', color: 'from-green-500 to-teal-500' },
              { name: 'Business', icon: '💼', count: '134+', color: 'from-orange-500 to-red-500' },
              { name: 'Writing', icon: '✍️', count: '67+', color: 'from-indigo-500 to-purple-500' },
              { name: 'Consulting', icon: '💡', count: '78+', color: 'from-yellow-500 to-orange-500' },
              { name: 'Teaching', icon: '🎓', count: '123+', color: 'from-pink-500 to-rose-500' },
              { name: 'Career Advice', icon: '🚀', count: '98+', color: 'from-teal-500 to-cyan-500' }
            ].map((category, index) => (
              <div 
                key={index}
                className={`group relative p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-110 transform cursor-pointer ${
                  isVisible.categories ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
                }`}
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  transitionDelay: `${index * 100}ms`,
                  transform: `perspective(1000px) rotateX(${mousePosition.y * 0.005}deg) rotateY(${mousePosition.x * 0.005}deg)`
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${category.color} opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity duration-300`} />
                
                <div className="relative z-10 text-center">
                  <div className="text-4xl mb-3 transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">
                    {category.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300">
                    {category.name}
                  </h3>
                  <p className="text-white/60 text-sm">
                    {category.count} slots
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with Animated Background */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 opacity-90" />
        <div
  className={`absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] animate-pulse`}
></div>

        
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
            Ready to Transform Learning?
          </h2>
          <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
            Join thousands of learners and mentors building the future of knowledge exchange
          </p>
          <p className="text-lg text-white/80 mb-12">
            Start your journey today with <span className="font-bold text-yellow-300">10 free credits</span>
          </p>
          
          <Link
            to="/signup"
            className="group relative inline-block px-12 py-6 bg-white rounded-2xl text-gray-900 font-black text-xl shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-white/50 hover:shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative z-10 flex items-center gap-3">
              <span>Join the Revolution</span>
              <span className="group-hover:translate-x-2 transition-transform">🚀</span>
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;