import { User, Mail, Github, MapPin, GraduationCap, Briefcase } from 'lucide-react';

const AboutApp = () => {
    return (
        <div className="win-app">
            {/* Header */}
            <div className="win-app-header">
                <div className="win-app-icon">
                    <User size={24} />
                </div>
                <div className="win-app-title">
                    <h1>Syed Raza Ali Rizvi</h1>
                    <p>Fullstack Intern @ Eyratech Lahore</p>
                </div>
            </div>

            {/* Content */}
            <div className="win-app-content">
                {/* Personal Information */}
                <div className="win-section">
                    <h2 className="win-section-title">Personal Information</h2>
                    
                    <div className="win-card">
                        <div className="win-card-header">
                            <div className="win-card-icon">
                                <MapPin size={16} />
                            </div>
                            <h3 className="win-card-title">Location</h3>
                        </div>
                        <div className="win-card-content">
                            Lahore, Pakistan
                        </div>
                    </div>

                    <div className="win-card">
                        <div className="win-card-header">
                            <div className="win-card-icon">
                                <GraduationCap size={16} />
                            </div>
                            <h3 className="win-card-title">Education</h3>
                        </div>
                        <div className="win-card-content">
                            <strong>BSc Software Engineering</strong><br />
                            FAST-NUCES, Lahore (Expected 2027)<br />
                            CGPA: 3.49
                        </div>
                    </div>

                    <div className="win-card">
                        <div className="win-card-header">
                            <div className="win-card-icon">
                                <Briefcase size={16} />
                            </div>
                            <h3 className="win-card-title">Current Position</h3>
                        </div>
                        <div className="win-card-content">
                            Fullstack Intern at Eyratech, Lahore<br />
                            Working on web applications and backend systems
                        </div>
                    </div>
                </div>

                {/* About */}
                <div className="win-section">
                    <h2 className="win-section-title">About</h2>
                    
                    <div className="win-card">
                        <div className="win-card-content">
                            I'm currently a Software Engineering student at university with a deep-seated passion for solving complex puzzles.
                            Whether it's debugging a race condition or optimizing database queries to reduce server response time by 
                            <strong> 55%</strong>, I find a unique joy in the process of discovery and resolution.
                        </div>
                    </div>

                    <div className="win-card">
                        <div className="win-card-content">
                            My experience spans across multiple technologies including Java, Python, JavaScript, and various frameworks.
                            I enjoy working on both frontend and backend development, with a particular interest in creating efficient,
                            scalable solutions that solve real-world problems.
                        </div>
                    </div>
                </div>

                {/* Contact */}
                <div className="win-section">
                    <h2 className="win-section-title">Contact</h2>
                    
                    <div className="flex gap-3">
                        <a 
                            href="mailto:razaalirizvi4@gmail.com" 
                            className="win-button"
                        >
                            <Mail size={16} /> 
                            Contact Me
                        </a>
                        <a 
                            href="https://github.com/razaalirizvi4" 
                            target="_blank" 
                            className="win-button win-button-secondary"
                        >
                            <Github size={16} /> 
                            GitHub Profile
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutApp;
