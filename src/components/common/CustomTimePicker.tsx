import React, { forwardRef, useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Clock } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { format, parse, isValid } from 'date-fns';

export interface CustomTimePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value?: string;
    onChange?: (e: { target: { value: string, name?: string } }) => void;
}

export const CustomTimePicker = forwardRef<HTMLInputElement, CustomTimePickerProps>(
    ({ value, onChange, className, disabled, required, ...props }, ref) => {
        const [selectedTime, setSelectedTime] = useState<Date | null>(null);

        useEffect(() => {
            if (value) {
                // value is typically 'HH:mm' or 'HH:mm:ss'
                // We parse it using today's date as a base
                const referenceDate = new Date();
                const parsedDate = parse(value, 'HH:mm', referenceDate);
                // Try parsing with seconds if simple HH:mm fails or if it contains seconds
                const parsedDateWithSeconds = value.includes(':') && value.split(':').length === 3 
                    ? parse(value, 'HH:mm:ss', referenceDate)
                    : parsedDate;
                    
                if (isValid(parsedDateWithSeconds)) {
                    setSelectedTime(parsedDateWithSeconds);
                } else {
                    setSelectedTime(null);
                }
            } else {
                setSelectedTime(null);
            }
        }, [value]);

        const handleChange = (date: Date | null) => {
            setSelectedTime(date);
            if (onChange) {
                const timeStr = date ? format(date, 'HH:mm') : '';
                onChange({ target: { value: timeStr, name: props.name } });
            }
        };

        // Custom input to inject our own styling and the clock icon easily
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
                    {value || props.placeholder || 'Select Time'}
                </span>
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
        ));

        return (
            <div className="relative w-full custom-datepicker-wrapper">
                <DatePicker
                    selected={selectedTime}
                    onChange={handleChange}
                    disabled={disabled}
                    required={required}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="Time"
                    dateFormat="h:mm aa"
                    customInput={<CustomInput className={className} />}
                    wrapperClassName="w-full"
                    popperClassName="custom-datepicker-popper"
                    showPopperArrow={false}
                />
            </div>
        );
    }
);

CustomTimePicker.displayName = 'CustomTimePicker';
