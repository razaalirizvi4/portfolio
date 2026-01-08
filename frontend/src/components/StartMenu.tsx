import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Power, Search, User } from 'lucide-react';

interface StartMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onAppClick: (id: string) => void;
    apps: Array<{ id: string, title: string, icon: React.ReactNode }>;
}

const StartMenu: React.FC<StartMenuProps> = ({ isOpen, onClose, onAppClick, apps }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9998]"
                        onClick={onClose}
                    />
                    
                    {/* Start Menu */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "tween", duration: 0.15 }}
                        className="win-start-menu win-animate-in"
                    >
                        {/* Search Section */}
                        <div className="win-start-search relative">
                            <Search className="win-search-icon" size={14} />
                            <input
                                type="text"
                                placeholder="Type here to search"
                                className="win-search-box"
                            />
                        </div>

                        {/* Pinned Apps */}
                        <div className="win-start-section">
                            <div className="win-section-header">
                                <span className="win-section-title">Pinned</span>
                                <button className="win-section-more">All apps ›</button>
                            </div>

                            <div className="win-app-grid">
                                {apps.map((app) => (
                                    <button
                                        key={app.id}
                                        onClick={() => { onAppClick(app.id); onClose(); }}
                                        className="win-app-item"
                                    >
                                        <div className="win-app-icon">
                                            {React.cloneElement(app.icon as React.ReactElement<{size?: number; color?: string}>, { size: 24, color: 'white' })}
                                        </div>
                                        <span className="win-app-name">{app.title}</span>
                                    </button>
                                ))}
                                
                                {/* Fill remaining slots with empty items for proper grid */}
                                {Array.from({ length: Math.max(0, 12 - apps.length) }).map((_, i) => (
                                    <div key={`empty-${i}`} className="win-app-item opacity-0"></div>
                                ))}
                            </div>
                        </div>

                        {/* Recommended Section */}
                        <div className="win-start-section">
                            <div className="win-section-header">
                                <span className="win-section-title">Recommended</span>
                                <button className="win-section-more">More ›</button>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-3 p-2 rounded hover:bg-white/10 cursor-pointer">
                                    <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                                        <span className="text-white text-xs font-semibold">R</span>
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="text-white text-sm">Resume.pdf</div>
                                        <div className="text-white/60 text-xs">Recently opened</div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 p-2 rounded hover:bg-white/10 cursor-pointer">
                                    <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                                        <span className="text-white text-xs font-semibold">P</span>
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="text-white text-sm">Portfolio Project</div>
                                        <div className="text-white/60 text-xs">2 hours ago</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* User Section */}
                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-black/20 border-t border-white/10 flex items-center justify-between px-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                                    <User size={16} color="white" />
                                </div>
                                <span className="text-white text-sm font-medium">Syed Raza Ali Rizvi</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="win-system-icon">
                                    <Settings size={16} />
                                </button>
                                <button className="win-system-icon hover:bg-red-600/20">
                                    <Power size={16} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default StartMenu;
