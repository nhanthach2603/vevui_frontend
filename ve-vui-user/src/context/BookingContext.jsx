// context/BookingContext.jsx
import { createContext, useContext, useReducer, useCallback } from 'react';

const BookingContext = createContext(null);

const initialState = {
  searchParams: { from: '', to: '', date: '', passengers: 1 },
  selectedTrip: null,
  selectedSeats: [],
  passengerInfo: { name: '', phone: '', email: '' },
  pickupPoint: null,
  dropoffPoint: null,
  paymentMethod: 'transfer',
  discount: 0,
  confirmedTicket: null,
};

const bookingReducer = (state, action) => {
  switch (action.type) {
    case 'SET_SEARCH':     return { ...state, searchParams: action.payload };
    case 'SET_TRIP':       return { ...state, selectedTrip: action.payload, selectedSeats: [] };
    case 'TOGGLE_SEAT': {
      const seats = state.selectedSeats;
      const max   = state.searchParams.passengers || 1;
      if (seats.includes(action.payload)) {
        return { ...state, selectedSeats: seats.filter(s => s !== action.payload) };
      }
      if (seats.length >= max) return state;
      return { ...state, selectedSeats: [...seats, action.payload] };
    }
    case 'SET_PASSENGER':  return { ...state, passengerInfo: action.payload };
    case 'SET_PICKUP':     return { ...state, pickupPoint: action.payload };
    case 'SET_DROPOFF':    return { ...state, dropoffPoint: action.payload };
    case 'SET_PAYMENT':    return { ...state, paymentMethod: action.payload };
    case 'SET_TICKET':     return { ...state, confirmedTicket: action.payload };
    case 'RESET':          return initialState;
    default:               return state;
  }
};

export const BookingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(bookingReducer, initialState);

  const setSearch    = useCallback((p) => dispatch({ type: 'SET_SEARCH', payload: p }), []);
  const setTrip      = useCallback((t) => dispatch({ type: 'SET_TRIP', payload: t }), []);
  const toggleSeat   = useCallback((s) => dispatch({ type: 'TOGGLE_SEAT', payload: s }), []);
  const setPassenger = useCallback((p) => dispatch({ type: 'SET_PASSENGER', payload: p }), []);
  const setPickup    = useCallback((p) => dispatch({ type: 'SET_PICKUP', payload: p }), []);
  const setDropoff   = useCallback((p) => dispatch({ type: 'SET_DROPOFF', payload: p }), []);
  const setPayment   = useCallback((p) => dispatch({ type: 'SET_PAYMENT', payload: p }), []);
  const confirmTicket = useCallback((ticket) => {
    dispatch({ type: 'SET_TICKET', payload: ticket });
    // Save to localStorage
    const existing = JSON.parse(localStorage.getItem('vevui_tickets') || '[]');
    localStorage.setItem('vevui_tickets', JSON.stringify([...existing, ticket]));
  }, []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  const totalPrice = state.selectedTrip
    ? state.selectedSeats.length * state.selectedTrip.price
    : 0;

  return (
    <BookingContext.Provider value={{
      ...state, totalPrice,
      setSearch, setTrip, toggleSeat,
      setPassenger, setPickup, setDropoff,
      setPayment, confirmTicket, reset,
    }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used within BookingProvider');
  return ctx;
};
