import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { walletService } from '../../services/walletService';
import { logInfo, logError } from '../../utils/logger';
import { formatCredits, formatDate } from '../../utils/helpers';
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
        walletService.getTransactions({ limit: 10 })
      ]);

      setWalletData(walletResponse.data);
      setTransactions(transactionsResponse.data.transactions);

      logInfo('Wallet data loaded successfully');
    } catch (error) {
      logError('Error loading wallet data:', error);
      setError('Failed to load wallet data');
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (type = '') => {
    try {
      const response = await walletService.getTransactions({ 
        type, 
        limit: 20 
      });
      setTransactions(response.data.transactions);
    } catch (error) {
      logError('Error loading transactions:', error);
      toast.error('Failed to load transactions');
    }
  };

  const handleFilterChange = (type) => {
    setTransactionFilter(type);
    fetchTransactions(type);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <Loading size="large" text="Loading wallet..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Overview */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Wallet Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current Balance */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Current Balance</p>
                <p className="text-3xl font-bold text-green-700">
                  {formatCredits(walletData?.balance || 0)}
                </p>
                <p className="text-xs text-green-600">credits</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">💰</span>
              </div>
            </div>
          </div>

          {/* Total Earned */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Earned</p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatCredits(walletData?.summary?.totalEarned || 0)}
                </p>
                <p className="text-xs text-blue-600">
                  {walletData?.summary?.sessionsAsMentor || 0} sessions
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">📈</span>
              </div>
            </div>
          </div>

          {/* Total Spent */}
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total Spent</p>
                <p className="text-2xl font-bold text-purple-700">
                  {formatCredits(walletData?.summary?.totalSpent || 0)}
                </p>
                <p className="text-xs text-purple-600">
                  {walletData?.summary?.sessionsAsStudent || 0} sessions
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">📊</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
            
            {/* Filter Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleFilterChange('')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors duration-200 ${
                  transactionFilter === '' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleFilterChange('earned')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors duration-200 ${
                  transactionFilter === 'earned' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Earned
              </button>
              <button
                onClick={() => handleFilterChange('spent')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors duration-200 ${
                  transactionFilter === 'spent' 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Spent
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">💳</div>
              <p className="text-gray-500">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div 
                  key={transaction._id} 
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'earned' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      <span className="text-lg">
                        {transaction.type === 'earned' ? '💰' : '💸'}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{formatDate(transaction.date)}</span>
                        {transaction.relatedUser && (
                          <span>with {transaction.relatedUser.username}</span>
                        )}
                        {transaction.slot && (
                          <span className="px-2 py-1 bg-gray-200 rounded-full">
                            {transaction.slot.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{formatCredits(Math.abs(transaction.amount))}
                    </p>
                    <p className="text-xs text-gray-500">
                      {transaction.status && transaction.status !== 'completed' && (
                        <span className="capitalize">{transaction.status}</span>
                      )}
                      {transaction.refunded && (
                        <span className="text-yellow-600">Refunded</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;