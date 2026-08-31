'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import multiMonthPlugin from '@fullcalendar/multimonth'; // ← added
import interactionPlugin from '@fullcalendar/interaction';
import {
  EventInput,
  EventClickArg,
  EventContentArg,
} from '@fullcalendar/core';
import { useModal } from '@/hooks/useModal';
import { Modal } from '@/components/ui/modal';
import Link from 'next/link';
import {
  ApiError,
  consultationsApi,
  deadlinesApi,
  type Consultation,
  type DeadlineItem,
  type DeadlineType,
} from '@/lib/api';

// ---------- types ----------

interface CalendarEvent extends EventInput {
  id: string;
  title: string;
  start: string;
  end?: string;
  extendedProps: {
    calendar: string;
    type: 'consultation' | 'deadline';
    sourceId?: string;
    status?: string;
    description?: string;
    method?: string;
    href?: string;
  };
}

const DEADLINE_TYPE_LABELS: Record<string, string> = {
  rfi: 'RFI deadline',
  ppi: 'PPI deadline',
  medical: 'Medical deadline',
  document: 'Document deadline',
};

// ---------- extractors ----------

function extractConsultations(res: unknown): Consultation[] {
  if (!res || typeof res !== 'object') return [];
  const r = res as Record<string, unknown>;
  if (Array.isArray(r.data)) return r.data as Consultation[];
  if (Array.isArray(r.consultations)) return r.consultations as Consultation[];
  if (Array.isArray(res)) return res as Consultation[];
  if (r.data && typeof r.data === 'object' && !Array.isArray(r.data)) {
    const nested = r.data as Record<string, unknown>;
    if (Array.isArray(nested.consultations)) {
      return nested.consultations as Consultation[];
    }
    if (Array.isArray(nested.data)) return nested.data as Consultation[];
  }
  return [];
}

function extractDeadlines(res: unknown): DeadlineItem[] {
  if (!res || typeof res !== 'object') return [];
  const r = res as Record<string, unknown>;
  if (Array.isArray(r.data)) return r.data as DeadlineItem[];
  if (Array.isArray(r.deadlines)) return r.deadlines as DeadlineItem[];
  if (Array.isArray(r.items)) return r.items as DeadlineItem[];
  if (Array.isArray(res)) return res as DeadlineItem[];
  if (r.data && typeof r.data === 'object' && !Array.isArray(r.data)) {
    const nested = r.data as Record<string, unknown>;
    if (Array.isArray(nested.deadlines)) return nested.deadlines as DeadlineItem[];
    if (Array.isArray(nested.items)) return nested.items as DeadlineItem[];
    if (Array.isArray(nested.data)) return nested.data as DeadlineItem[];
  }
  return [];
}

function toDateKey(iso: string): string {
  try {
    return new Date(iso).toISOString().split('T')[0];
  } catch {
    return iso.slice(0, 10);
  }
}

