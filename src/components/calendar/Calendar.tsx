"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import multiMonthPlugin from "@fullcalendar/multimonth";
import interactionPlugin from "@fullcalendar/interaction";
import {
  EventInput,
  EventClickArg,
  EventContentArg,
} from "@fullcalendar/core";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import { ApiError } from "@/lib/api";
import {
  consultationsApi,
  deadlinesApi,
  type Consultation,
  type DeadlineItem,
  type DeadlineType,
} from "@/lib/api";

interface CalendarEvent extends EventInput {
  id: string;
  title: string;
  start: string;
  end?: string;
  extendedProps: {
    calendar: string;
    type: "consultation" | "deadline";
    sourceId?: string;
    status?: string;
    description?: string;
  };
}

const DEADLINE_TYPE_LABELS: Record<DeadlineType, string> = {
  rfi: "RFI Deadline",
  ppi: "PPI Deadline",
  medical: "Medical Deadline",
  document: "Document Deadline",
};

const Calendar: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [consultationsRes, deadlinesRes] = await Promise.all([
        consultationsApi.list({ limit: 100 }),
        deadlinesApi.list({ limit: 100 }),
      ]);

      const calendarEvents: CalendarEvent[] = [];

      // Consultations
      const consultations =
          (consultationsRes as any).data ||
          (consultationsRes as any).consultations ||
          [];

      if (Array.isArray(consultations)) {
        consultations.forEach((consultation: Consultation) => {
          if (consultation.scheduledDate) {
            const startDate = new Date(consultation.scheduledDate);
            calendarEvents.push({
              id: `consultation-${consultation._id}`,
              title: `Consultation: ${consultation.clientName || "Client"}`,
              start: startDate.toISOString().split("T")[0],
              extendedProps: {
                calendar: "consultation",
                type: "consultation",
                sourceId: consultation._id,
                status: consultation.status || "scheduled",
                description:
                    consultation.message || consultation.notes || "",
              },
            });
          }
        });
      }

      // Deadlines
      const deadlinesPayload = (deadlinesRes as any).data || deadlinesRes;
      const deadlines = Array.isArray(deadlinesPayload?.data)
          ? deadlinesPayload.data
          : Array.isArray(deadlinesPayload)
              ? deadlinesPayload
              : [];

      if (Array.isArray(deadlines)) {
        deadlines.forEach((item: DeadlineItem) => {
          if (item.deadline?.dueDate) {
            const dueDate = new Date(item.deadline.dueDate);
            const isOverdue = item.overdue;

            calendarEvents.push({
              id: `deadline-${item.applicationId}-${item.deadline.type}-${item.deadline.dueDate}`,
              title:
                  DEADLINE_TYPE_LABELS[item.deadline.type] || "Deadline",
              start: dueDate.toISOString().split("T")[0],
              extendedProps: {
                calendar: isOverdue ? "danger" : "deadline",
                type: "deadline",
                sourceId: item.applicationId,
                status: isOverdue ? "overdue" : "pending",
                description: item.deadline.description || "",
              },
            });
          }
        });
      }

      setEvents(calendarEvents);
    } catch (err) {
      const message =
          err instanceof ApiError ? err.message : "Failed to load events";
      setError(message);
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    const extendedProps = event.extendedProps as CalendarEvent["extendedProps"];

    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start?.toISOString().split("T")[0] || "",
      end: event.end?.toISOString().split("T")[0],
      extendedProps,
    });
    openModal();
  };

  const handleCloseModal = () => {
    closeModal();
    setSelectedEvent(null);
  };

  return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="custom-calendar">
          {loading ? (
              <div className="flex h-96 items-center justify-center">
                <div className="inline-flex items-center gap-2">
                  <span className="size-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                  Loading events...
                </div>
              </div>
          ) : error ? (
              <div className="p-4">
                <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                  {error}
                  <button
                      type="button"
                      onClick={fetchEvents}
                      className="ml-3 font-medium underline hover:no-underline"
                  >
                    Retry
                  </button>
                </div>
              </div>
          ) : (
              <FullCalendar
                  ref={calendarRef}
                  plugins={[
                    dayGridPlugin,
                    timeGridPlugin,
                    multiMonthPlugin,
                    interactionPlugin,
                  ]}
                  initialView="dayGridMonth"
                  headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "multiMonthYear,dayGridMonth,timeGridWeek,timeGridDay",
                  }}
                  views={{
                    multiMonthYear: {
                      type: "multiMonth",
                      duration: { years: 1 },
                      buttonText: "Year",
                    },
                  }}
                  events={events}
                  selectable={false}
                  editable={false}
                  eventClick={handleEventClick}
                  eventContent={renderEventContent}
                  height="auto"
                  // Optional: make year view cleaner
                  multiMonthMaxColumns={3}   // 3 months per row in year view
              />
          )}
        </div>

        {/* Read-only event detail modal */}
        <Modal
            isOpen={isOpen}
            onClose={handleCloseModal}
            className="max-w-[500px] p-6 lg:p-8"
        >
          {selectedEvent && (
              <div className="flex flex-col">
                <div className="mb-6">
                  <h5 className="mb-1 text-xl font-semibold text-gray-800 dark:text-white/90">
                    {selectedEvent.title}
                  </h5>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedEvent.extendedProps.type === "consultation"
                        ? "Consultation"
                        : "Deadline"}
                  </p>
                </div>

                <div className="space-y-4 text-sm">
                  <div>
                <span className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                  Date
                </span>
                    <p className="mt-0.5 text-gray-800 dark:text-white/90">
                      {selectedEvent.start}
                      {selectedEvent.end &&
                      selectedEvent.end !== selectedEvent.start
                          ? ` → ${selectedEvent.end}`
                          : ""}
                    </p>
                  </div>

                  {selectedEvent.extendedProps.status && (
                      <div>
                  <span className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </span>
                        <p className="mt-0.5">
                    <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            selectedEvent.extendedProps.status === "overdue"
                                ? "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                                : selectedEvent.extendedProps.status === "pending"
                                    ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400"
                                    : "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300"
                        }`}
                    >
                      {selectedEvent.extendedProps.status
                              .charAt(0)
                              .toUpperCase() +
                          selectedEvent.extendedProps.status.slice(1)}
                    </span>
                        </p>
                      </div>
                  )}

                  {selectedEvent.extendedProps.description && (
                      <div>
                  <span className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                    Description
                  </span>
                        <p className="mt-0.5 whitespace-pre-wrap text-gray-800 dark:text-white/90">
                          {selectedEvent.extendedProps.description}
                        </p>
                      </div>
                  )}

                  {selectedEvent.extendedProps.sourceId && (
                      <div>
                  <span className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                    Related ID
                  </span>
                        <p className="mt-0.5 font-mono text-xs text-gray-600 dark:text-gray-400">
                          {selectedEvent.extendedProps.sourceId}
                        </p>
                      </div>
                  )}
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                      onClick={handleCloseModal}
                      type="button"
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                  >
                    Close
                  </button>
                </div>
              </div>
          )}
        </Modal>
      </div>
  );
};

const renderEventContent = (eventInfo: EventContentArg) => {
  const calendar = eventInfo.event.extendedProps.calendar || "primary";

  const colorMap: Record<string, string> = {
    danger: "bg-red-500 text-white",
    success: "bg-green-500 text-white",
    primary: "bg-blue-500 text-white",
    warning: "bg-yellow-500 text-white",
    info: "bg-cyan-500 text-white",
    consultation: "bg-purple-500 text-white",
    deadline: "bg-orange-500 text-white",
  };

  const colorClass = colorMap[calendar] || colorMap.primary;

  return (
      <div
          className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm text-xs`}
      >
        <div className="fc-daygrid-event-dot"></div>
        {eventInfo.timeText && (
            <div className="fc-event-time">{eventInfo.timeText}</div>
        )}
        <div className="fc-event-title truncate">{eventInfo.event.title}</div>
      </div>
  );
};

export default Calendar;