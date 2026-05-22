import React from 'react';

export default function PhoneInput({ value, onChange, error, errorMessage }) {
    const formatPhone = (val) => {
        if (!val) return '';
        const numbers = val.replace(/\D/g, '');
        if (numbers.length === 0) return '';
        if (numbers.length <= 2) return `(${numbers}`;
        if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    };

    const handleChange = (e) => {
        const input = e.target;
        const cursorPosition = input.selectionStart;
        const currentLength = input.value.length;

        let rawValue = input.value.replace(/\D/g, '');
        if (rawValue.length > 12) {
            rawValue = rawValue.slice(0, 12);
        }

        onChange({ target: { value: rawValue } });

        if (cursorPosition < currentLength) {
            setTimeout(() => {
                if (input) input.setSelectionRange(cursorPosition, cursorPosition);
            }, 0);
        }
    };

    return (
        <div style={{ marginBottom: '1rem' }}>
            <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '1.1rem', fontWeight: 'normal', color: 'inherit' }}>
                Login
            </label>
            <input
                type="tel"
                placeholder="(99) 99999-9999"
                value={formatPhone(value)}
                onChange={handleChange}
                style={{
                    width: '100%',
                    marginBottom: 0,
                    borderColor: error ? '#e99292' : undefined,
                    outlineColor: error ? '#e99292' : undefined
                }}
            />
            {error && <small style={{ color: '#e99292', fontSize: '11px', display: 'block', marginTop: '4px', textAlign: 'left' }}>{errorMessage}</small>}
        </div>
    );
}