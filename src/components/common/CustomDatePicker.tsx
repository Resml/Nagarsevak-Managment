import React, { forwardRef, useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, isValid } from 'date-fns';

export interface CustomDatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value?: string;
    onChange?: (e: { target: { value: string, name?: string } }) => void;
}

export const CustomDatePicker = forwardRef<HTMLInputElement, CustomDatePickerProps>(
    ({ value, onChange, className, disabled, required, min, ...props }, ref) => {
        const [selectedDate, setSelectedDate] = useState<Date | null>(null);

        useEffect(() => {
            if (value) {
                // value is typically 'YYYY-MM-DD'
                const parsedDate = parseISO(value);
                if (isValid(parsedDate)) {
                    setSelectedDate(parsedDate);
                } else {
                    setSelectedDate(null);
                }
            } else {
                setSelectedDate(null);
            }
        }, [value]);

        const handleChange = (date: Date | null) => {
            setSelectedDate(date);
            if (onChange) {
                const dateStr = date ? format(date, 'yyyy-MM-dd') : '';
                onChange({ target: { value: dateStr, name: props.name } });
            }
        };

        const minDate = min ? parseISO(min as string) : undefined;

        // Custom input to inject our own styling and the calendar icon easily
        const CustomInput = forwardRef<HTMLButtonElement, any>(({ value, onClick, className }, ref) => (
            <button
                type="button"
                className={twMerge(
                    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm flex items-center justify-between outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-300 transition-all",
                    disabled && "opacity-60 cursor-not-allowed",
                    className
                )}
                onClick={onClick}
                ref={ref}
                disabled={disabled}
            >
                <span className={value ? "text-slate-900" : "text-slate-400"}>
                    {value || props.placeholder || 'Select Date'}
                </span>
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
        ));

        return (
            <div className="relative w-full custom-datepicker-wrapper">
                <DatePicker
                    selected={selectedDate}
                    onChange={handleChange}
                    disabled={disabled}
                    required={required}
                    minDate={minDate}
                    dateFormat="yyyy-MM-dd"
                    customInput={<CustomInput className={className} />}
                    wrapperClassName="w-full"
                    popperClassName="custom-datepicker-popper"
                    showPopperArrow={false}
                />
            </div>
        );
    }
);

CustomDatePicker.displayName = 'CustomDatePicker';
