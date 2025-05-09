import type { Request, Response } from "express";

/**
 * Utility for handling CORS in Firebase HTTP functions.
 * 
 * @param req - The HTTP request
 * @param res - The HTTP response
 * @returns True if the request is an OPTIONS request (and was handled), false otherwise
 */
export function handleCors(req: Request, res: Response): boolean {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return true;
  }
  
  return false;
}