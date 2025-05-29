import api from './api';
import { logInfo, logError } from '../utils/logger';

export const slotService = {
  // Create new slot
  createSlot: async (slotData) => {
    try {
      logInfo('SlotService: Creating new slot');
      const response = await api.post('/slots', slotData);
      logInfo('SlotService: Slot created successfully');
      return response;
    } catch (error) {
      logError('SlotService: Create slot failed', error.message);
      throw error;
    }
  },

  // Get all available slots
  getSlots: async (params = {}) => {
    try {
      logInfo('SlotService: Fetching available slots', params);
      const response = await api.get('/slots', params);
      return response;
    } catch (error) {
      logError('SlotService: Get slots failed', error.message);
      throw error;
    }
  },

  // Get single slot
  getSlot: async (slotId) => {
    try {
      logInfo('SlotService: Fetching slot', { slotId });
      const response = await api.get(`/slots/${slotId}`);
      return response;
    } catch (error) {
      logError('SlotService: Get slot failed', error.message);
      throw error;
    }
  },

  // Get user's own slots
  getMySlots: async (params = {}) => {
    try {
      logInfo('SlotService: Fetching user slots');
      const response = await api.get('/slots/my-slots', params);
      return response;
    } catch (error) {
      logError('SlotService: Get my slots failed', error.message);
      throw error;
    }
  },

  // Update slot
  updateSlot: async (slotId, slotData) => {
    try {
      logInfo('SlotService: Updating slot', { slotId });
      const response = await api.put(`/slots/${slotId}`, slotData);
      logInfo('SlotService: Slot updated successfully');
      return response;
    } catch (error) {
      logError('SlotService: Update slot failed', error.message);
      throw error;
    }
  },

  // Delete slot
  deleteSlot: async (slotId) => {
    try {
      logInfo('SlotService: Deleting slot', { slotId });
      const response = await api.delete(`/slots/${slotId}`);
      logInfo('SlotService: Slot deleted successfully');
      return response;
    } catch (error) {
      logError('SlotService: Delete slot failed', error.message);
      throw error;
    }
  }
};