import React, { useState, useRef, useEffect, Children, isValidElement } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface OptionType {
    value: string;
    label: ReactNode;
    disabled?: boolean;
}

export interface CustomSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
    onChange?: React.ChangeEventHandler<HTMLSelectElement>;
    children?: ReactNode;
    placeholder?: string;
}

export function CustomSelect({
    value,
    onChange,
    className,
    disabled,
    children,
    placeholder = "Select an option",
    ...props
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Support for uncontrolled components via internal state
    const [internalValue, setInternalValue] = useState(value !== undefined ? value : (props.defaultValue ?? ''));

    useEffect(() => {
        if (value !== undefined) {
            setInternalValue(value);
        }
    }, [value]);

    // Recursively parse <option> tags from children
    const extractOptions = (nodes: ReactNode): OptionType[] => {
        const options: OptionType[] = [];
        Children.forEach(nodes, (child) => {
            if (!isValidElement(child)) return;
            const element = child as React.ReactElement<any>;
            
            // Check for standard option tag
            if (element.type === 'option') {
                options.push({
                    value: element.props.value as string ?? element.props.children as string ?? '',
                    label: element.props.children,
                    disabled: element.props.disabled,
                });
            } else if (element.type === React.Fragment) {
                options.push(...extractOptions(element.props.children));
            } else if (element.props && element.props.children) {
                // Recurse into groups or custom wrappers if any
                options.push(...extractOptions(element.props.children));
            }
        });
        return options;
    };

    const options = extractOptions(children);
    
    // Find the currently selected option to display its label
    const selectedOption = options.find((opt) => String(opt.value) === String(internalValue));
    const displayLabel = selectedOption ? selectedOption.label : placeholder;

    // Handle click outside to close the dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (val: string, optDisabled?: boolean) => {
        if (optDisabled) return;
        
        if (value === undefined) {
            setInternalValue(val);
        }
        setIsOpen(false);
        
        if (onChange) {
            // Simulate an event object for compatibility with (e) => onChange(e.target.value)
            onChange({ target: { value: val, name: props.name } } as unknown as React.ChangeEvent<HTMLSelectElement>);
        }
    };

    return (
        <div ref={containerRef} className="relative w-full">
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={twMerge(
                    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm flex items-center justify-between outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-300 transition-all",
                    disabled && "opacity-60 cursor-not-allowed",
                    className
                )}
                {...(props as any)}
            >
                <span className="truncate">{displayLabel}</span>
                <ChevronDown className={clsx("w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0", isOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-[999] mt-1 w-full min-w-[200px] max-h-60 overflow-auto rounded-xl border border-slate-100 bg-white/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-black ring-opacity-5 focus:outline-none"
                    >
                        <ul className="py-1">
                            {options.map((option, idx) => {
                                const isSelected = String(option.value) === String(internalValue);
                                return (
                                    <li
                                        key={`${option.value}-${idx}`}
                                        onClick={() => handleSelect(option.value, option.disabled)}
                                        className={clsx(
                                            "relative cursor-pointer select-none py-2 pl-10 pr-4 text-sm transition-colors duration-150",
                                            option.disabled 
                                                ? "text-slate-300 cursor-not-allowed" 
                                                : isSelected 
                                                    ? "bg-brand-50 text-brand-700 font-medium" 
                                                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                        )}
                                    >
                                        <span className="block truncate">{option.label}</span>
                                        {isSelected && (
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-brand-600">
                                                <Check className="h-4 w-4" aria-hidden="true" />
                                            </span>
                                        )}
                                    </li>
                                );
                            })}
                            {options.length === 0 && (
                                <li className="py-2 px-4 text-sm text-slate-500 text-center">No options</li>
                            )}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Hidden native select for form serialization / FormData compatibility */}
            <select className="hidden" name={props.name} value={internalValue} disabled={disabled} onChange={() => {}}>
                {children}
            </select>
        </div>
    );
}
