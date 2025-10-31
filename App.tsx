
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Memory } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import { generateStoryAndImagePrompt, generateImage, editImage } from './services/geminiService';
import { DownloadIcon, CopyIcon, BookOpenIcon, ChatBubbleIcon } from './components/Icons';

// Base64 encoded WAV for a simple car horn sound
const HORN_SOUND_B64 = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

const CarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" fill="currentColor" className="w-24 h-24 text-stone-300 mx-auto">
      <path d="M624 352h-16V243.9c0-12.7-5.1-24.9-14.1-33.9L494 110.1c-9-9-21.2-14.1-33.9-14.1H179.9c-12.7 0-24.9 5.1-33.9 14.1L46.1 210.1c-9 9-14.1 21.2-14.1 33.9V352H16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-32h480v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-32h16c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zM160 272c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48zm320 0c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48z"/>
    </svg>
);

const WelcomeScreen = () => (
    <div className="text-center p-8 bg-white/50 rounded-lg shadow-lg h-full flex flex-col justify-center items-center">
        <CarIcon />
        <h2 className="text-4xl font-bangers text-stone-800 tracking-wider mt-4">Welcome to the Garage!</h2>
        <p className="mt-4 text-stone-600 text-lg max-w-md">What classic ride takes you back?</p>
        <p className="mt-2 text-sm text-stone-500 max-w-md">Tell me about your favorite car, like "My first car was a '68 Camaro" or "a '59 Cadillac cruising at sunset".</p>
    </div>
);

const Loader = ({ message }: { message: string }) => (
    <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
        <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-white font-bold text-lg">{message}</p>
    </div>
);

