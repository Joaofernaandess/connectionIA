export default function MessageModal({
    type,
    title,
    message,
    onClose,
    buttonLabel,
    autoClose = 8000,
    autoCloseMs,
}) {
    const isError = type === 'error';
    const closeDelay = autoCloseMs ?? autoClose;
    const isStandardDelay = closeDelay === 8000;
    const modalTitle = title || '';
    const actionLabel = buttonLabel || (isError ? 'Fechar' : 'OK');

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

                <div
                    className={`message-progress ${isError ? 'message-progress-error' : 'message-progress-success'}`}
                    role="progressbar"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-hidden="true"
                >
                    <span
                        key={`${type}-${message}`}
                        className={`message-progress-bar ${isStandardDelay ? 'message-progress-bar-standard' : ''}`}
                        onAnimationEnd={onClose}
                    />
                </div>

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