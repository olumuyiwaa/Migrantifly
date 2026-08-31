// components/form/input/Checkbox.jsx
"use client";

export default function Checkbox({ checked, onChange, disabled = false, label }) {
    return (
        <div className="flex items-center">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                disabled={disabled}
                className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800"
            />
            {label && (
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {label}
                </span>
            )}
        </div>
    );
}