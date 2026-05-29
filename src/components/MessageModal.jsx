import { useEffect, useState } from 'react';

export default function MessageModal({
    type,
    title,
    message,
    onClose,
    buttonLabel,
    autoClose = 8000,
    autoCloseMs,
}) {
    const [progress, setProgress] = useState(0);
    const isError = type === 'error';
    const closeDelay = autoCloseMs ?? autoClose;
    const modalTitle = title || '';
    const actionLabel = buttonLabel || (isError ? 'Fechar' : 'OK');

    useEffect(() => {
        if (!message) return;

        const total = closeDelay;
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
    }, [message, closeDelay, onClose]);

    if (!message) return null;

    return (
        <div className="message-overlay">
            <div className="card message-card">
                {modalTitle && (
                    <h2 className={isError ? 'message-title-error' : 'message-title-success'}>
                        {modalTitle}
                    </h2>
                )}

                <p className="message-text">
                    {message}
                </p>

                <progress
                    className={`message-progress ${isError ? 'message-progress-error' : 'message-progress-success'}`}
                    value={progress}
                    max="100"
                    aria-hidden="true"
                />

                <button
                    type="button"
                    className="button button-full"
                    onClick={onClose}
                >
                    {actionLabel}
                </button>
            </div>
        </div>
    );
}