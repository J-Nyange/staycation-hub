import React, { createContext, useContext, useState, ReactNode } from 'react';
import BookingNotificationModal from '@/components/notifications/BookingNotificationModal';
import { useBookingNotificationDetails } from '@/hooks/useBookingNotificationDetails';

interface BookingModalContextType {
  openBookingModal: (bookingId: string) => void;
  closeBookingModal: () => void;
}

const BookingModalContext = createContext<BookingModalContextType | undefined>(undefined);

export const BookingModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  // Fetch details for the selected booking
  const { data: bookingData, isLoading } = useBookingNotificationDetails(selectedBookingId);

  const openBookingModal = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setIsOpen(true);
  };

  const closeBookingModal = () => {
    setIsOpen(false);
    setSelectedBookingId(null);
  };

  return (
    <BookingModalContext.Provider value={{ openBookingModal, closeBookingModal }}>
      {children}
      <BookingNotificationModal
        open={isOpen}
        onOpenChange={(open) => !open && closeBookingModal()}
        bookingData={bookingData || undefined}
        isLoading={isLoading}
      />
    </BookingModalContext.Provider>
  );
};

export const useBookingModal = () => {
  const context = useContext(BookingModalContext);
  if (context === undefined) {
    throw new Error('useBookingModal must be used within a BookingModalProvider');
  }
  return context;
};