const App: React.FC = () => {
    const [memories, setMemories] = useLocalStorage<Memory[]>('classic-rides-memories', []);
    const [activeMemory, setActiveMemory] = useState<Memory | null>(null);
    const [view, setView] = useState<'chat' | 'scrapbook'>('chat');
    
    const [userInput, setUserInput] = useState('');
    const [editPrompt, setEditPrompt] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    const hornAudioRef = useRef<HTMLAudioElement>(null);

    const playHorn = () => {
        if (hornAudioRef.current) {
            hornAudioRef.current.currentTime = 0;
            hornAudioRef.current.play().catch(e => console.error("Audio play failed:", e));
        }
    };

    const handleNewMemory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim()) return;

        setIsLoading(true);
        setLoadingMessage("Gramps is tinkering in the garage...");
        setError(null);
        setActiveMemory(null);

        try {
            const { story, funFacts, imagePrompt } = await generateStoryAndImagePrompt(userInput);
            
            setLoadingMessage("Getting the old camera ready...");
            const imageUrl = await generateImage(imagePrompt);
            
            const fullStory = `${story}\n\n**Fun Facts:**\n- ${funFacts.join('\n- ')}`;

            const newMemory: Memory = {
                id: new Date().toISOString(),
                userPrompt: userInput,
                story: fullStory,
                imagePrompt,
                imageUrl,
            };

            setActiveMemory(newMemory);
            playHorn();
            setUserInput('');
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditImage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editPrompt.trim() || !activeMemory) return;

        setIsLoading(true);
        setLoadingMessage("Adding a new coat of paint...");
        setError(null);

        try {
            const newImageUrl = await editImage(activeMemory.imageUrl, editPrompt);
            setActiveMemory(prev => prev ? { ...prev, imageUrl: newImageUrl } : null);
            playHorn();
            setEditPrompt('');
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const saveActiveMemory = () => {
        if (activeMemory && !memories.some(m => m.id === activeMemory.id)) {
            setMemories(prev => [activeMemory, ...prev]);
        } else if (activeMemory) {
            // Update existing memory if it was edited
            setMemories(prev => prev.map(m => m.id === activeMemory.id ? activeMemory : m));
        }
    };
    
    useEffect(() => {
      if (activeMemory) {
        saveActiveMemory();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeMemory?.imageUrl]);


    const handleDownload = () => {
        if (!activeMemory) return;
        const link = document.createElement('a');
        link.href = activeMemory.imageUrl;
        link.download = `${activeMemory.userPrompt.slice(0, 20).replace(/\s+/g, '_')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCopy = () => {
        if (!activeMemory) return;
        navigator.clipboard.writeText(activeMemory.story);
        alert('Story copied to clipboard!');
    };
    
    const selectMemoryFromScrapbook = (memory: Memory) => {
        setActiveMemory(memory);
        setView('chat');
    }

    return (
        <div className="min-h-screen bg-amber-50 text-stone-800 flex flex-col items-center p-4" style={{
            backgroundImage: `radial-gradient(circle, rgba(212, 201, 182, 0.2) 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}>
            <div className="w-full max-w-6xl mx-auto flex flex-col h-full">
                {isLoading && <Loader message={loadingMessage} />}
                <header className="text-center my-4">
                    <h1 className="text-6xl md:text-8xl font-bangers text-stone-800 tracking-wider">Classic Rides Memory Lane</h1>
                </header>
                
                <div className="bg-stone-800 p-2 rounded-t-lg flex justify-center gap-2">
                    <button
                        onClick={() => setView('chat')}
                        className={`px-4 py-2 text-sm font-bold rounded flex items-center gap-2 transition-colors ${view === 'chat' ? 'bg-amber-400 text-stone-900' : 'bg-stone-700 text-amber-100 hover:bg-stone-600'}`}
                    >
                        <ChatBubbleIcon className="w-5 h-5" />
                        Garage Chat
                    </button>
                    <button
                        onClick={() => setView('scrapbook')}
                        className={`px-4 py-2 text-sm font-bold rounded flex items-center gap-2 transition-colors ${view === 'scrapbook' ? 'bg-amber-400 text-stone-900' : 'bg-stone-700 text-amber-100 hover:bg-stone-600'}`}
                    >
                         <BookOpenIcon className="w-5 h-5" />
                        Memory Scrapbook ({memories.length})
                    </button>
                </div>

                <main className="flex-grow bg-white/70 backdrop-blur-sm shadow-2xl rounded-b-lg p-4 md:p-6">
                    {view === 'chat' ? (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                         {/* Left Side: Story and Input */}
                         <div className="flex flex-col">
                             <div className="flex-grow p-4 bg-amber-50 rounded-lg shadow-inner overflow-y-auto min-h-[300px]">
                                 {!activeMemory && <WelcomeScreen />}
                                 {activeMemory && (
                                     <div>
                                         <h3 className="font-bold text-lg text-stone-700">Gramps remembers...</h3>
                                         <p className="text-sm text-stone-500 mb-2">About: "{activeMemory.userPrompt}"</p>
                                         <div className="prose prose-stone max-w-none whitespace-pre-wrap">{activeMemory.story}</div>
                                     </div>
                                 )}
                             </div>
                             <form onSubmit={handleNewMemory} className="mt-4 flex gap-2">
                                 <input
                                     type="text"
                                     value={userInput}
                                     onChange={(e) => setUserInput(e.target.value)}
                                     placeholder="Talk about a classic car..."
                                     className="flex-grow p-3 border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
                                     disabled={isLoading}
                                 />
                                 <button type="submit" disabled={isLoading} className="bg-stone-800 text-white font-bold py-3 px-6 rounded-lg hover:bg-stone-700 transition-colors disabled:bg-stone-400">
                                     Evoke
                                 </button>
                             </form>
                         </div>
 
                         {/* Right Side: Image and Edit */}
                         <div className="flex flex-col items-center justify-center bg-stone-200 p-4 rounded-lg shadow-inner">
                            {activeMemory ? (
                                <>
                                 <div className="w-full max-w-md aspect-square bg-stone-300 rounded-lg overflow-hidden shadow-lg flex items-center justify-center">
                                     <img src={activeMemory.imageUrl} alt={activeMemory.imagePrompt} className="w-full h-full object-contain" />
                                 </div>
                                 <div className="w-full max-w-md mt-4">
                                     <form onSubmit={handleEditImage} className="flex gap-2">
                                         <input
                                             type="text"
                                             value={editPrompt}
                                             onChange={(e) => setEditPrompt(e.target.value)}
                                             placeholder="What should we change?"
                                             className="flex-grow p-3 border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
                                             disabled={isLoading}
                                         />
                                         <button type="submit" disabled={isLoading} className="bg-amber-500 text-stone-900 font-bold py-3 px-6 rounded-lg hover:bg-amber-600 transition-colors disabled:bg-amber-300">
                                             Remix
                                         </button>
                                     </form>
                                     <div className="flex gap-2 mt-2">
                                         <button onClick={handleDownload} className="flex-1 bg-white border border-stone-300 text-stone-700 p-2 rounded-lg flex items-center justify-center gap-2 hover:bg-stone-100 transition-colors">
                                             <DownloadIcon className="w-5 h-5"/> Download
                                         </button>
                                         <button onClick={handleCopy} className="flex-1 bg-white border border-stone-300 text-stone-700 p-2 rounded-lg flex items-center justify-center gap-2 hover:bg-stone-100 transition-colors">
                                             <CopyIcon className="w-5 h-5" /> Copy Story
                                         </button>
                                     </div>
                                 </div>
                                </>
                            ) : (
                                <div className="text-center text-stone-500">
                                    <p>Your generated image will appear here.</p>
                                </div>
                            )}
                         </div>
                     </div>
                    ) : (
                        <div>
                             <h2 className="text-3xl font-bangers text-stone-800 tracking-wider mb-4">Memory Scrapbook</h2>
                             {memories.length === 0 ? (
                                <p className="text-stone-600">No memories saved yet. Go back to the garage and chat with Gramps!</p>
                             ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {memories.map(memory => (
                                        <div key={memory.id} onClick={() => selectMemoryFromScrapbook(memory)} className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform hover:scale-105 transition-transform">
                                            <img src={memory.imageUrl} alt={memory.userPrompt} className="w-full h-48 object-cover" />
                                            <div className="p-3">
                                                <p className="font-bold text-sm truncate">{memory.userPrompt}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             )}
                        </div>
                    )}

                    {error && (
                      <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg" role="alert">
                        <strong className="font-bold">Oh, shoot! </strong>
                        <span className="block sm:inline">{error}</span>
                      </div>
                    )}
                </main>
            </div>
            <audio ref={hornAudioRef} src={HORN_SOUND_B64} preload="auto"></audio>
        </div>
    );
};

export default App;
