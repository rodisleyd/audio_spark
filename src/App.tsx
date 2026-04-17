/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AudioLines, 
  Play, 
  Pause, 
  Volume2, 
  Settings2, 
  Sparkles,
  RotateCcw,
  Waves,
  Mic2,
  Download,
  Save,
  Trash2,
  Bookmark
} from 'lucide-react';
import { generateSpeech, VoiceName } from './lib/gemini';
import { pcmToWav } from './lib/audio';

const VOICES: { id: VoiceName; label: string; desc: string }[] = [
  { id: 'Kore', label: 'Kore', desc: 'Clear & Professional' },
  { id: 'Puck', label: 'Puck', desc: 'Playful & Energetic' },
  { id: 'Charon', label: 'Charon', desc: 'Deep & Resonant' },
  { id: 'Fenrir', label: 'Fenrir', desc: 'Bold & Authoritative' },
  { id: 'Zephyr', label: 'Zephyr', desc: 'Soft & Ethereal' },
];

const EMOTIONS = [
  { id: 'padrão', label: 'Padrão', icon: '⎯' },
  { id: 'cheerfully', label: 'Alegria', icon: '😊' },
  { id: 'sadly', label: 'Tristeza', icon: '😢' },
  { id: 'euphorically', label: 'Eufórico', icon: '🤩' },
  { id: 'sleepily', label: 'Com Sono', icon: '🥱' },
  { id: 'angrily', label: 'Raiva', icon: '😠' },
  { id: 'furiously', label: 'Furioso', icon: '🤬' },
  { id: 'curiously', label: 'Curioso', icon: '🤔' },
  { id: 'whispering', label: 'Sussurrando', icon: '🤫' },
  { id: 'fearfully', label: 'Medo', icon: '😨' },
  { id: 'terrified', label: 'Pavor', icon: '😱' },
  { id: 'grumpily', label: 'Ranzinza', icon: '😒' },
  { id: 'shouting', label: 'Gritando', icon: '😫' },
  { id: 'machiavellian', label: 'Maquiavélico', icon: '😈' },
  { id: 'swaggering', label: 'Fanfarrão', icon: '🤠' },
  { id: 'sweetly', label: 'Doce', icon: '🍬' },
  { id: 'gentle', label: 'Meiga', icon: '🌸' },
  { id: 'like a monster', label: 'Monstro', icon: '👹' },
  { id: 'guttural', label: 'Gutural', icon: '🗣️' },
];

const PROFILES = [
  { id: '', label: 'Adulto', icon: '👤' },
  { id: 'young child', label: 'Criança', icon: '👶' },
  { id: 'very old person', label: 'Idoso', icon: '👴' },
];

interface Preset {
  id: string;
  name: string;
  voice: VoiceName;
  emotion: string | string[];
  profile: string;
  pitch: number;
  raspiness: number;
}

