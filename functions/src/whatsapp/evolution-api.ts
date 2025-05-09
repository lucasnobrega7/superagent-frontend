/**
 * Evolution API WhatsApp Integration
 * Implements integration with Evolution API for sending and receiving WhatsApp messages
 */
import axios, { AxiosInstance } from 'axios';
import { logger } from 'firebase-functions';

export interface EvolutionAPIConfig {
  instanceName: string;
  apiKey: string;
  apiUrl: string;
  webhookUrl?: string;
}

export interface EvolutionAPISendTextParams {
  number: string;
  message: string;
  options?: {
    delay?: number;
    presence?: 'composing' | 'recording' | 'unavailable';
    linkPreview?: boolean;
  };
}

export interface EvolutionAPIMessage {
  id: string;
  from: string;
  fromMe: boolean;
  timestamp: number;
  body: string;
  hasMedia: boolean;
  type: string;
  isGroup: boolean;
}

export interface EvolutionAPIWebhookPayload {
  event: string;
  instance: string;
  data: EvolutionAPIMessage;
}

/**
 * Evolution API client for WhatsApp integration
 */
export class EvolutionAPIWhatsApp {
  private client: AxiosInstance;
  private config: EvolutionAPIConfig;

  /**
   * Create a new Evolution API client
   */
  constructor(config: EvolutionAPIConfig) {
    this.config = config;

    // Create axios instance with base configuration
    this.client = axios.create({
      baseURL: this.config.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.config.apiKey
      }
    });

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      response => response,
      error => {
        logger.error('Evolution API error:', {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Initialize a WhatsApp instance
   */
  async createInstance(): Promise<any> {
    try {
      const response = await this.client.post('/instance/create', {
        instanceName: this.config.instanceName,
        webhook: this.config.webhookUrl,
        webhookEvents: {
          application: true,
          messages: true,
          webhookByEvents: true,
          qrcode: true,
          connection: true,
          status: true
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Error creating Evolution API instance:', error);
      throw error;
    }
  }

  /**
   * Send a text message to a WhatsApp number
   */
  async sendText(params: EvolutionAPISendTextParams): Promise<any> {
    try {
      const response = await this.client.post(`/message/sendText/${this.config.instanceName}`, {
        number: params.number.replace(/\D/g, ''), // Remove non-numeric characters
        text: params.message,
        options: params.options || {}
      });

      return response.data;
    } catch (error) {
      logger.error('Error sending message via Evolution API:', error);
      throw error;
    }
  }

  /**
   * Send an image message
   */
  async sendImage(number: string, imageUrl: string, caption?: string): Promise<any> {
    try {
      const response = await this.client.post(`/message/sendImage/${this.config.instanceName}`, {
        number: number.replace(/\D/g, ''),
        imageUrl: imageUrl,
        caption: caption
      });

      return response.data;
    } catch (error) {
      logger.error('Error sending image via Evolution API:', error);
      throw error;
    }
  }

  /**
   * Process an incoming webhook message from Evolution API
   */
  processWebhook(payload: EvolutionAPIWebhookPayload): EvolutionAPIMessage | null {
    try {
      // Verify this is for the correct instance
      if (payload.instance !== this.config.instanceName) {
        logger.warn('Received webhook for wrong instance', {
          received: payload.instance,
          expected: this.config.instanceName
        });
        return null;
      }

      // Only process message events
      if (payload.event !== 'messages.upsert' && payload.event !== 'message') {
        return null;
      }

      return payload.data;
    } catch (error) {
      logger.error('Error processing Evolution API webhook:', error);
      return null;
    }
  }

  /**
   * Get QR Code for connecting WhatsApp
   */
  async getQrCode(): Promise<{ qrcode: string; status: string }> {
    try {
      const response = await this.client.get(`/instance/qrcode/${this.config.instanceName}`);
      return {
        qrcode: response.data.qrcode,
        status: response.data.status
      };
    } catch (error) {
      logger.error('Error getting QR code from Evolution API:', error);
      throw error;
    }
  }

  /**
   * Check connection status
   */
  async getStatus(): Promise<{ connected: boolean; status: string }> {
    try {
      const response = await this.client.get(`/instance/connectionState/${this.config.instanceName}`);
      return {
        connected: response.data.state === 'open',
        status: response.data.state
      };
    } catch (error) {
      logger.error('Error checking Evolution API status:', error);
      return {
        connected: false,
        status: 'error'
      };
    }
  }
}