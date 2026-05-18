import React, { useState, useEffect, useRef } from 'react';

export default function UnidadeComboBox({ value, onChange, error, errorMessage }) {
    const [unidades, setUnidades] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const listRef = useRef(null);

    useEffect(() => {
        fetch('https://api.estoquecerto.zenitetecnologia.ia.br/v1/unidades-organizacionais')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setUnidades(data);
                } else {
                    setUnidades([]);
                }
            })
            .catch(() => setUnidades([]));
    }, []);

    const unidadesSeguras = Array.isArray(unidades) ? unidades : [];

    const getNomeExibicao = (u) => {
        if (!u) return '';
        return u.nomeFantasia || u.razaoSocial || 'Unidade sem nome';
    };

    const filteredUnidades = unidadesSeguras.filter(u =>
        getNomeExibicao(u).toLowerCase().includes(search.toLowerCase())
    );

    const selected = unidadesSeguras.find(u => u.unidadeOrganizacionalId === value);
    const displayValue = isOpen ? search : getNomeExibicao(selected);

    useEffect(() => {
        if (isOpen && highlightedIndex >= 0 && listRef.current) {
            const itemElement = listRef.current.children[highlightedIndex];
            if (itemElement) {
                itemElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightedIndex, isOpen]);

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!isOpen) {
                setIsOpen(true);
            } else {
                setHighlightedIndex(prev => (prev < filteredUnidades.length - 1 ? prev + 1 : prev));
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (isOpen) {
                setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
            }
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredUnidades.length) {
                e.preventDefault();
                const selectedU = filteredUnidades[highlightedIndex];
                onChange(selectedU.unidadeOrganizacionalId);
                setSearch('');
                setIsOpen(false);
                setHighlightedIndex(-1);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            setHighlightedIndex(-1);
        }
    };

    return (
        <div style={{ marginBottom: '1rem' }}>
            <style>{`.zf-combobox-custom-arrow::after {right: 12px !important; }
            `}</style>

            <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 'normal', color: error ? '#ff4444' : 'inherit' }}>
                Unidade Organizacional
            </label>

            <div className={`zf-combobox zf-combobox-custom-arrow ${isOpen ? 'active' : ''}`} style={{ marginBottom: 0, position: 'relative' }}>
                <input
                    type="text"
                    className="zf-combobox-input"
                    placeholder="Pesquisar..."
                    value={displayValue}
                    onClick={() => setIsOpen(true)}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setIsOpen(true);
                        setHighlightedIndex(-1);
                    }}
                    onKeyDown={handleKeyDown}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                    style={{
                        width: '100%',
                        marginBottom: 0,
                        borderColor: error ? '#ff4444' : undefined,
                        outlineColor: error ? '#ff4444' : undefined,
                        paddingRight: value ? '60px' : '30px'
                    }}
                />

                {value && (
                    <div
                        onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onChange('');
                            setSearch('');
                            setIsOpen(false);
                        }}
                        style={{
                            position: 'absolute',
                            right: '32px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            cursor: 'pointer',
                            color: 'var(--zf-text-main)',
                            opacity: 0.6,
                            padding: '5px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10,
                            fontWeight: 'bold',
                            fontSize: '0.9rem'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                    >
                        ✕
                    </div>
                )}

                <ul className="zf-combobox-list" ref={listRef}>
                    {filteredUnidades.map((u, index) => (
                        <li
                            key={u.unidadeOrganizacionalId}
                            className={`zf-combobox-item ${highlightedIndex === index ? 'highlighted' : ''}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                                onChange(u.unidadeOrganizacionalId);
                                setSearch('');
                                setIsOpen(false);
                                setHighlightedIndex(-1);
                            }}
                            onMouseEnter={() => setHighlightedIndex(index)}
                        >
                            <div className="zf-cb-left">
                                <span className="zf-cb-name">{getNomeExibicao(u)}</span>
                                <span className="zf-cb-cpf">{u.cnpj}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            {error && <small style={{ color: '#ff4444', fontSize: '11px', display: 'block', marginTop: '4px', textAlign: 'left' }}>{errorMessage}</small>}
        </div>
    );
}