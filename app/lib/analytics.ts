import { analytics } from './firebase';
import { logEvent as firebaseLogEvent } from 'firebase/analytics';

/**
 * Logs an event to Firebase Analytics if available
 */
export const logEvent = (eventName: string, eventParams?: Record<string, any>) => {
  try {
    if (analytics) {
      firebaseLogEvent(analytics, eventName, eventParams);
    } else {
      // Analytics not initialized yet, we can queue events for later or just log in dev
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Analytics Event]: ${eventName}`, eventParams);
      }
    }
  } catch (error) {
    console.error('Error logging analytics event:', error);
  }
};

/**
 * Predefined events for consistent tracking
 */
export const AnalyticsEvents = {
  PAGE_VIEW: 'page_view',
  AGENT_CREATED: 'agent_created',
  AGENT_DELETED: 'agent_deleted',
  CHAT_STARTED: 'chat_started',
  CHAT_MESSAGE_SENT: 'chat_message_sent',
  FILE_UPLOADED: 'file_uploaded',
  KNOWLEDGE_SOURCE_ADDED: 'knowledge_source_added',
  ERROR_OCCURRED: 'error_occurred',
  USER_SIGNED_UP: 'user_signed_up',
  USER_SIGNED_IN: 'user_signed_in',
  USER_SIGNED_OUT: 'user_signed_out',
  
  // Usage related events
  MONTHLY_ACTIVE_USER: 'monthly_active_user',
  WEEKLY_ACTIVE_USER: 'weekly_active_user',
  DAILY_ACTIVE_USER: 'daily_active_user',
  FEATURE_USED: 'feature_used'
};

/**
 * Logs a page view event
 */
export const logPageView = (pageName: string, additionalParams?: Record<string, any>) => {
  logEvent(AnalyticsEvents.PAGE_VIEW, {
    page_name: pageName,
    page_path: typeof window !== 'undefined' ? window.location.pathname : '',
    ...additionalParams
  });
};

/**
 * Logs an error event
 */
export const logError = (errorType: string, errorMessage: string, additionalParams?: Record<string, any>) => {
  logEvent(AnalyticsEvents.ERROR_OCCURRED, {
    error_type: errorType,
    error_message: errorMessage,
    ...additionalParams
  });
};

/**
 * Logs an agent chat event
 */
export const logAgentChat = (agentId: string, agentName: string, messageLength: number) => {
  logEvent(AnalyticsEvents.CHAT_MESSAGE_SENT, {
    agent_id: agentId,
    agent_name: agentName,
    message_length: messageLength,
    timestamp: new Date().toISOString()
  });
};

/**
 * Logs a user action
 */
export const logUserAction = (actionType: string, additionalParams?: Record<string, any>) => {
  logEvent(actionType, {
    timestamp: new Date().toISOString(),
    ...additionalParams
  });
};