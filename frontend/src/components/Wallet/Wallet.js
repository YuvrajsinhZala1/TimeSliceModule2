import React, { useState, useEffect } from 'react';
import { walletService } from '../../services/walletService';
import { formatCredits, formatDate } from '../../utils/helpers';
import { logInfo, logError } from '../../utils/logger';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';

const Wallet = () => {
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [transactionFilter, setTransactionFilter] = useState('');

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [walletResponse, transactionsResponse] = await Promise.all([
        walletService.getWallet(),
        walletService.getTransactions({ limit: 20 })
      ]);

      setWalletData(walletResponse.data);
      setTransactions(transactionsResponse.data.transactions);
      
      logInfo('Wallet data loaded successfully');
    } catch (error) {
      logError('Error loading wallet data:', error);
      setError('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (transaction) => {
    if (transaction.type === 'earned' || transaction.amount > 0) {
      return '💰';
    } else {
      return '💸';
    }
  };

  const getTransactionColor = (transaction) => {
    if (transaction.type === 'earned' || transaction.amount > 0) {
      return 'text-green-600';
    } else {
      return 'text-red-600';
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (!transactionFilter) return true;
    return transaction.type === transactionFilter;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="large" text="Loading wallet..." />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="space-y-6">
      {/* Wallet Overview */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Wallet Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current Balance */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-indigo-100">Current Balance</p>
                <p className="text-2xl font-bold">
                  {formatCredits(walletData?.balance || 0)} credits
                </p>
              </div>
            </div>
          </div>

          {/* Total Earned */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-xl">📈</span>
              </div>
              <div className="ml-4">
                <p className="text-gray-600">Total Earned</p>
                <p className="text-xl font-semibold text-green-600">
                  {formatCredits(walletData?.summary?.totalEarned || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Total Spent */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <span className="text-xl">📉</span>
              </div>
              <div className="ml-4">
                <p className="text-gray-600">Total Spent</p>
                <p className="text-xl font-semibold text-red-600">
                  {formatCredits(walletData?.summary?.totalSpent || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Session Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">As Student</h4>
            <p className="text-2xl font-bold text-blue-600">
              {walletData?.summary?.sessionsAsStudent || 0}
            </p>
            <p className="text-sm text-blue-700">sessions attended</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-900 mb-2">As Mentor</h4>
            <p className="text-2xl font-bold text-green-600">
              {walletData?.summary?.sessionsAsMentor || 0}
            </p>
            <p className="text-sm text-green-700">sessions provided</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Recent Activity
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transactions'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Transactions
          </button>
        </nav>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {activeTab === 'overview' ? 'Recent Activity' : 'Transaction History'}
            </h3>
            
            {activeTab === 'transactions' && (
              <select
                value={transactionFilter}
                onChange={(e) => setTransactionFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Transactions</option>
                <option value="earned">Earned Only</option>
                <option value="spent">Spent Only</option>
              </select>
            )}
          </div>
        </div>

        <div className="p-6">
          {filteredTransactions.length > 0 ? (
            <div className="space-y-4">
              {filteredTransactions.slice(0, activeTab === 'overview' ? 5 : undefined).map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">{getTransactionIcon(transaction)}</span>
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        <span>{formatDate(transaction.date)}</span>
                        {transaction.relatedUser && (
                          <span>with {transaction.relatedUser.username}</span>
                        )}
                        {transaction.status && (
                          <span className={`px-2 py-1 rounded-full ${
                            transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                            transaction.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {transaction.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <span className={`text-lg font-semibold ${getTransactionColor(transaction)}`}>
                      {transaction.amount > 0 ? '+' : ''}{formatCredits(Math.abs(transaction.amount))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">💳</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
              <p className="text-gray-500">
                Start booking sessions or offering your time to see transactions here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Credit Info */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-4">How Credits Work</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">Earning Credits:</h4>
            <ul className="space-y-1">
              <li>• Complete mentoring sessions</li>
              <li>• Help others with their questions</li>
              <li>• Share your expertise and knowledge</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Spending Credits:</h4>
            <ul className="space-y-1">
              <li>• Book sessions with mentors</li>
              <li>• Get help with your projects</li>
              <li>• Learn new skills from experts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;