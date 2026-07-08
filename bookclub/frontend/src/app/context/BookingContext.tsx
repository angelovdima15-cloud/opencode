import { createContext, useContext, useState, ReactNode } from "react";
import { Zone } from "../data/mockClubs";

export interface BookingState {
  clubId: string;
  clubName: string;
  selectedDate: string;
  selectedTime: string;
  selectedSeatId: string;
  selectedSeatNumber: string;
  selectedZone: Zone | null;
  duration: number;
  pricePerHour: number;
}

interface BookingContextValue {
  booking: BookingState;
  setClub: (id: string, name: string) => void;
  setDate: (date: string) => void;
  setTime: (time: string) => void;
  setSeat: (id: string, number: string, pricePerHour: number) => void;
  setZone: (zone: Zone) => void;
  setDuration: (hours: number) => void;
  resetBooking: () => void;
  totalPrice: number;
}

const defaultBooking: BookingState = {
  clubId: "",
  clubName: "",
  selectedDate: "",
  selectedTime: "",
  selectedSeatId: "",
  selectedSeatNumber: "",
  selectedZone: null,
  duration: 2,
  pricePerHour: 0,
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [booking, setBooking] = useState<BookingState>(defaultBooking);

  const setClub = (id: string, name: string) =>
    setBooking((b) => ({ ...b, clubId: id, clubName: name }));

  const setDate = (date: string) =>
    setBooking((b) => ({ ...b, selectedDate: date }));

  const setTime = (time: string) =>
    setBooking((b) => ({ ...b, selectedTime: time }));

  const setSeat = (id: string, number: string, pricePerHour: number) =>
    setBooking((b) => ({ ...b, selectedSeatId: id, selectedSeatNumber: number, pricePerHour }));

  const setZone = (zone: Zone) =>
    setBooking((b) => ({ ...b, selectedZone: zone, selectedSeatId: "", selectedSeatNumber: "" }));

  const setDuration = (hours: number) =>
    setBooking((b) => ({ ...b, duration: hours }));

  const resetBooking = () => setBooking(defaultBooking);

  const totalPrice = booking.pricePerHour * booking.duration;

  return (
    <BookingContext.Provider value={{ booking, setClub, setDate, setTime, setSeat, setZone, setDuration, resetBooking, totalPrice }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within BookingProvider");
  return ctx;
}
