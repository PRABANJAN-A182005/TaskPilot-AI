import React, { useState } from 'react';
import { voiceService } from '@/services/voice.service';
import { Mic, MicOff, Loader2, Sparkles } from 'lucide-react';

export const VoiceCommand: React.FC = () => {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);

    const toggleListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Speech recognition is not supported in this browser.');
            return;
        }

        if (isListening) {
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
            setFeedback('Listening...');
        };

        recognition.onresult = async (event: any) => {
            const command = event.results[0][0].transcript;
            setIsListening(false);
            setIsProcessing(true);
            setFeedback(`Processing: "${command}"`);

            try {
                const result = await voiceService.processCommand(command);
                setFeedback(result.message);
                setTimeout(() => setFeedback(null), 5000);
            } catch {
                setFeedback('Failed to process command.');
                setTimeout(() => setFeedback(null), 3000);
            } finally {
                setIsProcessing(false);
            }
        };

        recognition.onerror = () => {
            setIsListening(false);
            setFeedback('Error occurred. Try again.');
            setTimeout(() => setFeedback(null), 3000);
        };

        recognition.start();
    };

    return (
        <div className='fixed bottom-6 right-6 z-50 flex flex-col items-end'>
            {feedback && (
                <div className='mb-3 bg-white px-4 py-2 rounded-lg shadow-xl border border-indigo-100 flex items-center space-x-2 animate-in slide-in-from-bottom-2'>
                    <Sparkles className='w-4 h-4 text-indigo-500' />
                    <span className='text-sm font-medium text-gray-700'>{feedback}</span>
                </div>
            )}

            <button
                onClick={toggleListening}
                disabled={isProcessing}
                className={`p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 active:scale-95 ${
                    isListening
                        ? 'bg-red-500 animate-pulse text-white'
                        : isProcessing
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
            >
                {isProcessing ? (
                    <Loader2 className='w-6 h-6 animate-spin' />
                ) : isListening ? (
                    <MicOff className='w-6 h-6' />
                ) : (
                    <Mic className='w-6 h-6' />
                )}
            </button>
        </div>
    );
};
