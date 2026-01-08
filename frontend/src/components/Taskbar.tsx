import React, { useState, useEffect } from 'react';
import { Search, Wifi, Volume2, Battery } from 'lucide-react';

interface TaskbarProps {
    openApps: Array<{ id: string; title: string; icon: React.ReactNode }>;
    activeApp: string | null;
    onAppClick: (id: string) => void;
    onStartClick: () => void;
}

const Taskbar: React.FC<TaskbarProps> = ({ openApps, activeApp, onAppClick, onStartClick }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="win-taskbar">
            {/* Center Section - Start Button & Apps */}
            <div className="win-taskbar-center">
                {/* Start Button */}
                <button onClick={onStartClick} className="win-start-button">
                    <div className="win-start-icon"></div>
                </button>

                {/* Search Button */}
                <button className="win-taskbar-button">
                    <Search size={16} color="white" />
                </button>

                {/* Task View Button */}
                <button className="win-taskbar-button">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
                        <rect x="1" y="3" width="6" height="4" rx="0.5" stroke="currentColor" strokeWidth="1" fill="none"/>
                        <rect x="9" y="3" width="6" height="4" rx="0.5" stroke="currentColor" strokeWidth="1" fill="none"/>
                        <rect x="1" y="9" width="6" height="4" rx="0.5" stroke="currentColor" strokeWidth="1" fill="none"/>
                        <rect x="9" y="9" width="6" height="4" rx="0.5" stroke="currentColor" strokeWidth="1" fill="none"/>
                    </svg>
                </button>

                {/* Open Apps */}
                {openApps.map(app => (
                    <button
                        key={app.id}
                        onClick={() => onAppClick(app.id)}
                        className={`win-taskbar-button ${activeApp === app.id ? 'active' : ''}`}
                    >
                        {React.cloneElement(app.icon as React.ReactElement<{size?: number; color?: string}>, { size: 16, color: 'white' })}
                    </button>
                ))}
            </div>

            {/* System Tray */}
            <div className="win-system-tray">
                <button className="win-system-icon">
                    <Volume2 size={14} />
                </button>
                <button className="win-system-icon">
                    <Wifi size={14} />
                </button>
                <button className="win-system-icon">
                    <Battery size={14} />
                </button>
                
                <div className="win-clock">
                    <div>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div>{time.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' })}</div>
                </div>
            </div>
        </div>
    );
};

export default Taskbar;