export default function App() {
  const [text, setText] = useState('Olá! Estou testando a conversão de texto em voz do Gemini.');
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Kore');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [selectedProfile, setSelectedProfile] = useState('');
  const [pitch, setPitch] = useState(50);
  const [raspiness, setRaspiness] = useState(0);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load presets on mount
  useEffect(() => {
    const saved = localStorage.getItem('audio-spark-presets');
    if (saved) {
      try {
        setPresets(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse presets', e);
      }
    }
  }, []);

  const savePreset = () => {
    setNewPresetName('');
    setIsModalOpen(true);
  };

  const confirmSavePreset = () => {
    if (!newPresetName.trim()) return;

    const newPreset: Preset = {
      id: Date.now().toString(),
      name: newPresetName.trim(),
      voice: selectedVoice,
      emotion: selectedEmotions,
      profile: selectedProfile,
      pitch,
      raspiness
    };

    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem('audio-spark-presets', JSON.stringify(updated));
    setIsModalOpen(false);
  };

  const deletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    localStorage.setItem('audio-spark-presets', JSON.stringify(updated));
  };

  const loadPreset = (preset: Preset) => {
    setSelectedVoice(preset.voice);
    const emo = Array.isArray(preset.emotion) ? preset.emotion : (preset.emotion ? [preset.emotion] : []);
    setSelectedEmotions(emo);
    setSelectedProfile(preset.profile);
    setPitch(preset.pitch);
    setRaspiness(preset.raspiness);
  };

  const resetSettings = () => {
    setSelectedVoice('Kore');
    setSelectedEmotions([]);
    setSelectedProfile('');
    setPitch(50);
    setRaspiness(0);
  };

  const handleGenerate = async () => {
    if (!text.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const base64 = await generateSpeech(text, selectedVoice, {
        emotion: selectedEmotions,
        profile: selectedProfile,
        pitch,
        raspiness
      });
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      // Gemini TTS returns raw PCM16 data. We need to wrap it in a WAV header
      // so the browser's <audio> element can play it.
      const blob = pcmToWav(bytes, 24000);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (error) {
      console.error('TTS Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const downloadAudio = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `gemini-tts-${selectedVoice.toLowerCase()}.wav`;
    a.click();
  };

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  return (
    <>
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#E6E6E6]">
        <div className="w-full max-w-2xl hardware-card p-0 overflow-hidden flex flex-col md:flex-row shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
          
          {/* Left Control Panel */}
          <div className="md:w-72 border-b md:border-b-0 md:border-r border-[#2a2b2f] p-6 space-y-6 overflow-y-auto max-h-[80vh] md:max-h-none scrollbar-hide">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 text-[#F27D26]">
                  <AudioLines size={18} />
                  <span className="font-bold tracking-tight text-white uppercase text-xs">Engine</span>
                </div>
                <button 
                  onClick={resetSettings}
                  title="Resetar Configurações"
                  className="text-[#8E9299] hover:text-[#F27D26] transition-colors p-1"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
              <p className="mono-label">Gemini 3.1 Advanced TTS</p>
            </div>

            {/* Presets / Favorites */}
            {presets.length > 0 && (
              <div className="space-y-3">
                <span className="mono-label flex items-center gap-2">
                  <Bookmark size={12} />
                  Minhas Vozes
                </span>
                <div className="grid grid-cols-1 gap-1 max-h-[120px] overflow-y-auto scrollbar-hide">
                  {presets.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => loadPreset(p)}
                      className="flex items-center justify-between group bg-[#1a1b1e] border border-[#2a2b2f] hover:border-[#F27D26] px-3 py-2 rounded-lg cursor-pointer transition-all"
                    >
                      <span className="text-[10px] text-[#8E9299] group-hover:text-white truncate pr-2">
                        {p.name}
                      </span>
                      <button 
                        onClick={(e) => deletePreset(p.id, e)}
                        className="text-[#3a3b40] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <span className="mono-label flex items-center gap-2">
                <Settings2 size={12} />
                Prebuilt Voice
              </span>
              <div className="grid grid-cols-1 gap-1">
                {VOICES.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => setSelectedVoice(voice.id)}
                    className={`w-full px-3 py-2 rounded-lg text-left transition-all group border ${
                      selectedVoice === voice.id 
                        ? 'bg-[#F27D26] text-white border-[#F27D26] shadow-lg' 
                        : 'bg-[#1a1b1e] text-[#8E9299] border-[#2a2b2f] hover:bg-[#222327]'
                    }`}
                  >
                    <div className="font-semibold text-xs">{voice.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <span className="mono-label flex items-center gap-2">
                <Mic2 size={12} />
                Vocal Profile
              </span>
              <div className="flex gap-1">
                {PROFILES.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => setSelectedProfile(profile.id)}
                    className={`flex-1 p-2 rounded-lg text-[10px] flex flex-col items-center gap-1 border transition-all ${
                      selectedProfile === profile.id 
                        ? 'bg-[#F27D26] text-white border-[#F27D26]' 
                        : 'bg-[#1a1b1e] text-[#8E9299] border-[#2a2b2f]'
                    }`}
                  >
                    <span className="text-sm">{profile.icon}</span>
                    <span className="font-medium">{profile.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="mono-label uppercase">Tone (Grave - Agudo)</span>
                  <span className="text-[10px] text-[#F27D26] font-mono">{pitch}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={pitch} 
                  onChange={(e) => setPitch(parseInt(e.target.value))}
                  className="w-full accent-[#F27D26] h-1 bg-[#1a1b1e] rounded-lg cursor-pointer" 
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="mono-label uppercase">Raspiness (Rouca)</span>
                  <span className="text-[10px] text-[#F27D26] font-mono">{raspiness}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={raspiness} 
                  onChange={(e) => setRaspiness(parseInt(e.target.value))}
                  className="w-full accent-[#F27D26] h-1 bg-[#1a1b1e] rounded-lg cursor-pointer" 
                />
              </div>
            </div>

            <div className="space-y-3">
              <span className="mono-label flex items-center gap-2">
                <Sparkles size={12} />
                Acting / Emotion
              </span>
              <div className="grid grid-cols-2 gap-1 overflow-y-auto max-h-[160px] pr-1 scrollbar-hide">
                {EMOTIONS.map((emotion) => {
                  const isSelected = emotion.id === 'padrão' 
                    ? selectedEmotions.length === 0 
                    : selectedEmotions.includes(emotion.id);
                    
                  return (
                    <button
                      key={emotion.id}
                      onClick={() => {
                        if (emotion.id === 'padrão') {
                          setSelectedEmotions([]);
                        } else {
                          setSelectedEmotions(prev => 
                            prev.includes(emotion.id)
                              ? prev.filter(e => e !== emotion.id)
                              : [...prev, emotion.id]
                          );
                        }
                      }}
                      className={`p-2 rounded-lg text-left transition-all text-[9px] flex items-center gap-2 border ${
                        isSelected 
                          ? 'bg-[#F27D26] text-white border-[#F27D26]' 
                          : 'bg-[#1a1b1e] text-[#8E9299] border-[#2a2b2f] hover:border-[#F27D26]/50'
                      }`}
                    >
                      <span>{emotion.icon}</span>
                      <span className="font-medium truncate">{emotion.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={savePreset}
                className="w-full h-10 border border-[#2a2b2f] text-[#8E9299] hover:text-white hover:border-[#F27D26] hover:bg-[#1a1b1e] rounded-lg flex items-center justify-center gap-2 text-[10px] font-bold transition-all uppercase tracking-wider"
              >
                <Save size={14} />
                Salvar Configuração
              </button>
            </div>

            <div className="pt-4">
               <div className="h-[2px] w-full bg-[#2a2b2f] relative overflow-hidden">
                 {isGenerating && (
                   <motion.div 
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                      className="absolute inset-0 bg-[#F27D26]" 
                   />
                 )}
               </div>
            </div>
          </div>

          {/* Right Work Area */}
          <div className="flex-1 p-8 flex flex-col bg-[#0d0e11]">
            <div className="mb-6 flex justify-between items-end">
              <div>
                <h2 className="text-white font-bold text-2xl tracking-tighter">Audio Spark</h2>
                <p className="text-[#8E9299] text-xs uppercase tracking-widest mt-1">Experimental TTS Lab</p>
              </div>
              <Sparkles className="text-[#F27D26]" size={24} />
            </div>

            <div className="flex-1 relative mb-8">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Digite o texto que deseja converter em voz..."
                className="w-full h-full bg-[#1a1b1e] text-white p-6 rounded-xl border border-[#2a2b2f] focus:outline-none focus:border-[#F27D26] resize-none transition-colors font-sans leading-relaxed text-sm placeholder:text-[#3a3b40]"
              />
              <div className="absolute top-4 right-4 text-[#3a3b40] font-mono text-[10px]">
                {text.length} chars
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !text.trim()}
                  className={`flex-1 h-14 rounded-xl flex items-center justify-center gap-3 font-bold transition-all ${
                    isGenerating 
                      ? 'bg-[#1a1b1e] text-[#F27D26] cursor-wait' 
                      : 'bg-[#F27D26] text-white hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-[#F27D26]/20'
                  }`}
                >
                  {isGenerating ? (
                     <>
                      <RotateCcw className="animate-spin" size={20} />
                      <span>Processing...</span>
                     </>
                  ) : (
                    <>
                      <Waves size={20} />
                      <span>Generate Speech</span>
                    </>
                  )}
                </button>

                <button
                  disabled={!audioUrl}
                  onClick={downloadAudio}
                  className={`w-14 h-14 rounded-xl flex items-center justify-center border border-[#2a2b2f] transition-all ${
                    audioUrl ? 'text-[#8E9299] hover:bg-[#1a1b1e] hover:text-white' : 'text-[#2a2b2f] cursor-not-allowed'
                  }`}
                >
                  <Download size={20} />
                </button>
              </div>

              {/* Audio Feedback Panel */}
              <AnimatePresence>
                {audioUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="bg-[#1a1b1e] rounded-xl p-4 border border-[#2a2b2f] flex items-center gap-4"
                  >
                    <button
                      onClick={togglePlayback}
                      className="w-12 h-12 rounded-full bg-[#F27D26] flex items-center justify-center text-white pulse-glow"
                    >
                      {isPlaying ? <Pause fill="currentColor" size={20} /> : <Play fill="currentColor" size={20} className="ml-1" />}
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="mono-label">Output Preview</span>
                        <Volume2 size={14} className="text-[#F27D26]" />
                      </div>
                      <div className="h-1 bg-[#2a2b2f] rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={isPlaying ? { width: '100%' } : { width: '0%' }}
                          transition={{ duration: 3, ease: 'linear' }} // Simplified progress for UI
                          className="h-full bg-[#F27D26]" 
                        />
                      </div>
                    </div>

                    <audio
                      ref={audioRef}
                      src={audioUrl}
                      onEnded={() => setIsPlaying(false)}
                      className="hidden"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {!audioUrl && !isGenerating && (
                <div className="flex items-center justify-center gap-3 py-6 text-[#3a3b40] border border-dashed border-[#2a2b2f] rounded-xl">
                  <Mic2 size={16} />
                  <span className="mono-label">Awaiting Signal</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Modal for Saving Presets */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-[#151619] border border-[#2a2b2f] rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#F27D26]/10 flex items-center justify-center text-[#F27D26]">
                  <Save size={20} />
                </div>
                <div>
                  <h3 className="text-white font-bold">Salvar Configuração</h3>
                  <p className="text-[#8E9299] text-[10px] uppercase tracking-wider">Novo Preset de Voz</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mono-label block mb-2">Nome da Configuração</label>
                  <input
                    autoFocus
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && confirmSavePreset()}
                    placeholder="Ex: Voz Heróica, Narrador Suave..."
                    className="w-full bg-[#0d0e11] border border-[#2a2b2f] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#F27D26] transition-colors"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 h-11 rounded-lg border border-[#2a2b2f] text-[#8E9299] text-xs font-bold hover:bg-[#1a1b1e] hover:text-white transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmSavePreset}
                    disabled={!newPresetName.trim()}
                    className="flex-1 h-11 rounded-lg bg-[#F27D26] text-white text-xs font-bold hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-lg shadow-[#F27D26]/20"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

