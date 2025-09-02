"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface QuantitySelectorProps {
  initialValue?: number;
  min?: number;
  max?: number;
  onChange?: (value: number) => void;
}

export default function QuantitySelector({
  initialValue = 0,
  min = 0,
  max = 99,
  onChange
}: QuantitySelectorProps) {
    const [value, setValue] = useState<number>(initialValue);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

    const startCloseTimer = () => {
        if (timer) {
            clearTimeout(timer);
        }
        setTimer(setTimeout(() => setIsOpen(false), 3000));
    };

    const handleDecrease = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        if (isOpen && value <= 1) {
            setIsOpen(false);
            if (timer) clearTimeout(timer);
            setValue(0);
            onChange?.(0); // enviar 0 realmente
            return;
        }

        setIsOpen(true);
        if (timer) clearTimeout(timer);
        startCloseTimer();

        setValue(prev => {
            const next = Math.max(prev - 1, min);
            onChange?.(next); // usar el valor actualizado
            return next;
        });
    };

    const handleIncrease = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setIsOpen(true);

        if (timer) clearTimeout(timer);
        startCloseTimer();

        setValue(prev => {
            const next = Math.min(prev + 1, max);
            onChange?.(next); // usar el valor actualizado
            return next;
        });
    };

    return (
        <div className={`flex box-content shadow-xs justify-end items-center bg-card mt-auto border border-muted rounded-sm ${isOpen ? "w-24" : "w-8"} h-8 overflow-hidden text-card-foreground transition-all duration-300 gap-1`}>
            <button className={`flex justify-center p-2 items-center h-auto hover:text-foreground/50 overflow-hidden ${isOpen ? 'opacity-100 w-8' : 'opacity-0 w-0'}`} onClick={handleDecrease}>
                {value <= 1 ? <Trash2 className="size-4"/> : <Minus className="size-4"/>}
            </button>
            <div className={`flex justify-center items-center p-2 h-auto hover:text-foreground/50 overflow-hidden ${isOpen ? 'opacity-100 w-8' : 'opacity-0 w-0'}`}>
                <span className="text-sm/4">{value}</span>
            </div>
            <button className={`flex justify-center items-center w-8 p-2 h-auto hover:text-foreground/50`} onClick={handleIncrease}>
                <Plus className="size-4" />
            </button>
        </div>
    );
}