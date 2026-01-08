import React from 'react';
import { Dribbble, Trophy, Users, Zap, Briefcase } from 'lucide-react';

const BasketballApp = () => {
    const storyStages = [
        {
            icon: <Zap size={20} className="text-yellow-600" />,
            title: "The Hustle",
            content: "Just like in coding, every great play on the court starts with a plan. Basketball taught me the value of persistence and the 'grind' required to master a skill."
        },
        {
            icon: <Users size={20} className="text-blue-600" />,
            title: "Team Dynamics",
            content: "Being part of a team taught me how to communicate effectively. Whether it's a pick-and-roll or a high-pressure sprint, coordination is key."
        },
        {
            icon: <Trophy size={20} className="text-orange-600" />,
            title: "Problem Solving",
            content: "Every defense is a puzzle. Every game is a series of problems that need split-second solutions. I bring this same 'knack for solving problems' to my fullstack development work."
        }
    ];

    return (
        <div className="win-app">
            {/* Header */}
            <div className="win-app-header">
                <div className="win-app-icon" style={{ background: '#ff6b35' }}>
                    <Dribbble size={24} />
                </div>
                <div className="win-app-title">
                    <h1>Beyond the Code</h1>
                    <p>How basketball shaped my approach to software development</p>
                </div>
            </div>

            {/* Content */}
            <div className="win-app-content">
                {/* Quote Section */}
                <div className="win-section">
                    <div className="win-card" style={{ background: '#fff3e0', border: '1px solid #ffcc80' }}>
                        <div className="win-card-content" style={{ fontStyle: 'italic', fontSize: '16px', textAlign: 'center' }}>
                            "The court is where I learned to solve problems before I even knew what code was."
                        </div>
                    </div>
                </div>

                {/* Story Stages */}
                <div className="win-section">
                    <h2 className="win-section-title">Lessons from the Court</h2>
                    
                    {storyStages.map((stage, i) => (
                        <div key={i} className="win-card">
                            <div className="win-card-header">
                                <div className="win-card-icon" style={{ background: '#f5f5f5', color: 'inherit' }}>
                                    {stage.icon}
                                </div>
                                <h3 className="win-card-title">{stage.title}</h3>
                            </div>
                            <div className="win-card-content">
                                {stage.content}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Current Position */}
                <div className="win-section">
                    <h2 className="win-section-title">Applying These Principles</h2>
                    
                    <div className="win-card" style={{ background: '#e3f2fd', border: '1px solid #90caf9' }}>
                        <div className="win-card-header">
                            <div className="win-card-icon">
                                <Briefcase size={16} />
                            </div>
                            <h3 className="win-card-title">Fullstack Intern @ Eyratech</h3>
                        </div>
                        <div className="win-card-content">
                            Currently, I'm applying those same principles of teamwork and tactical problem-solving at 
                            <strong> Eyratech</strong>, Lahore. Bridging the gap between the playground and the platform.
                        </div>
                    </div>
                </div>

                {/* Skills Transfer */}
                <div className="win-section">
                    <h2 className="win-section-title">Skills Transfer</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="win-card">
                            <div className="win-card-content">
                                <strong>Court:</strong> Reading the defense and adapting strategy in real-time
                            </div>
                        </div>
                        <div className="win-card">
                            <div className="win-card-content">
                                <strong>Code:</strong> Debugging complex issues and optimizing performance
                            </div>
                        </div>
                        <div className="win-card">
                            <div className="win-card-content">
                                <strong>Court:</strong> Communicating with teammates under pressure
                            </div>
                        </div>
                        <div className="win-card">
                            <div className="win-card-content">
                                <strong>Code:</strong> Collaborating on team projects and code reviews
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BasketballApp;
