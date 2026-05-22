import React, { useEffect } from 'react';

export default function MessageModal({
    type,
    message,
    onClose,
    autoCloseMs = 8000,
 }) {
    const [progress, setProgress] = useState(0);
    const isError = type === 'error';

    useEffect(() => {
        
        const total = autoCloseMs;
        const step = 100;
        const intervalMs = total / step;

        setProgress(100);

        const intervalID = setInterval(() => {
            setProgress(prev => {
                const next = prev - 1;
                return next < 0 ? 0 : next;
            });
        }, intervalMs);

        const timeoutID = setTimeout(() => {
            onClose();
        }, total);

        return () => {
            clearInterval(intervalID);
            clearTimeout(timeoutID);
        };
    }, [message, autoCloseMs, onClose]);

    if (!message) return;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backfilter: 'blur(4px)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                ZIndex: 99999,
                padding: '1rem',
                boxSizing: 'border-box',
            }}
        >
            <div
            className="card"
             style={{
                width: '100%',
                maxWidth: '400px',
                height: 'fit-content',
                margin: 'auto',
                backgroundColor: 'var(--zf-background-secondary)',
                padding: '2.5rem',
                borderRadius: '15px',
                textAlign: 'center',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            }}
        >
            <h2
                style={{
                    color: isError ? '#E57373' : '#81C784',
                    marginTop: 0,
                    marginBottom: '1rem',
                }}
            >
                {isError ? 'Atenção' : 'Sucesso'}: {message}  
            </h2>

            <p
                style={{
                    color: 'var(--zf-text-main)',
                    marginBottom: '2rem',
                    fontSize: '1rem',
                    lineHeight: '1.4',
                }}
            > 
                {message}
            </p>

            <div
            style={{
                width: '100%',
                height: '4px',
                borderRadius: '999px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                overflow: 'hidden',
                marginBottom: '1rem',
            }}
            >
            <div
                style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: isError ? '#E57373' : '#81C784',
                transition: 'width 0.1s linear',
                }}
            />
            </div>

            <button
                type="button"
                className="button"
                style={{ width: '100%', margin: 0 }}
                onClick={onClose}
            >
                {isError ? 'Fechar' : 'OK'}
            </button>
        </div>
    </div>
    );
}