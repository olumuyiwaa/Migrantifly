'use client';

import { ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MoreDotIcon } from '@/icons';
import { DropdownItem } from '@/components/ui/dropdown/DropdownItem';
import { Dropdown } from '@/components/ui/dropdown/Dropdown';
import { paymentsApi, ApiError } from '@/lib/api';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

// ---------- types ----------

type PaymentRow = {
  _id: string;
  amount: number;
  currency?: string;
  type?: string;
  status?: string;
  createdAt?: string;
  refundAmount?: number;
};

type YearMode = 'this_year' | 'last_12';

// ---------- helpers ----------

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function extractPayments(res: unknown): PaymentRow[] {
  if (!res || typeof res !== 'object') return [];
  const r = res as Record<string, unknown>;
  if (Array.isArray(r.data)) return r.data as PaymentRow[];
  if (Array.isArray(r.payments)) return r.payments as PaymentRow[];
  if (Array.isArray(res)) return res as PaymentRow[];
  if (r.data && typeof r.data === 'object' && !Array.isArray(r.data)) {
    const nested = r.data as Record<string, unknown>;
    if (Array.isArray(nested.payments)) return nested.payments as PaymentRow[];
    if (Array.isArray(nested.data)) return nested.data as PaymentRow[];
  }
  return [];
}

/** Net amount for completed payments (amount − refund). */
function netCompleted(p: PaymentRow): number {
  if (p.status !== 'completed') return 0;
  const amount = Number(p.amount) || 0;
  const refund = Number(p.refundAmount) || 0;
  return Math.max(0, amount - refund);
}

/**
 * Bucket payments into 12 monthly totals.
 * - this_year: Jan–Dec of the current calendar year
 * - last_12: rolling 12 months ending this month (labels still Jan–Dec mapped to window)
 */
function aggregateByMonth(
  payments: PaymentRow[],
  mode: YearMode
): {
  categories: string[];
  deposits: number[];
  consultations: number[];
  totals: number[];
  currency: string;
} {
  const now = new Date();
  const categories = [...MONTH_LABELS];
  const deposits = Array(12).fill(0);
  const consultations = Array(12).fill(0);
  const totals = Array(12).fill(0);
  let currency = 'USD';

  const year = now.getFullYear();

  for (const p of payments) {
    if (!p.createdAt) continue;
    const d = new Date(p.createdAt);
    if (Number.isNaN(d.getTime())) continue;

    let index = -1;
    if (mode === 'this_year') {
      if (d.getFullYear() !== year) continue;
      index = d.getMonth();
    } else {
      // last 12 months: index 0 = 11 months ago, 11 = current month
      const monthsAgo =
        (now.getFullYear() - d.getFullYear()) * 12 +
        (now.getMonth() - d.getMonth());
      if (monthsAgo < 0 || monthsAgo > 11) continue;
      index = 11 - monthsAgo;
    }

    if (index < 0 || index > 11) continue;

    const net = netCompleted(p);
    if (net <= 0) continue;

    if (p.currency) currency = p.currency;

    totals[index] += net;
    if (p.type === 'deposit') deposits[index] += net;
    else if (p.type === 'consultation_fee') consultations[index] += net;
    else totals[index] += 0; // already in totals
  }

  // For last_12, rebuild category labels as "Mon YY"
  if (mode === 'last_12') {
    for (let i = 0; i < 12; i++) {
      const dt = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      categories[i] = `${MONTH_LABELS[dt.getMonth()]} ${String(dt.getFullYear()).slice(2)}`;
    }
  }

  // Round to 2 decimals for display stability
  const round = (arr: number[]) => arr.map((n) => Math.round(n * 100) / 100);

  return {
    categories,
    deposits: round(deposits),
    consultations: round(consultations),
    totals: round(totals),
    currency,
  };
}

function formatMoney(n: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString()}`;
  }
}

// ---------- component ----------

export default function MonthlyPaymentsChart() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<YearMode>('this_year');
  const [isOpen, setIsOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentsApi.history();
      setPayments(extractPayments(res));
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to load payments'
      );
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { categories, deposits, consultations, totals, currency } = useMemo(
    () => aggregateByMonth(payments, mode),
    [payments, mode]
  );

  const yearTotal = useMemo(
    () => totals.reduce((s, n) => s + n, 0),
    [totals]
  );

  const options: ApexOptions = useMemo(
    () => ({
      colors: ['#D4A72C', '#0ba5ec'], // brand gold + blue-light
      chart: {
        fontFamily: 'Outfit, sans-serif',
        type: 'bar',
        height: 180,
        stacked: false,
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '40%',
          borderRadius: 5,
          borderRadiusApplication: 'end',
        },
      },
      dataLabels: { enabled: false },
      stroke: {
        show: true,
        width: 3,
        colors: ['transparent'],
      },
      xaxis: {
        categories,
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'left',
        fontFamily: 'Outfit',
      },
      yaxis: {
        title: { text: undefined },
        labels: {
          formatter: (val: number) =>
            val >= 1000 ? `${(val / 1000).toFixed(1)}k` : String(val),
        },
      },
      grid: {
        yaxis: { lines: { show: true } },
      },
      fill: { opacity: 1 },
      tooltip: {
        y: {
          formatter: (val: number) => formatMoney(val, currency),
        },
      },
    }),
    [categories, currency]
  );

  const series = useMemo(
    () => [
      { name: 'Deposits', data: deposits },
      { name: 'Consultation fees', data: consultations },
    ],
    [deposits, consultations]
  );

  function toggleDropdown() {
    setIsOpen((o) => !o);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Monthly payments
          </h3>
          <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
            {loading
              ? 'Loading…'
              : error
                ? error
                : `Completed revenue · ${formatMoney(yearTotal, currency)} ${
                    mode === 'this_year' ? 'this year' : 'last 12 months'
                  }`}
          </p>
        </div>

        <div className="relative inline-block">
          <button
            type="button"
            onClick={toggleDropdown}
            className="dropdown-toggle"
            aria-label="Chart options"
          >
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
          <Dropdown isOpen={isOpen} onClose={closeDropdown} className="w-44 p-2">
            <DropdownItem
              onItemClick={() => {
                setMode('this_year');
                closeDropdown();
              }}
              className="flex w-full rounded-lg text-left font-normal text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              This calendar year
            </DropdownItem>
            <DropdownItem
              onItemClick={() => {
                setMode('last_12');
                closeDropdown();
              }}
              className="flex w-full rounded-lg text-left font-normal text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Last 12 months
            </DropdownItem>
            <DropdownItem
              onItemClick={() => {
                closeDropdown();
                load();
              }}
              className="flex w-full rounded-lg text-left font-normal text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Refresh data
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      <div className="mt-4 max-w-full overflow-x-auto custom-scrollbar">
        {loading ? (
          <div className="flex h-[180px] items-center justify-center text-sm text-gray-500">
            <span className="inline-flex items-center gap-2">
              <span className="size-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              Loading chart…
            </span>
          </div>
        ) : error ? (
          <div className="flex h-[180px] flex-col items-center justify-center gap-2 text-sm text-error-600">
            <span>{error}</span>
            <button
              type="button"
              onClick={load}
              className="text-brand-500 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="-ml-5 min-w-[650px] pl-2 xl:min-w-full">
            <ReactApexChart
              options={options}
              series={series}
              type="bar"
              height={180}
            />
          </div>
        )}
      </div>
    </div>
  );
}