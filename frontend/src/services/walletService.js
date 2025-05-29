import api from './api';
import { logInfo, logError } from '../utils/logger';

export const walletService = {
  // Get wallet info
  getWallet: async (params = {}) => {
    try {
      logInfo('WalletService: Fetching wallet info');
      const response = await api.get('/wallet', params);
      return response;
    } catch (error) {
      logError('WalletService: Get wallet failed', error.message);
      throw error;
    }
  },

  // Get transaction history
  getTransactions: async (params = {}) => {
    try {
      logInfo('WalletService: Fetching transactions', params);
      const response = await api.get('/wallet/transactions', params);
      return response;
    } catch (error) {
      logError('WalletService: Get transactions failed', error.message);
      throw error;
    }
  },

  // Get wallet statistics
  getWalletStats: async (params = {}) => {
    try {
      logInfo('WalletService: Fetching wallet stats', params);
      const response = await api.get('/wallet/stats', params);
      return response;
    } catch (error) {
      logError('WalletService: Get wallet stats failed', error.message);
      throw error;
    }
  },

  // Get pending transactions
  getPendingTransactions: async () => {
    try {
      logInfo('WalletService: Fetching pending transactions');
      const response = await api.get('/wallet/pending');
      return response;
    } catch (error) {
      logError('WalletService: Get pending transactions failed', error.message);
      throw error;
    }
  }
};