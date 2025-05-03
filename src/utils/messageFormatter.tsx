
import React from 'react';

/**
 * Formats the message text by removing tips unless specifically requested
 */
export const formatMessage = (text: string) => {
  // Check if the message explicitly requests tips
  const requestsTips = text.toLowerCase().includes('give me tips') || 
                      text.toLowerCase().includes('show me tips') || 
                      text.toLowerCase().includes('need tips') ||
                      text.toLowerCase().includes('want tips');
                      
  // Split the message by "Tips:" to separate the main content from tips
  const parts = text.split(/Tips:|TIPS:|Tips :|TIPS :/i);
  
  // If no tips section or user explicitly requests tips, return normal text
  if (parts.length === 1 || requestsTips) {
    return <div>{text}</div>;
  }
  
  // Process the main content (before "Tips:")
  const mainContent = parts[0].trim();
  
  // Return only the main content without the tips section
  return <div>{mainContent}</div>;
};
