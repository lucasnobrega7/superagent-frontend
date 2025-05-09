/**
 * Z-API WhatsApp Integration
 * Implements integration with Z-API for sending and receiving WhatsApp messages
 */
import axios, { AxiosInstance } from 'axios';
import { logger } from 'firebase-functions';

export interface ZAPIConfig {
  instanceId: string;
  token: string;
  apiUrl?: string;
  webhookUrl?: string;
}

export interface ZAPISendTextParams {
  phone: string;
  message: string;
  delayMessage?: number;
  delayTyping?: number;
}

export interface ZAPIMessage {
  id: string;
  phone: string;
  fromMe: boolean;
  timestamp: number;
  text: {
    message: string;
  };
  type: string;
}

export interface ZAPIWebhookPayload {
  phone: string;
  type: string;
  body: ZAPIMessage;
  instanceId: string;
}

/**
 * Z-API client for WhatsApp integration
 */
export class ZAPIWhatsApp {
  private client: AxiosInstance;
  private config: ZAPIConfig;

  /**
   * Create a new Z-API client
   */
  constructor(config: ZAPIConfig) {
    this.config = {
      ...config,
      apiUrl: config.apiUrl || 'https://api.z-api.io'
    };

    // Create axios instance with base configuration
    this.client = axios.create({
      baseURL: `${this.config.apiUrl}/instances/${this.config.instanceId}/token/${this.config.token}`,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      response => response,
      error => {
        logger.error('Z-API error:', {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Send a text message to a WhatsApp number
   * @param params Message parameters
   */
  async sendText(params: ZAPISendTextParams): Promise<{ zaapId: string; messageId: string }> {
    try {
      const response = await this.client.post('/send-text', {
        phone: params.phone.replace(/\D/g, ''), // Remove non-numeric characters
        message: params.message,
        delayMessage: params.delayMessage,
        delayTyping: params.delayTyping
      });

      return response.data;
    } catch (error) {
      logger.error('Error sending message via Z-API:', error);
      throw error;
    }
  }

  /**
   * Send an image message
   * @param phone Recipient phone number
   * @param image Base64 encoded image or URL
   * @param caption Optional caption for the image
   */
  async sendImage(phone: string, image: string, caption?: string): Promise<any> {
    try {
      const isUrl = image.startsWith('http');
      const endpoint = isUrl ? '/send-image' : '/send-image-base64';
      
      const response = await this.client.post(endpoint, {
        phone: phone.replace(/\D/g, ''),
        image: image,
        caption: caption
      });

      return response.data;
    } catch (error) {
      logger.error('Error sending image via Z-API:', error);
      throw error;
    }
  }

  /**
   * Process an incoming webhook message from Z-API
   * @param payload Webhook payload
   */
  processWebhook(payload: ZAPIWebhookPayload): ZAPIMessage | null {
    try {
      // Verify this is for the correct instance
      if (payload.instanceId !== this.config.instanceId) {
        logger.warn('Received webhook for wrong instance ID', {
          received: payload.instanceId,
          expected: this.config.instanceId
        });
        return null;
      }

      // Only process message events
      if (payload.type !== 'message') {
        return null;
      }

      // Return formatted message
      return payload.body;
    } catch (error) {
      logger.error('Error processing Z-API webhook:', error);
      return null;
    }
  }

  /**
   * Get QR Code for connecting WhatsApp
   */
  async getQrCode(): Promise<{ qrcode: string; status: string }> {
    try {
      const response = await this.client.get('/qrcode');
      return response.data;
    } catch (error) {
      logger.error('Error getting QR code from Z-API:', error);
      throw error;
    }
  }

  /**
   * Check connection status
   */
  async getStatus(): Promise<{ connected: boolean; status: string }> {
    try {
      const response = await this.client.get('/status');
      return {
        connected: response.data.connected,
        status: response.data.status
      };
    } catch (error) {
      logger.error('Error checking Z-API status:', error);
      return {
        connected: false,
        status: 'error'
      };
    }
  }
}