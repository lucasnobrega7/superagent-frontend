import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

/**
 * Firebase Functions client for interacting with Cloud Functions
 */
export const FirebaseFunctionsClient = {
  /**
   * Call the helloWorld function
   */
  helloWorld: async () => {
    const helloWorldFunction = httpsCallable(functions, 'helloWorld');
    const result = await helloWorldFunction();
    return result.data;
  },

  /**
   * Call custom Firebase functions from your client
   * @param functionName The name of the function to call
   * @param data The data to pass to the function
   */
  callFunction: async <T = any>(functionName: string, data?: any): Promise<T> => {
    const callable = httpsCallable<any, T>(functions, functionName);
    const result = await callable(data || {});
    return result.data;
  },
};

export default FirebaseFunctionsClient;