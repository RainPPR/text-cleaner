import { useState, useEffect, useCallback } from 'react';
import { CleanerOptions, ProcessingStatus } from '../types';
import { formatBasicText } from '../services/api';

export function useTextCleaner() {
  const [originalText, setOriginalText] = useState('');
  const [processedText, setProcessedText] = useState('');

  // Options State: simple clean options
  const [options, setOptions] = useState<CleanerOptions>({
    removeFigureNotes: true,
    strictNowrap: false,
  });

  // UI state
  const [isDiffMode, setIsDiffMode] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedArea, setCopiedArea] = useState<string | null>(null);

  // Clear state
  const handleClear = useCallback(() => {
    setOriginalText('');
    setProcessedText('');
    setStatus('idle');
    setErrorMessage('');
    setIsDiffMode(false);
    setIsPreviewMode(false);
  }, []);

  // Update specific options
  const updateOption = useCallback(<K extends keyof CleanerOptions>(key: K, value: CleanerOptions[K]) => {
    setOptions((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Copy helper
  const copyToClipboard = useCallback(async (text: string, area: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedArea(area);
      setTimeout(() => setCopiedArea(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }, []);

  // Cleaning action
  const handleClean = useCallback(async () => {
    if (!originalText.trim()) return;

    setErrorMessage('');
    setStatus('cleaning');

    try {
      const basicResult = await formatBasicText({
        text: originalText,
        removeFigureNotes: options.removeFigureNotes,
        strictNowrap: options.strictNowrap,
      });

      setStatus('success');
      setProcessedText(basicResult);
      setIsDiffMode(true);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || '网络错误，请稍后再试');
    }
  }, [originalText, options]);

  // Turn status back to idle after a brief success period
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => setStatus('idle'), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  return {
    originalText,
    setOriginalText,
    processedText,
    setProcessedText,
    options,
    updateOption,
    isDiffMode,
    setIsDiffMode,
    isPreviewMode,
    setIsPreviewMode,
    status,
    errorMessage,
    copiedArea,
    handleClear,
    handleClean,
    copyToClipboard,
  };
}