function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function labelize(s?: string): string {
  if (!s) return '—';
  return s
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------- component ----------

const ClientCalendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [consultationsRes, deadlinesRes] = await Promise.allSettled([
        consultationsApi.myConsultations(),
        deadlinesApi.me(),
      ]);

      const calendarEvents: CalendarEvent[] = [];

      // Own consultations
      if (consultationsRes.status === 'fulfilled') {
        const consultations = extractConsultations(consultationsRes.value);
        for (const c of consultations) {
          const when = c.scheduledDate || c.preferredDate;
          if (!when) continue;
          const startIso =
              c.scheduledDate ||
              (c.preferredDate
                  ? `${c.preferredDate}T${c.preferredTime || '09:00'}:00`
                  : when);

          calendarEvents.push({
            id: `consultation-${c._id}`,
            title: `Consultation · ${labelize(String(c.method))}`,
            start: startIso,
            extendedProps: {
              calendar: 'consultation',
              type: 'consultation',
              sourceId: c._id,
              status: c.status || 'scheduled',
              description: c.notes || c.message || '',
              method: String(c.method || ''),
              href: `/portal/my-consultations/${c._id}`,
            },
          });
        }
      } else {
        console.error('Consultations failed', consultationsRes.reason);
      }

      // Own deadlines
      if (deadlinesRes.status === 'fulfilled') {
        const deadlines = extractDeadlines(deadlinesRes.value);
        for (const d of deadlines) {
          const due =
              d.deadline?.dueDate || (d as { dueDate?: string }).dueDate;
          if (!due) continue;

          const type =
              d.deadline?.type ||
              (d as { type?: DeadlineType }).type ||
              'document';
          const completed =
              d.deadline?.completed ??
              (d as { completed?: boolean }).completed ??
              false;
          if (completed) continue;

          const overdue = Boolean(
              d.overdue || new Date(due).getTime() < Date.now()
          );

          calendarEvents.push({
            id: `deadline-${d.applicationId || due}-${type}`,
            title:
                DEADLINE_TYPE_LABELS[type] ||
                `${labelize(String(type))} deadline`,
            start: toDateKey(due),
            allDay: true,
            extendedProps: {
              calendar: overdue ? 'danger' : 'deadline',
              type: 'deadline',
              sourceId: d.applicationId,
              status: overdue ? 'overdue' : 'pending',
              description:
                  d.deadline?.description ||
                  (d as { description?: string }).description ||
                  '',
              href: d.applicationId
                  ? `/portal/my-applications/${d.applicationId}`
                  : undefined,
            },
          });
        }
      } else {
        console.error('Deadlines failed', deadlinesRes.reason);
      }

      setEvents(calendarEvents);
    } catch (err) {
      setError(
          err instanceof ApiError ? err.message : 'Failed to load calendar'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    const ep = event.extendedProps as CalendarEvent['extendedProps'];
    setSelected({
      id: event.id,
      title: event.title,
      start:
          event.start?.toISOString() || (event.startStr as string) || '',
      extendedProps: {
        calendar: ep.calendar || 'primary',
        type: ep.type || 'consultation',
        sourceId: ep.sourceId,
        status: ep.status,
        description: ep.description,
        method: ep.method,
        href: ep.href,
      },
    });
    openModal();
  };

  return (
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
              My calendar
            </h1>
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">
              Your consultations and application deadlines
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-theme-xs text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-purple-500" /> Consultation
          </span>
            <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-orange-500" /> Deadline
          </span>
            <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-red-500" /> Overdue
          </span>
            <button
                type="button"
                onClick={fetchEvents}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="custom-calendar">
            {loading ? (
                <div className="flex h-96 items-center justify-center">
                  <div className="inline-flex items-center gap-2 text-gray-500">
                    <span className="size-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                    Loading events…
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
                      multiMonthPlugin, // ← added
                      interactionPlugin,
                    ]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                      left: 'prev,next today',
                      center: 'title',
                      right: 'dayGridMonth,timeGridWeek,timeGridDay,multiMonthYear', // ← Year
                    }}
                    views={{
                      multiMonthYear: {
                        type: 'multiMonth',
                        duration: { years: 1 },
                        buttonText: 'Year',
                      },
                    }}
                    events={events}
                    selectable={false}
                    editable={false}
                    eventClick={handleEventClick}
                    eventContent={renderEventContent}
                    height="auto"
                    multiMonthMaxColumns={3}
                />
            )}
          </div>
        </div>

        <Modal
            isOpen={isOpen}
            onClose={() => {
              closeModal();
              setSelected(null);
            }}
            className="max-w-[520px] p-6 lg:p-8"
        >
          {selected && (
              <div className="flex flex-col">
                <h5 className="mb-1 text-theme-xl font-semibold text-gray-800 dark:text-white/90 lg:text-2xl">
                  {selected.title}
                </h5>
                <p className="text-sm capitalize text-gray-500 dark:text-gray-400">
                  {selected.extendedProps.type}
                  {selected.extendedProps.status
                      ? ` · ${labelize(selected.extendedProps.status)}`
                      : ''}
                </p>

                <dl className="mt-6 space-y-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">When</dt>
                    <dd className="text-right font-medium text-gray-800 dark:text-white/90">
                      {formatDateTime(selected.start)}
                    </dd>
                  </div>
                  {selected.extendedProps.method && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-gray-500">Method</dt>
                        <dd className="text-right font-medium capitalize text-gray-800 dark:text-white/90">
                          {labelize(selected.extendedProps.method)}
                        </dd>
                      </div>
                  )}
                  {selected.extendedProps.description && (
                      <div>
                        <dt className="text-gray-500">Notes</dt>
                        <dd className="mt-1 text-gray-700 dark:text-gray-300">
                          {selected.extendedProps.description}
                        </dd>
                      </div>
                  )}
                </dl>

                <div className="mt-8 flex flex-wrap gap-3 sm:justify-end">
                  <button
                      type="button"
                      onClick={() => {
                        closeModal();
                        setSelected(null);
                      }}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                  >
                    Close
                  </button>
                  {selected.extendedProps.href && (
                      <Link
                          href={selected.extendedProps.href}
                          className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
                          onClick={() => closeModal()}
                      >
                        {selected.extendedProps.type === 'consultation'
                            ? 'View consultation'
                            : 'View application'}
                      </Link>
                  )}
                </div>
              </div>
          )}
        </Modal>
      </div>
  );
};

const renderEventContent = (eventInfo: EventContentArg) => {
  const calendar = eventInfo.event.extendedProps.calendar || 'primary';
  const colorMap: Record<string, string> = {
    danger: 'bg-red-500 text-white',
    consultation: 'bg-purple-500 text-white',
    deadline: 'bg-orange-500 text-white',
    primary: 'bg-blue-500 text-white',
  };
  const colorClass = colorMap[calendar] || colorMap.primary;

  return (
      <div
          className={`event-fc-color fc-event-main flex rounded-sm p-1 text-xs ${colorClass}`}
      >
        <div className="fc-daygrid-event-dot" />
        {eventInfo.timeText && (
            <div className="fc-event-time">{eventInfo.timeText}</div>
        )}
        <div className="fc-event-title truncate">{eventInfo.event.title}</div>
      </div>
  );
};

export default ClientCalendar;