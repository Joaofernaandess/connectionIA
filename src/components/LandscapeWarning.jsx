import {useEffect, useState} from 'react';
import ZeniteIcon from './ZeniteIcon';

export default function LandscapeWarning() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const minDim = Math.min(window.screen.width, window.screen.height);
            setIsMobile(minDim < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (!isMobile) return null;

    return (
        <div className="landscape-warning-overlay">
            <div className="warning-content-card">
                <ZeniteIcon name="rotate-ccw" size={64} storeWidth={1.5} />
                <p> Volte o telefone para o modo retrato para melhor experiência. </p>
            </div>
        </div>
    );
}