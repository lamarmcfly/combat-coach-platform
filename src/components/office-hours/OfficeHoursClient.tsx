'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';

interface CoachSlot {
  id: string;
  startTime: string;
  endTime: string;
  spotsLeft: number;
}

interface Coach {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  tagline: string | null;
  disciplines: string[];
  availableSlots: CoachSlot[];
}

interface UpcomingBooking {
  id: string;
  coachName: string;
  coachAvatar: string | null;
  startTime: string;
  endTime: string;
  meetingUrl: string | null;
  notes: string | null;
}

interface OfficeHoursClientProps {
  isElite: boolean;
  coaches: Coach[];
  upcomingBookings: UpcomingBooking[];
  remainingBookings: number;
  periodEnd: string | null;
}

export function OfficeHoursClient({
  isElite,
  coaches,
  upcomingBookings,
  remainingBookings,
  periodEnd,
}: OfficeHoursClientProps) {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [bookingSlotId, setBookingSlotId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<{
    coach: Coach;
    slot: CoachSlot;
  } | null>(null);

  const handleBookSlot = async () => {
    if (!selectedSlot) return;

    setBookingSlotId(selectedSlot.slot.id);

    try {
      const response = await fetch('/api/office-hours/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: selectedSlot.slot.id,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to book slot');
      }

      success('Booking Confirmed', `Your session with ${selectedSlot.coach.displayName} is confirmed!`);
      setSelectedSlot(null);
      setNotes('');
      router.refresh();
    } catch (err) {
      showError('Booking Failed', err instanceof Error ? err.message : 'Failed to book slot');
    } finally {
      setBookingSlotId(null);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    setCancelingId(bookingId);

    try {
      const response = await fetch(`/api/office-hours/book/${bookingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel booking');
      }

      success('Booking Canceled', 'Your booking has been canceled.');
      router.refresh();
    } catch (err) {
      showError('Cancellation Failed', err instanceof Error ? err.message : 'Failed to cancel booking');
    } finally {
      setCancelingId(null);
    }
  };

  // Show upgrade prompt for non-Elite users
  if (!isElite) {
    return (
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-8 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-4">
            Exclusive Office Hours Access
          </h2>
          <p className="text-lg text-purple-100 mb-8">
            Get personalized 1:1 coaching sessions with our elite coaches.
            Office Hours are exclusively available for Elite members who receive
            2 sessions per month as part of their subscription.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-purple-700 font-bold rounded-lg hover:bg-purple-50 transition-colors"
            >
              Upgrade to Elite
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/my/subscription"
              className="inline-flex items-center justify-center px-8 py-3 bg-purple-500/30 text-white font-medium rounded-lg hover:bg-purple-500/50 transition-colors"
            >
              View My Subscription
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Booking Status Card */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
              Your Elite Benefits
            </h3>
            <p className="text-green-700 dark:text-green-300">
              {remainingBookings > 0 ? (
                <>You have <span className="font-bold">{remainingBookings}</span> office hours session{remainingBookings !== 1 ? 's' : ''} remaining this period</>
              ) : (
                <>You&apos;ve used all your office hours sessions this period</>
              )}
            </p>
          </div>
          {periodEnd && (
            <div className="text-sm text-green-600 dark:text-green-400">
              Resets on {format(parseISO(periodEnd), 'MMM d, yyyy')}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Your Upcoming Sessions</h2>
          <div className="grid gap-4">
            {upcomingBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col sm:flex-row items-start gap-4"
              >
                <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                  {booking.coachAvatar ? (
                    <img
                      src={booking.coachAvatar}
                      alt={booking.coachName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-400">
                      {booking.coachName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-grow">
                  <h3 className="font-semibold text-lg">{booking.coachName}</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {format(parseISO(booking.startTime), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    {format(parseISO(booking.startTime), 'h:mm a')} - {format(parseISO(booking.endTime), 'h:mm a')}
                  </p>
                  {booking.notes && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
                      Note: {booking.notes}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 sm:flex-col">
                  {booking.meetingUrl && (
                    <a
                      href={booking.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Join Meeting
                    </a>
                  )}
                  <button
                    onClick={() => handleCancelBooking(booking.id)}
                    disabled={cancelingId === booking.id}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {cancelingId === booking.id ? 'Canceling...' : 'Cancel'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Coaches */}
      <div>
        <h2 className="text-xl font-bold mb-4">Available Coaches</h2>
        {coaches.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              No coaches have available office hours slots at the moment. Check back later!
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {coaches.map((coach) => (
              <div
                key={coach.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                      {coach.avatarUrl ? (
                        <img
                          src={coach.avatarUrl}
                          alt={coach.displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                          {coach.displayName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{coach.displayName}</h3>
                      {coach.tagline && (
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          {coach.tagline}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {coach.disciplines.map((discipline) => (
                          <span
                            key={discipline}
                            className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs"
                          >
                            {discipline}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {coach.availableSlots.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No available slots at the moment
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Available Slots:
                      </p>
                      <div className="grid gap-2">
                        {coach.availableSlots.slice(0, 5).map((slot) => (
                          <button
                            key={slot.id}
                            onClick={() => {
                              if (remainingBookings > 0) {
                                setSelectedSlot({ coach, slot });
                              }
                            }}
                            disabled={remainingBookings === 0}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${
                              remainingBookings === 0
                                ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 opacity-50 cursor-not-allowed'
                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">
                                  {format(parseISO(slot.startTime), 'EEE, MMM d')}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {format(parseISO(slot.startTime), 'h:mm a')} - {format(parseISO(slot.endTime), 'h:mm a')}
                                </p>
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {slot.spotsLeft} spot{slot.spotsLeft !== 1 ? 's' : ''} left
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                      {coach.availableSlots.length > 5 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                          +{coach.availableSlots.length - 5} more slots available
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4">Confirm Booking</h3>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  {selectedSlot.coach.avatarUrl ? (
                    <img
                      src={selectedSlot.coach.avatarUrl}
                      alt={selectedSlot.coach.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-400">
                      {selectedSlot.coach.displayName.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold">{selectedSlot.coach.displayName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {format(parseISO(selectedSlot.slot.startTime), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {format(parseISO(selectedSlot.slot.startTime), 'h:mm a')} - {format(parseISO(selectedSlot.slot.endTime), 'h:mm a')}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Add a note for your coach (optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What would you like to discuss?"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedSlot(null);
                  setNotes('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBookSlot}
                disabled={bookingSlotId === selectedSlot.slot.id}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {bookingSlotId === selectedSlot.slot.id ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
