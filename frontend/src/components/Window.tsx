import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface WindowProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    onClose: () => void;
    onMinimize: () => void;
    active: boolean;
    onClick: () => void;
}

const Window: React.FC<WindowProps> = ({
    title, icon, children, onClose, onMinimize, active, onClick
}) => {
    const [isMaximized, setIsMaximized] = useState(false);

    return (
        <motion.div
            drag={!isMaximized}
            dragMomentum={false}
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{
                scale: 1,
                opacity: 1,
                y: 0,
                width: isMaximized ? '100%' : '900px',
                height: isMaximized ? 'calc(100% - 48px)' : '600px',
                top: isMaximized ? 0 : '10%',
                left: isMaximized ? 0 : '15%',
                zIndex: active ? 100 : 10
            }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "tween", duration: 0.15 }}
            className="win-window absolute"
            onClick={onClick}
        >
            {/* Windows 11 Title Bar */}
            <div className="win-titlebar">
                <div className="win-titlebar-title">
                    <div className="w-4 h-4 flex items-center justify-center">
                        {React.cloneElement(icon as React.ReactElement<{size?: number}>, { size: 16 })}
                    </div>
                    <span>{title}</span>
                </div>
                
                {/* Window Controls */}
                <div className="win-titlebar-controls">
                    <button
                        onClick={(e) => { e.stopPropagation(); onMinimize(); }}
                        className="win-control-button"
                    >
                        <svg viewBox="0 0 10 10" fill="currentColor">
                            <rect x="2" y="4.5" width="6" height="1"/>
                        </svg>
                    </button>
                    
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsMaximized(!isMaximized); }}
                        className="win-control-button"
                    >
                        {isMaximized ? (
                            <svg viewBox="0 0 10 10" fill="currentColor">
                                <rect x="2" y="3" width="5" height="5" stroke="currentColor" strokeWidth="1" fill="none"/>
                                <rect x="3" y="2" width="5" height="5" stroke="currentColor" strokeWidth="1" fill="none"/>
                            </svg>
                        ) : (
                            <svg viewBox="0 0 10 10" fill="currentColor">
                                <rect x="2" y="2" width="6" height="6" stroke="currentColor" strokeWidth="1" fill="none"/>
                            </svg>
                        )}
                    </button>
                    
                    <button
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="win-control-button close"
                    >
                        <svg viewBox="0 0 10 10" fill="currentColor">
                            <path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                        </svg>
                    </button>
                </div>
            </div>
            
            {/* Window Content */}
            <div className="flex-1 overflow-auto bg-white win-scrollbar" style={{ height: 'calc(100% - 32px)' }}>
                {children}
            </div>
        </motion.div>
    );
};

export default Window;
