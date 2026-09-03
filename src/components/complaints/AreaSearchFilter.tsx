import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Search, ChevronRight, ArrowLeft, X, Check } from 'lucide-react';
import { type Complaint } from '../../types';
import { useTenant } from '../../context/TenantContext';
import { TranslatedText } from '../TranslatedText';
import { formatAreaName, stripSerialNumber } from '../../utils/formatters';
import { MAMIT_SECTORS, SOCIETIES_BY_WARD } from '../../data/mamitSocieties';

interface AreaSearchFilterProps {
    areaSearch: string;
    setAreaSearch: (val: string) => void;
    selectedSector: string | null;
    setSelectedSector: (sec: string | null) => void;
    selectedSociety: string | null;
    setSelectedSociety: (soc: string | null) => void;
    complaints: Complaint[];
    placeholder?: string;
}

export const AreaSearchFilter: React.FC<AreaSearchFilterProps> = ({
    areaSearch,
    setAreaSearch,
    selectedSector,
    setSelectedSector,
    selectedSociety,
    setSelectedSociety,
    complaints,
    placeholder = 'Search Area / Ward...'
}) => {
    const { tenant } = useTenant();
    const isMamit = Boolean(tenant?.name?.toLowerCase().includes('mamit'));
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    // Helper: calculate complaint count for a given sector
    const getSectorCount = (sector: string) => {
        const secLower = sector.toLowerCase();
        return complaints.filter(c => 
            (c.location && c.location.toLowerCase().includes(secLower)) ||
            (c.area && c.area.toLowerCase().includes(secLower))
        ).length;
    };

    // Helper: calculate complaint count for a given society within a sector
    const getSocietyCount = (sector: string, society: string) => {
        const secLower = sector.toLowerCase();
        const clean = stripSerialNumber(society).toLowerCase();
        const raw = society.toLowerCase();
        return complaints.filter(c => {
            const secMatch = (c.location && c.location.toLowerCase().includes(secLower)) ||
                             (c.area && c.area.toLowerCase().includes(secLower));
            const socMatch = (c.area && (c.area.toLowerCase().includes(clean) || c.area.toLowerCase().includes(raw))) ||
                             (c.location && (c.location.toLowerCase().includes(clean) || c.location.toLowerCase().includes(raw)));
            return secMatch && socMatch;
        }).length;
    };

    // For non-Mamit tenants, list unique areas from data
    const nonMamitUniqueAreas = !isMamit ? Array.from(new Set(complaints.map(c => c.area).filter(Boolean))).map(area => ({
        name: area as string,
        count: complaints.filter(c => c.area === area).length
    })).sort((a, b) => b.count - a.count) : [];

    // Extract search query if user typed inside the input
    const isSearchMode = Boolean(
        areaSearch && 
        selectedSector && 
        !areaSearch.includes(formatAreaName(selectedSector, tenant?.name)) &&
        !areaSearch.includes(selectedSector)
    ) || (Boolean(areaSearch) && !selectedSector);

    const searchQuery = areaSearch ? areaSearch.trim().toLowerCase() : '';

    return (
        <div className="relative w-full" ref={containerRef}>
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            <input
                type="text"
                placeholder={placeholder}
                className="ns-input pl-10 pr-9 notranslate w-full text-sm"
                value={areaSearch}
                onChange={(e) => {
                    const val = e.target.value;
                    setAreaSearch(val);
                    if (!val) {
                        setSelectedSector(null);
                        setSelectedSociety(null);
                    }
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
            />
            {areaSearch && (
                <button
                    type="button"
                    onClick={() => {
                        setAreaSearch('');
                        setSelectedSector(null);
                        setSelectedSociety(null);
                        setIsOpen(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    title="Clear filter"
                >
                    <X className="w-4 h-4" />
                </button>
            )}

            {/* Dropdown Menu */}
            {isOpen && (
                <div 
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-72 overflow-y-auto w-full divide-y divide-gray-100"
                    onMouseDown={(e) => e.preventDefault()}
                >
                    {!isMamit ? (
                        // Standard Non-Mamit Dropdown
                        nonMamitUniqueAreas.length > 0 ? (
                            nonMamitUniqueAreas
                                .filter(a => !areaSearch || a.name.toLowerCase().includes(areaSearch.toLowerCase()))
                                .map((area, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex justify-between items-center text-sm transition-colors"
                                        onClick={() => {
                                            setAreaSearch(area.name);
                                            setIsOpen(false);
                                        }}
                                    >
                                        <span className="text-gray-700">{area.name}</span>
                                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
                                            {area.count}
                                        </span>
                                    </button>
                                ))
                        ) : (
                            <div className="px-4 py-3 text-xs text-gray-400 text-center">
                                No areas available
                            </div>
                        )
                    ) : selectedSector ? (
                        // MAMIT: Sector is Selected -> Show its respective Societies in the SAME Dropdown
                        <div>
                            {/* Sector Header with Back Button */}
                            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-gray-100 sticky top-0 z-10">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedSector(null);
                                        setSelectedSociety(null);
                                        setAreaSearch('');
                                    }}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors cursor-pointer py-0.5 px-1 rounded hover:bg-brand-50"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    <span>All Sectors</span>
                                </button>
                                <span className="text-xs font-bold text-slate-800 truncate max-w-[200px]">
                                    {formatAreaName(selectedSector, tenant?.name)}
                                </span>
                            </div>

                            {/* Option 1: Select Entire Sector */}
                            <button
                                type="button"
                                className={`w-full text-left px-4 py-2.5 hover:bg-brand-50/60 flex justify-between items-center text-sm transition-colors border-b border-gray-100 ${
                                    !selectedSociety ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-gray-800'
                                }`}
                                onClick={() => {
                                    setSelectedSociety(null);
                                    setAreaSearch(formatAreaName(selectedSector, tenant?.name));
                                    setIsOpen(false);
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    {!selectedSociety && <Check className="w-4 h-4 text-brand-600 shrink-0" />}
                                    <span>All {formatAreaName(selectedSector, tenant?.name)} (Entire Sector)</span>
                                </div>
                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium ml-2 shrink-0">
                                    {getSectorCount(selectedSector)}
                                </span>
                            </button>

                            {/* Section Label */}
                            <div className="px-4 py-1.5 bg-gray-50/70 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                Societies ({SOCIETIES_BY_WARD[selectedSector]?.length || 0})
                            </div>

                            {/* Option 2: Respective Societies List */}
                            {SOCIETIES_BY_WARD[selectedSector] && SOCIETIES_BY_WARD[selectedSector].length > 0 ? (
                                SOCIETIES_BY_WARD[selectedSector]
                                    .map((s, idx) => ({ name: `${idx + 1} - ${s}`, raw: s }))
                                    .filter(s => {
                                        if (!searchQuery || searchQuery === formatAreaName(selectedSector, tenant?.name).toLowerCase()) return true;
                                        return s.name.toLowerCase().includes(searchQuery) || s.raw.toLowerCase().includes(searchQuery);
                                    })
                                    .map(s => {
                                        const isSelected = selectedSociety === s.name || selectedSociety === s.raw;
                                        const count = getSocietyCount(selectedSector, s.raw);
                                        return (
                                            <button
                                                key={s.name}
                                                type="button"
                                                className={`w-full text-left px-4 py-2 hover:bg-brand-50/60 flex justify-between items-center text-sm transition-colors ${
                                                    isSelected ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-gray-700'
                                                }`}
                                                onClick={() => {
                                                    setSelectedSociety(s.name);
                                                    setAreaSearch(`${formatAreaName(selectedSector, tenant?.name)}: ${s.name}`);
                                                    setIsOpen(false);
                                                }}
                                            >
                                                <div className="flex items-center gap-2 truncate pr-2">
                                                    {isSelected && <Check className="w-3.5 h-3.5 text-brand-600 shrink-0" />}
                                                    <span className="truncate">{s.name}</span>
                                                </div>
                                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium shrink-0">
                                                    {count}
                                                </span>
                                            </button>
                                        );
                                    })
                            ) : (
                                <div className="px-4 py-3 text-xs text-gray-400 text-center">
                                    No specific societies listed for this area
                                </div>
                            )}
                        </div>
                    ) : (
                        // MAMIT: No Sector Selected -> Show List of Sectors
                        <div>
                            <div className="px-3 py-1.5 bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider sticky top-0 z-10 border-b border-gray-100">
                                Select Ward / Sector
                            </div>
                            {MAMIT_SECTORS
                                .filter(sector => {
                                    if (!searchQuery) return true;
                                    const formatted = formatAreaName(sector, tenant?.name).toLowerCase();
                                    return formatted.includes(searchQuery) || sector.toLowerCase().includes(searchQuery);
                                })
                                .map(sector => {
                                    const formatted = formatAreaName(sector, tenant?.name);
                                    const count = getSectorCount(sector);
                                    const hasSocieties = Boolean(SOCIETIES_BY_WARD[sector]?.length);

                                    return (
                                        <button
                                            key={sector}
                                            type="button"
                                            className="w-full text-left px-4 py-2.5 hover:bg-brand-50/60 flex justify-between items-center text-sm text-gray-700 transition-colors group"
                                            onClick={() => {
                                                setSelectedSector(sector);
                                                setSelectedSociety(null);
                                                setAreaSearch(formatted);
                                                // If it has societies, keep dropdown open to display societies in same dropdown!
                                                if (!hasSocieties) {
                                                    setIsOpen(false);
                                                }
                                            }}
                                        >
                                            <span className="font-medium text-gray-800 group-hover:text-brand-700 transition-colors">
                                                <TranslatedText text={formatted} />
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
                                                    {count}
                                                </span>
                                                {hasSocieties && (
                                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 transition-colors" />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}

                            {/* Also show matching societies across all sectors if user typed something */}
                            {searchQuery && (
                                <>
                                    <div className="px-3 py-1.5 bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-t border-b border-gray-100">
                                        Matching Societies
                                    </div>
                                    {Object.entries(SOCIETIES_BY_WARD).flatMap(([sec, socs]) => 
                                        socs.map((s, idx) => ({ sector: sec, society: s, displayName: `${idx + 1} - ${s}` }))
                                            .filter(item => 
                                                item.society.toLowerCase().includes(searchQuery) || 
                                                item.displayName.toLowerCase().includes(searchQuery)
                                            )
                                    ).slice(0, 15).map(item => (
                                        <button
                                            key={`${item.sector}-${item.displayName}`}
                                            type="button"
                                            className="w-full text-left px-4 py-2 hover:bg-brand-50/60 flex justify-between items-center text-sm text-gray-700 transition-colors"
                                            onClick={() => {
                                                setSelectedSector(item.sector);
                                                setSelectedSociety(item.displayName);
                                                setAreaSearch(`${formatAreaName(item.sector, tenant?.name)}: ${item.displayName}`);
                                                setIsOpen(false);
                                            }}
                                        >
                                            <div className="truncate pr-2">
                                                <div className="text-xs text-brand-600 font-medium">
                                                    {formatAreaName(item.sector, tenant?.name)}
                                                </div>
                                                <div className="font-medium text-gray-800 truncate">
                                                    {item.displayName}
                                                </div>
                                            </div>
                                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium shrink-0">
                                                {getSocietyCount(item.sector, item.society)}
                                            </span>
                                        </button>
                                    ))}
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
