import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { walletService } from '../../services/walletService';
import { logInfo, logError } from '../../utils/logger';
import { formatCredits, formatDate } from '../../utils/helpers';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';

const Wallet = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    logInfo('Wallet component mounted');
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [walletRes, statsRes] = await Promise.all([
        walletService.getWallet({ limit: 10 }),
        walletService.getWalletStats({ period: '30d' })
      ]);

      setWalletData(walletRes.data);
      setTransactions(walletRes.data.transactions || []);
      setStats(statsRes.data);

      logInfo('Wallet data loaded successfully');
    } catch (error) {
      logError('Error loading wallet data:', error);
      setError('Failed to load wallet data');
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (type = null) => {
    try {
      setLoading(true);
      const response = await walletService.getTransactions({ 
        type, 
        limit: 20 
      });
      setTransactions(response.data.transactions);
    } catch (error) {
      logError('Error loading transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'earned':
        return '💰';
      case 'spent':
        return '💸';
      case 'pending_earned':
        return '⏳';
      case 'pending_spent':
        return '🔄';
      default:
        return '💳';
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'earned':
        return 'text-green-600';
      case 'spent':
        return 'text-red-600';
      case 'pending_earned':
        return 'text-blue-600';
      case 'pending_spent':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading && !walletData) {
    return (
      <div className="flex justify-center py-8">
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Wallet Overview</h2>
        
        {/* Balance Card */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm">Available Balance</p>
              <p className="text-3xl font-bold">
                {formatCredits(walletData?.balance || 0)} credits
              </p>
            </div>
            <div className="text-4xl opacity-20">
              💰
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {formatCredits(stats.summary.totalEarned)}
              </p>
              <p className="text-sm text-green-600">Total Earned</p>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">
                {formatCredits(stats.summary.totalSpent)}
              </p>
              <p className="text-sm text-red-600">Total Spent</p>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {stats.summary.sessionsCount}
              </p>
              <p className="text-sm text-blue-600">Sessions</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {formatCredits(stats.summary.netChange)}
              </p>
              <p className="text-sm text-purple-600">Net Change</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => {
                setActiveTab('transactions');
                fetchTransactions();
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'transactions'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => {
                setActiveTab('earned');
                fetchTransactions('earned');
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'earned'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Earned
            </button>
            <button
              onClick={() => {
                setActiveTab('spent');
                fetchTransactions('spent');
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'spent'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Spent
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && walletData && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              {walletData.transactions && walletData.transactions.length > 0 ? (
                <div className="space-y-3">
                  {walletData.transactions.slice(0, 5).map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">
                          {getTransactionIcon(transaction.type)}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">
                            {transaction.description}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(transaction.date)}
                          </p>
                        </div>
                      </div>
                      <div className={`font-bold ${getTransactionColor(transaction.type)}`}>
                        {transaction.amount > 0 ? '+' : ''}{formatCredits(Math.abs(transaction.amount))} credits
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">💳</div>
                  <p className="text-gray-500">No recent transactions</p>
                </div>
              )}
            </div>
          )}

          {(activeTab === 'transactions' || activeTab === 'earned' || activeTab === 'spent') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {activeTab === 'earned' ? 'Earned Credits' : 
                   activeTab === 'spent' ? 'Spent Credits' : 'All Transactions'}
                </h3>
                {loading && <Loading size="small" />}
              </div>
              
              {transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">
                          {getTransactionIcon(transaction.type)}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {transaction.description}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{formatDate(transaction.date)}</span>
                            {transaction.relatedUser && (
                              <span>with {transaction.relatedUser.username}</span>
                            )}
                            {transaction.status && (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                                transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                transaction.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {transaction.status}
                              </span>
                            )}
                          </div>
                          {transaction.slot && (
                            <p className="text-xs text-gray-400 mt-1">
                              Category: {transaction.slot.category}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className={`font-bold text-lg ${getTransactionColor(transaction.type)}`}>
                        {transaction.amount > 0 ? '+' : ''}{formatCredits(Math.abs(transaction.amount))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">📊</div>
                  <p className="text-gray-500">
                    No {activeTab === 'earned' ? 'earned' : activeTab === 'spent' ? 'spent' : ''} transactions found
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">💡 Tips to Earn More Credits</h3>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• Create engaging time slots with clear descriptions</li>
          <li>• Offer slots in popular categories like Programming and Design</li>
          <li>• Maintain a high rating by providing excellent sessions</li>
          <li>• Be responsive to booking requests and confirmations</li>
          <li>• Share your expertise in niche skills that are in demand</li>
        </ul>
      </div>
    </div>
  );
};

export default Wallet;