import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function TransferirItemModal({
    espacos,
    fieldErrors = {},
    item,
    novoEspacoId,
    onChange,
    onClose,
    onSubmit
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [listPosition, setListPosition] = useState(null);
    const comboRef = useRef(null);
    const listRef = useRef(null);

    const espacosDestino = useMemo(() => (
        (Array.isArray(espacos) ? espacos : []).filter(e => e.espacoId !== item?.espacoId)
    ), [espacos, item?.espacoId]);

    const selected = espacosDestino.find(e => e.espacoId === novoEspacoId);
    const displayValue = isOpen ? search : selected?.nome || '';
    const fieldError = fieldErrors.NovoEspacoId || fieldErrors.novoEspacoId || fieldErrors.EspacoDestinoId || '';

    const filteredEspacos = espacosDestino.filter(e => {
        const termo = search.toLowerCase();
        const nome = String(e.nome || '').toLowerCase();
        const descricao = String(e.descricao || '').toLowerCase();

        return nome.includes(termo) || descricao.includes(termo);
    });

    const semResultados = isOpen && search.trim() && filteredEspacos.length === 0;

    useEffect(() => {
        if (isOpen && highlightedIndex >= 0 && listRef.current) {
            const itemElement = listRef.current.children[highlightedIndex];
            itemElement?.scrollIntoView({ block: 'nearest' });
        }
    }, [highlightedIndex, isOpen]);

    useEffect(() => {
        if (!isOpen || !comboRef.current) {
            setListPosition(null);
            return;
        }

        const updateListPosition = () => {
            if (!comboRef.current) return;

            const rect = comboRef.current.getBoundingClientRect();
            const visualViewport = window.visualViewport;
            const viewportGap = 12;
            const viewportBottom = visualViewport
                ? visualViewport.offsetTop + visualViewport.height
                : window.innerHeight;
            const availableHeight = Math.max(120, viewportBottom - rect.bottom - viewportGap);

            setListPosition({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX,
                width: rect.width,
                maxHeight: Math.min(250, availableHeight)
            });
        };

        updateListPosition();
        window.addEventListener('resize', updateListPosition);
        window.addEventListener('scroll', updateListPosition, true);
        window.visualViewport?.addEventListener('resize', updateListPosition);
        window.visualViewport?.addEventListener('scroll', updateListPosition);

        return () => {
            window.removeEventListener('resize', updateListPosition);
            window.removeEventListener('scroll', updateListPosition, true);
            window.visualViewport?.removeEventListener('resize', updateListPosition);
            window.visualViewport?.removeEventListener('scroll', updateListPosition);
        };
    }, [isOpen, filteredEspacos.length]);

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!isOpen) {
                setIsOpen(true);
            } else if (filteredEspacos.length > 0) {
                setHighlightedIndex(prev => (prev < filteredEspacos.length - 1 ? prev + 1 : prev));
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (isOpen) {
                setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
            }
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredEspacos.length) {
                e.preventDefault();
                const espaco = filteredEspacos[highlightedIndex];
                onChange(espaco.espacoId);
                setSearch('');
                setIsOpen(false);
                setHighlightedIndex(-1);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            setHighlightedIndex(-1);
        }
    };

    const listaOpcoes = (
        <>
            {filteredEspacos.map((e, index) => (
                <li
                    key={e.espacoId}
                    className={`zf-combobox-item ${highlightedIndex === index ? 'highlighted' : ''}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                        onChange(e.espacoId);
                        setSearch('');
                        setIsOpen(false);
                        setHighlightedIndex(-1);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                >
                    <div className="zf-cb-left">
                        <span className="zf-cb-name">{e.nome}</span>
                        {e.descricao && <span className="zf-cb-cpf">{e.descricao}</span>}
                    </div>
                </li>
            ))}
            {semResultados && (
                <li className="zf-combobox-empty" aria-live="polite">
                    Não encontrado
                </li>
            )}
        </>
    );

    return (
        <div className="modal-overlay">
            <div className="card transfer-modal-card">
                <h2 className="modal-title">Transferir de Espaço</h2>
                <p className="transfer-description">
                    Selecione o novo local para o item <strong>{item?.descricao}</strong>:
                </p>

                <form onSubmit={onSubmit} noValidate>
                    <div className="mb-2">
                        <label className="label-sm">Espaço de Destino</label>
                        <div ref={comboRef} className={`zf-combobox zf-combobox-custom-arrow combobox-field ${isOpen ? 'active' : ''}`}>
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
                                className={`zf-combobox-input combobox-input ${novoEspacoId ? 'has-clear-button' : ''} ${fieldError ? 'is-invalid' : ''}`}
                            />
                            {novoEspacoId && (
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
                            {isOpen && listPosition && createPortal(
                                <ul
                                    className="zf-combobox-list zf-combobox-list-floating is-open"
                                    ref={listRef}
                                    style={{
                                        top: `${listPosition.top}px`,
                                        left: `${listPosition.left}px`,
                                        width: `${listPosition.width}px`,
                                        maxHeight: `${listPosition.maxHeight}px`
                                    }}
                                >
                                    {listaOpcoes}
                                </ul>,
                                document.body
                            )}
                        </div>
                        {fieldError && <small className="invalid-feedback d-block">{fieldError}</small>}
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="button button-outline button-flex" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="button button-flex">
                            Confirmar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
