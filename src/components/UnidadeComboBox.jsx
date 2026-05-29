import { useEffect, useRef, useState } from 'react';
import { getBaseUrl } from '../utils/apiConfig';
import { formatCnpj } from '../utils/cnpj';

export default function UnidadeComboBox({ value, onChange, error, errorMessage }) {
    const [unidades, setUnidades] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const listRef = useRef(null);

    useEffect(() => {
        fetch(`${getBaseUrl()}/v1/unidades-organizacionais`)
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

    const filteredUnidades = unidadesSeguras.filter(u => {
        const termo = search.toLowerCase();
        const cnpj = String(u.cnpj || '');

        return (
            getNomeExibicao(u).toLowerCase().includes(termo) ||
            cnpj.toLowerCase().includes(termo) ||
            formatCnpj(cnpj).toLowerCase().includes(termo)
        );
    });

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
        <div className="mb-1">
            <label>
                Unidade Organizacional
            </label>

            <div className={`zf-combobox zf-combobox-custom-arrow combobox-field ${isOpen ? 'active' : ''}`}>
                <input
                    type="text"
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
                    className={`zf-combobox-input combobox-input ${value ? 'has-clear-button' : ''} ${error ? 'is-invalid' : ''}`}
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
                        className="combobox-clear-button"
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
                                <span className="zf-cb-cpf">{formatCnpj(u.cnpj)}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            {error && <small className="invalid-feedback d-block">{errorMessage}</small>}
        </div>
    );
}