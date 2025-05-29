import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logInfo, logInteraction } from '../utils/logger';

const Home = () => {
  const { user } = useAuth();

  React.useEffect(() => {
    logInfo('Home page loaded');
  }, []);

  const handleGetStartedClick = () => {
    logInteraction({ tagName: 'BUTTON' }, 'get_started_clicked');
  };

  const handleExploreClick = () => {
    logInteraction({ tagName: 'BUTTON' }, 'explore_slots_clicked');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gray-50 overflow-hidden">
        <div className="relative pt-6 pb-16 sm:pb-24">
          <main className="mt-16 mx-auto max-w-7xl px-4 sm:mt-24">
            <div className="text-center">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block xl:inline">Exchange Time,</span>{' '}
                <span className="block text-indigo-600 xl:inline">Share Knowledge</span>
              </h1>
              <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                TimeSlice is a micro time marketplace where you can offer and book short time blocks to exchange skills, advice, and collaboration. Build meaningful connections while earning credits.
              </p>
              <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                {user ? (
                  <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex">
                    <Link
                      to="/dashboard"
                      onClick={handleGetStartedClick}
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                    >
                      Go to Dashboard
                    </Link>
                    <Link
                      to="/explore"
                      onClick={handleExploreClick}
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-lg md:px-10"
                    >
                      Explore Slots
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex">
                    <Link
                      to="/signup"
                      onClick={handleGetStartedClick}
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                    >
                      Get Started
                    </Link>
                    <Link
                      to="/explore"
                      onClick={handleExploreClick}
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-lg md:px-10"
                    >
                      Explore Slots
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              How TimeSlice Works
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Simple, secure, and rewarding way to exchange time and knowledge with others.
            </p>
          </div>

          <div className="mt-10">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    <span className="text-xl">⏰</span>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Offer Time Slots</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Create 30 or 60-minute time slots sharing your skills, from coding help to career advice.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    <span className="text-xl">💰</span>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Credit System</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Earn credits by helping others and spend them to book sessions with mentors.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    <span className="text-xl">🔍</span>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Smart Discovery</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Find the perfect mentor or learning opportunity with our category and skill filters.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    <span className="text-xl">⭐</span>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Review System</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Build your reputation through honest reviews and ratings from the community.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Categories</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Popular Skill Categories
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[
              { name: 'Programming', icon: '💻', count: '245+' },
              { name: 'Design', icon: '🎨', count: '156+' },
              { name: 'Marketing', icon: '📊', count: '89+' },
              { name: 'Business', icon: '💼', count: '134+' },
              { name: 'Writing', icon: '✍️', count: '67+' },
              { name: 'Consulting', icon: '💡', count: '78+' },
              { name: 'Teaching', icon: '🎓', count: '123+' },
              { name: 'Career Advice', icon: '🚀', count: '98+' }
            ].map((category) => (
              <div
                key={category.name}
                className="bg-white rounded-lg p-6 text-center hover:shadow-md transition-shadow duration-200"
              >
                <div className="text-3xl mb-2">{category.icon}</div>
                <h3 className="text-sm font-medium text-gray-900">{category.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{category.count} slots</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-700">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block">Join thousands of learners and mentors.</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-indigo-200">
            Start your journey today with 10 free credits.
          </p>
          <Link
            to="/signup"
            className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 sm:w-auto"
          >
            Sign up for free
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;