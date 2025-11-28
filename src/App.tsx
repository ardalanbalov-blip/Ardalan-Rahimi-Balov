import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { TwinState, CoachingMode, Message, Insight, Memory } from './types';
import { INITIAL_TWIN_STATE, INITIAL_INSIGHTS, INITIAL_MEMORIES } from './constants';

// FIX: Använder det absoluta aliaset "@/components/" för att lösa sista byggfelet
import TwinAvatar from '@/components/TwinAvatar.tsx'; 
import ChatInterface from '@/components/ChatInterface.tsx';
import InsightsDashboard from '@/components/InsightsDashboard.tsx';
import Marketplace from '@/components/Marketplace.tsx';
import Header from '@/components/Header.tsx';
import Auth from '@/components/Auth.tsx'; 
import LandingPage from '@/components/LandingPage.tsx';

import { generateTwinResponse, analyzeTwinState, generateMetaInsight, scanForCoreMemories, preprocessUserSignal } from './services/geminiService';
import { useUserStore } from './context/UserStoreContext';
import { saveInsight, saveMemory } from './services/dbService';

const App: React.FC = () => {
    const { userId, authReady } = useAuth();
    const { userName } = useUserStore();

    const [view, setView] = useState<'chat' | 'insights' | 'marketplace'>('chat');
    const [messages, setMessages] = useState<Message[]>([]);
    const [twinState, setTwinState] = useState<TwinState>(INITIAL_TWIN_STATE);
    const [insights, setInsights] = useState<Insight[]>(INITIAL_INSIGHTS);
    const [memories, setMemories] = useState<Memory[]>(INITIAL_MEMORIES);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (authReady && userId) {
            console.log(`User ${userId} is authenticated.`);
        }
    }, [authReady, userId]);

    // Funktion för att hantera användarmeddelanden och generera tvillingrespons
    const handleSendMessage = async (userText: string) => {
        if (!userText.trim() || isProcessing) return;

        const newUserMessage: Message = { 
            id: Date.now(), 
            role: 'user', 
            text: userText 
        };
        
        setMessages(prev => [...prev, newUserMessage]);
        setIsProcessing(true);

        try {
            // Steg 1: Förbehandla användarsignalen (språk, ton, intention)
            const signal = await preprocessUserSignal(userText, twinState.mode);

            // Steg 2: Analysera minnesbehov och generera minne om det behövs
            const newMemory = await scanForCoreMemories(userText, memories);
            if (newMemory) {
                setMemories(prev => [...prev, newMemory]);
                if (userId) saveMemory(userId, newMemory);
            }

            // Steg 3: Analysera och uppdatera tvillingens tillstånd (mode) och generera insikt
            const { twinState: updatedState, insight: newInsight } = await analyzeTwinState(
                [...messages, newUserMessage], 
                twinState.mode, 
                signal
            );

            if (newInsight) {
                setInsights(prev => [...prev, newInsight]);
                if (userId) saveInsight(userId, newInsight);
            }

            setTwinState(updatedState);

            // Steg 4: Generera tvillingens svar
            const responseText = await generateTwinResponse(
                userText, 
                [...messages, newUserMessage], 
                updatedState.mode, 
                userName, 
                insights, 
                signal, 
                memories
            );

            const twinResponse: Message = { 
                id: Date.now() + 1, 
                role: 'twin', 
                text: responseText 
            };
            
            setMessages(prev => [...prev, twinResponse]);

        } catch (error) {
            console.error("Fel vid hantering av meddelande:", error);
            const errorResponse: Message = {
                id: Date.now() + 1,
                role: 'twin',
                text: "Jag ber om ursäkt, ett tekniskt fel uppstod. Försök igen."
            };
            setMessages(prev => [...prev, errorResponse]);
        } finally {
            setIsProcessing(false);
        }
    };

    const currentModeConfig = INITIAL_TWIN_STATE.mode === twinState.mode 
        ? null 
        : { name: twinState.mode, icon: '🌟' }; // Mockad ikon

    // Hantera vyer baserat på routing/state
    let content;
    switch (view) {
        case 'chat':
            content = (
                <>
                    <Header currentMode={currentModeConfig} setView={setView} />
                    <div className="flex flex-col md:flex-row h-full overflow-hidden">
                        <TwinAvatar 
                            mode={twinState.mode} 
                            isProcessing={isProcessing} 
                            signal={twinState.lastSignal}
                        />
                        <ChatInterface 
                            messages={messages} 
                            onSendMessage={handleSendMessage} 
                            isProcessing={isProcessing}
                        />
                    </div>
                </>
            );
            break;
        case 'insights':
            content = (
                <>
                    <Header currentMode={currentModeConfig} setView={setView} />
                    <InsightsDashboard 
                        insights={insights} 
                        twinState={twinState} 
                        userName={userName}
                    />
                </>
            );
            break;
        case 'marketplace':
            content = (
                <>
                    <Header currentMode={currentModeConfig} setView={setView} />
                    <Marketplace />
                </>
            );
            break;
        default:
            content = <LandingPage onStartChat={() => setView('chat')} />;
    }

    if (!authReady) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Laddar autentisering...</div>;
    }

    if (!userId) {
        return <Auth />;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col antialiased">
            {content}
        </div>
    );
};

export default App;