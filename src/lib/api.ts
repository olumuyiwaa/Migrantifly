export const API_BASE_URL = "https://migrantifly-backend.onrender.com/api";
const TOKEN_KEY = "migrantifly_token";
const USER_KEY = "migrantifly_user";

// ---------- enums ----------

export type UserRole = "client" | "adviser" | "admin";

export type VisaType =
  | "work"
  | "partner"
  | "student"
  | "residence"
  | "visitor"
  | "business";

export type ApplicationStage =
  | "consultation"
  | "deposit_paid"
  | "documents_completed"
  | "additional_docs_required"
  | "submitted_to_inz"
  | "inz_processing"
  | "rfi_received"
  | "ppi_received"
  | "decision";

export type DecisionOutcome = "approved" | "declined";

export type DeadlineType = "rfi" | "ppi" | "medical" | "document";

export type ConsultationMethod =
  | "online"
  | "phone"
  | "in_person"
  | "zoom"
  | "in-person"
  | "google-meet";

export type DocumentReviewStatus = "approved" | "rejected" | "pending";

export type PaymentType = "deposit" | "consultation_fee";
export type PaymentStatus = "pending" | "completed" | "failed";

// ---------- shared / utility types ----------

export interface MongoDoc {
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string | null;
}

// ---------- auth / user ----------
export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  nationality?: string;
  address?: string | Address;
  [key: string]: unknown;
}

export interface User extends MongoDoc {
  email: string;
  role: UserRole;
  profile?: UserProfile;
  isActive?: boolean;
}

export interface AuthUserSummary {
  id: string;
  email: string;
  role: UserRole;
  profile?: UserProfile;
}

// ---------- applications ----------

export interface Application extends MongoDoc {
  clientId: string;
  adviserId?: string | null;
  visaType: VisaType;
  stage: ApplicationStage;
  consultationId?: string | null;
  destinationCountry?: Country;
  inzReference?: string | null;
  decisionOutcome?: DecisionOutcome | null;
  decisionLetter?: string | null;
  notes?: string;
  // extra fields the backend may return
  [key: string]: unknown;
}

// ---------- consultations ----------

export interface Consultation extends MongoDoc {
  clientEmail: string;
  clientName: string;
  clientPhone?: string;
  preferredDate?: string;
  preferredTime?: string;
  scheduledDate?: string;
  method: ConsultationMethod | string;
  duration?: number;
  meetingLink?: string | null;
  message?: string;
  notes?: string;
  status?: string;
  visaPathways?: string[];
  proceedWithApplication?: boolean;
  [key: string]: unknown;
}

// ---------- deadlines ----------

export interface Deadline {
  type: DeadlineType;
  description?: string | null;
  dueDate: string;
  completed: boolean;
}

export interface DeadlineItem {
  applicationId: string;
  clientId: string;
  adviserId?: string | null;
  visaType: VisaType;
  stage: ApplicationStage;
  deadline: Deadline;
  overdue: boolean;
  daysRemaining: number;
}

export interface DeadlinesSummary {
  total: number;
  overdue: number;
  dueToday: number;
  dueSoon: number;
}

export interface DeadlinesResponse {
  page: number;
  limit: number;
  total: number;
  summary: DeadlinesSummary;
  data: DeadlineItem[];
}

// ---------- documents ----------

export interface DocumentItem extends MongoDoc {
  applicationId: string;
  documentType: string;
  fileName?: string;
  fileUrl?: string;
  status?: DocumentReviewStatus;
  reviewNotes?: string | null;
  expiryDate?: string | null;
  uploadedBy?: string;
  [key: string]: unknown;
}

export interface DocumentChecklistItem {
  documentType: string;
  required: boolean;
  description?: string;
  [key: string]: unknown;
}

// ---------- payments ----------

export interface Payment extends MongoDoc {
  clientId: string;
  applicationId?: string | null;
  consultationId?: string | null;
  amount: number;
  currency: string;
  type: PaymentType;
  status: PaymentStatus;
  transactionId?: string;
  gatewayReference?: string;
  invoiceUrl?: string | null;
  invoiceNumber?: string | null;
  notes?: string;
  refundAmount?: number;
}

// ---------- notifications ----------

export interface Notification extends MongoDoc {
  userId: string;
  title?: string;
  message: string;
  type?: string;
  isRead: boolean;
  relatedId?: string | null;
  relatedType?: string | null;
  [key: string]: unknown;
}

// ---------- request payloads ----------

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GenerateTokenRequest {
  email: string;
  consultationId?: string;
}

export interface SetupAccountRequest {
  token: string;
  password: string;
  profile: UserProfile;
}

export interface CreateAdviserRequest {
  email: string;
  password: string;
  profile: UserProfile;
}

export interface CreateApplicationRequest {
  visaType: VisaType;
  consultationId?: string;
  destinationCountry?: Country;
}

export interface UpdateStageRequest {
  stage: ApplicationStage | string;
  notes?: string;
}

export interface SubmitToInzRequest {
  inzReference: string;
}

export interface AddRfiRequest {
  description: string;
  dueDate: string; // ISO date-time
}

export interface AddPpiRequest {
  description: string;
  dueDate: string; // ISO date-time
}

export interface RecordDecisionRequest {
  outcome: DecisionOutcome;
  decisionLetter?: string;
  notes?: string;
}

export interface AssignAdviserRequest {
  adviserId: string;
}

export interface BookConsultationRequest {
  clientEmail: string;
  clientName: string;
  clientPhone?: string;
  preferredDate: string; // YYYY-MM-DD
  preferredTime: string; // HH:mm
  method: "online" | "phone" | "in_person";
  message?: string;
}

export interface CompleteConsultationRequest {
  notes?: string;
  visaPathways?: string[];
  proceedWithApplication?: boolean;
}

export interface EditConsultationRequest {
  scheduledDate?: string;
  method?: ConsultationMethod;
  duration?: number;
  meetingLink?: string;
  notes?: string;
  rescheduleReason?: string;
}

export interface UpdateClientProfileRequest {
  profile: UserProfile;
}

export interface ReviewDocumentRequest {
  status: DocumentReviewStatus;
  reviewNotes?: string;
}

export interface CreateConsultationPaymentRequest {
  consultationId: string;
  paymentId: string;
  amount: number;
  email: string;
}

export interface CreateDepositPaymentRequest {
  applicationId: string;
  amount: number;
}

export interface ConfirmPaymentRequest {
  paymentId: string;
  paymentIntentId: string;
}

// ---------- Bulk Actions ----------
export interface BulkActionRequest {
  applicationIds: string[];
  action: 'assign_adviser' | 'update_stage' | 'delete';
  data?: {
    adviserId?: string;
    stage?: ApplicationStage;
    notes?: string;
  };
}

// ---------- Export ----------
export interface ExportFilters {
  stage?: ApplicationStage;
  visaType?: VisaType;
  dateFrom?: string;
  dateTo?: string;
  adviserId?: string;
}

// ---------- WebSocket Events ----------
export type WebSocketEventType =
    | 'application_created'
    | 'application_updated'
    | 'stage_changed'
    | 'adviser_assigned'
    | 'decision_recorded';

export interface WebSocketEvent {
  type: WebSocketEventType;
  applicationId: string;
  data: any;
  timestamp: string;
}


// ---------- auth storage ----------

function isBrowser() {
  return typeof window !== "undefined";
}

export function getToken() {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (!isBrowser()) return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredUser() {
  if (!isBrowser()) return null;
  const value = window.localStorage.getItem(USER_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as AuthUserSummary;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUserSummary) {
  if (!isBrowser()) return;
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

// ---------- query helper ----------

function buildQuery(params?: object) {
  if (!params) return "";
  const searchParams = new URLSearchParams();
  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

// ---------- core request handling ----------

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function extractMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    const obj = payload as {
      message?: string;
      error?: string;
      errors?: { msg?: string; message?: string }[];
    };
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.error === "string") return obj.error;
    if (Array.isArray(obj.errors) && obj.errors.length > 0) {
      return (
        obj.errors
          .map((e) => e.msg || e.message)
          .filter(Boolean)
          .join(", ") || fallback
      );
    }
  }
  return fallback;
}

/**
 * Core request helper.
 * Attaches the bearer token automatically. On 401 it clears stored auth.
 * Returns the parsed JSON body as-is (or null for 204).
 */
export async function fetchApi<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const token = getToken();
  const headers = new Headers(init?.headers);

  if (!headers.has("Content-Type") && !(init?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  if (response.status === 401) {
    clearAuth();
  }

  if (response.status === 204) {
    return null as T;
  }

  const contentType = response.headers.get("content-type");
  const payload = contentType?.includes("application/json")
    ? await response.json()
    : await response.text();

  const isFailure =
    !response.ok ||
    (payload &&
      typeof payload === "object" &&
      (payload as Record<string, unknown>).success === false);

  if (isFailure) {
    throw new ApiError(
      extractMessage(payload, response.statusText),
      response.status
    );
  }

  return payload as T;
}

export async function postApi<T = unknown>(
  path: string,
  body: unknown,
  init?: RequestInit
) {
  return fetchApi<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
    ...init,
  });
}

export async function putApi<T = unknown>(
  path: string,
  body: unknown,
  init?: RequestInit
) {
  return fetchApi<T>(path, {
    method: "PUT",
    body: JSON.stringify(body),
    ...init,
  });
}

export async function patchApi<T = unknown>(
  path: string,
  body: unknown,
  init?: RequestInit
) {
  return fetchApi<T>(path, {
    method: "PATCH",
    body: JSON.stringify(body),
    ...init,
  });
}

export async function deleteApi<T = unknown>(path: string, init?: RequestInit) {
  return fetchApi<T>(path, { method: "DELETE", ...init });
}

function buildFormData(fields: object, file?: File, fileField = "document") {
  const form = new FormData();
  if (file) form.append(fileField, file);
  Object.entries(fields as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (typeof value === "object") {
        form.append(key, JSON.stringify(value));
      } else {
        form.append(key, String(value));
      }
    }
  });
  return form;
}

export async function postFormApi<T = unknown>(path: string, form: FormData) {
  return fetchApi<T>(path, { method: "POST", body: form });
}

// ---------- auth ----------

export async function login(data: LoginRequest) {
  // Response shape is not fully documented; we store whatever useful fields we can.
  const response = await postApi<{
    success?: boolean;
    token?: string;
    access_token?: string;
    user?: AuthUserSummary;
    data?: { token?: string; user?: AuthUserSummary };
    message?: string;
  }>("/auth/login", data);

  const token =
    response.token ||
    response.access_token ||
    response.data?.token;
  const user = response.user || response.data?.user;

  if (token) setToken(token);
  if (user) setStoredUser(user);

  return response;
}

export function logout() {
  // Fire-and-forget server logout; always clear local state
  postApi("/auth/logout", {}).catch(() => {});
  clearAuth();
}

export const authApi = {
  login,
  logout,
  me: () => fetchApi<{ success?: boolean; user?: User; data?: User }>("/auth/me"),
  generateToken: (data: GenerateTokenRequest) =>
    postApi<{ success?: boolean; message?: string }>("/auth/generate-token", data),
  setupAccount: (data: SetupAccountRequest) =>
    postApi<{ success?: boolean; message?: string }>("/auth/setup-account", data),
  getToken,
  getStoredUser,
  clearAuth,
};

// ---------- admin ----------

export const adminApi = {
  dashboard: () =>
      fetchApi<{ success?: boolean; data?: unknown }>("/admin/dashboard"),

  users: async (params?: {
    role?: UserRole;
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const response = await fetchApi<{
      success?: boolean;
      data?: User[];
      users?: User[];
      pagination?: { total?: number; page?: number; limit?: number };
    }>(`/admin/users${buildQuery(params)}`);

    // Normalize the response
    return {
      success: response.success ?? true,
      data: response.data ?? response.users ?? [],
      pagination: response.pagination || { total: 0 }
    };
  },

  createAdviser: (data: CreateAdviserRequest) =>
      postApi<{ success?: boolean; message?: string; data?: User }>(
          "/admin/create-adviser",
          data
      ),

  assignAdviser: (applicationId: string, data: AssignAdviserRequest) =>
      patchApi<{ success?: boolean; message?: string }>(
          `/admin/applications/${applicationId}/assign-adviser`,
          data
      ),

  systemHealth: () =>
      fetchApi<{ success?: boolean; data?: unknown }>("/admin/system-health"),
};

// ---------- applications ----------

export const applicationsApi = {
  /** Admin / adviser: list all applications */
  list: (params?: {
    stage?: ApplicationStage;
    visaType?: VisaType;
    page?: number;
    limit?: number;
    search?: string;
  }) =>
    fetchApi<{ success?: boolean; data?: Application[]; applications?: Application[] }>(
      `/applications${buildQuery(params)}`
    ),

  /** Client: create a new application */
  create: (data: CreateApplicationRequest) =>
    postApi<{ success?: boolean; data?: Application; application?: Application }>(
      "/applications",
      data
    ),

  /** Client: list own applications */
  myApplications: () =>
    fetchApi<{ success?: boolean; data?: Application[]; applications?: Application[] }>(
      "/applications/my-applications"
    ),

  /** Application dashboard view */
  dashboard: (id: string) =>
    fetchApi<{ success?: boolean; data?: unknown }>(
      `/applications/${id}/dashboard`
    ),

  /** Admin / adviser: update stage */
  updateStage: (id: string, data: UpdateStageRequest) =>
    patchApi<{ success?: boolean; data?: Application }>(
      `/applications/${id}/stage`,
      data
    ),

  /** Admin / adviser: submit to immigration authority */
  submitToInz: (id: string, data: SubmitToInzRequest) =>
    patchApi<{ success?: boolean; data?: Application }>(
      `/applications/${id}/submit-to-inz`,
      data
    ),

  /** Add RFI */
  addRfi: (id: string, data: AddRfiRequest) =>
    postApi<{ success?: boolean; message?: string }>(
      `/applications/${id}/rfi`,
      data
    ),

  /** Add PPI */
  addPpi: (id: string, data: AddPpiRequest) =>
    postApi<{ success?: boolean; message?: string }>(
      `/applications/${id}/ppi`,
      data
    ),

  /** Record final decision */
  recordDecision: (id: string, data: RecordDecisionRequest) =>
    patchApi<{ success?: boolean; data?: Application }>(
      `/applications/${id}/decision`,
      data
    ),
};


export const adminApplicationsApi = {
  // Bulk actions
  bulkAction: (data: BulkActionRequest) =>
      postApi<{ success: boolean; message: string; data?: { updatedCount: number } }>(
          '/admin/applications/bulk-action',
          data
      ),

  // Export applications
  exportApplications: (filters?: ExportFilters) =>
      fetchApi<{ success: boolean; data?: { url: string; filename: string } }>(
          `/admin/applications/export${buildQuery(filters as any)}`
      ),

  // Assignment
  assignAdviser: (applicationId: string, adviserId: string) =>
      patchApi<{ success: boolean; message: string; data?: Application }>(
          `/admin/applications/${applicationId}/assign-adviser`,
          { adviserId }
      ),

  // Bulk assign advisers
  bulkAssignAdviser: (applicationIds: string[], adviserId: string) =>
      postApi<{ success: boolean; message: string; data?: { updatedCount: number } }>(
          '/admin/applications/bulk-assign-adviser',
          { applicationIds, adviserId }
      ),

  // Advanced filters
  advancedSearch: (filters: {
    stage?: ApplicationStage[];
    visaType?: VisaType[];
    dateFrom?: string;
    dateTo?: string;
    adviserId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) =>
      fetchApi<{ success: boolean; data?: Application[]; pagination?: any }>(
          `/admin/applications/advanced-search${buildQuery(filters)}`
      ),
};


// ---------- client ----------

export const clientApi = {
  dashboard: () =>
    fetchApi<{ success?: boolean; data?: unknown }>("/client/dashboard"),

  updateProfile: (data: UpdateClientProfileRequest) =>
    patchApi<{ success?: boolean; data?: User; message?: string }>(
      "/client/profile",
      data
    ),
};

// ---------- consultations ----------

export const consultationsApi = {
  /** Public: book a consultation */
  book: (data: BookConsultationRequest) =>
    postApi<{ success?: boolean; data?: Consultation; message?: string }>(
      "/consultation/book",
      data
    ),

  /** Admin / adviser: list all */
  list: (params?: { page?: number; limit?: number; status?: string }) =>
    fetchApi<{ success?: boolean; data?: Consultation[]; consultations?: Consultation[] }>(
      `/consultation${buildQuery(params)}`
    ),

  /** Signed-in user: own consultations */
  myConsultations: () =>
    fetchApi<{ success?: boolean; data?: Consultation[]; consultations?: Consultation[] }>(
      "/consultation/my-consultations"
    ),

  /** Complete a consultation */
  complete: (id: string, data?: CompleteConsultationRequest) =>
    patchApi<{ success?: boolean; data?: Consultation; message?: string }>(
      `/consultation/${id}/complete`,
      data ?? {}
    ),

  /** Edit / reschedule */
  edit: (id: string, data: EditConsultationRequest) =>
    patchApi<{ success?: boolean; data?: Consultation; message?: string }>(
      `/consultation/${id}/edit`,
      data
    ),

  /** Assign an adviser to a consultation */
  assignAdviser: (id: string, adviserId: string) =>
      patchApi<{ success?: boolean; message?: string; data?: Consultation }>(
          `/admin/consultations/${id}/assign-adviser`,
          { adviserId }
      ),
};

// ---------- deadlines ----------

export const deadlinesApi = {
  /** Adviser / admin: list deadlines (paginated) */
  list: (params?: {
    page?: number;
    limit?: number;
    overdue?: boolean;
    type?: DeadlineType;
  }) =>
    fetchApi<DeadlinesResponse | { success?: boolean; data?: DeadlinesResponse }>(
      `/deadlines${buildQuery(params)}`
    ),

  /** Adviser / admin: deadlines for a specific client */
  byClient: (clientId: string) =>
    fetchApi<{ success?: boolean; data?: DeadlineItem[] }>(
      `/deadlines/client/${clientId}`
    ),

  /** Authenticated client: own deadlines */
  me: () =>
    fetchApi<{ success?: boolean; data?: DeadlineItem[] }>("/deadlines/me"),
};

// ---------- documents ----------

export const documentsApi = {
  /** Admin / adviser: all documents */
  list: (params?: {
    status?: DocumentReviewStatus;
    page?: number;
    limit?: number;
  }) =>
    fetchApi<{ success?: boolean; data?: DocumentItem[]; documents?: DocumentItem[] }>(
      `/documents${buildQuery(params)}`
    ),

  /** Documents for a specific application */
  byApplication: (applicationId: string) =>
    fetchApi<{ success?: boolean; data?: DocumentItem[]; documents?: DocumentItem[] }>(
      `/documents/application/${applicationId}`
    ),

  /** Document checklist for a visa type */
  checklist: (visaType: VisaType) =>
    fetchApi<{ success?: boolean; data?: DocumentChecklistItem[] }>(
      `/documents/checklist/${visaType}`
    ),

  /** Upload a document (multipart) */
  upload: (
    data: {
      applicationId: string;
      documentType: string;
      expiryDate?: string;
    },
    file: File
  ) =>
    postFormApi<{ success?: boolean; data?: DocumentItem; message?: string }>(
      "/documents/upload",
      buildFormData(data, file, "document")
    ),

  /** Review a document */
  review: (id: string, data: ReviewDocumentRequest) =>
    patchApi<{ success?: boolean; data?: DocumentItem; message?: string }>(
      `/documents/${id}/review`,
      data
    ),

  /** Delete a document */
  delete: (id: string) =>
    deleteApi<{ success?: boolean; message?: string }>(`/documents/${id}`),

  /** Get secure download URL */
  downloadUrl: (id: string) =>
    fetchApi<{ success?: boolean; data?: { url: string }; url?: string }>(
      `/documents/${id}/download`
    ),
};

// ---------- notifications ----------

export const notificationsApi = {
  list: () =>
    fetchApi<{ success?: boolean; data?: Notification[]; notifications?: Notification[] }>(
      "/notifications"
    ),

  markRead: (id: string) =>
    patchApi<{ success?: boolean; message?: string }>(
      `/notifications/${id}/read`,
      {}
    ),

  markAllRead: () =>
    patchApi<{ success?: boolean; message?: string }>(
      "/notifications/mark-all-read",
      {}
    ),

  delete: (id: string) =>
    deleteApi<{ success?: boolean; message?: string }>(`/notifications/${id}`),
};

// ---------- payments ----------

export const paymentsApi = {
  /** Consultation — public Checkout Session */
  createConsultationPayment: (data: {
    consultationId: string;
    paymentId: string;
    amount: number;
    email: string;
  }) =>
      postApi<{
        success: boolean;
        data?: { sessionId: string; url?: string };
      }>('/payments/create-consultation-payment', data),

  /** Deposit — auth required, Checkout Session (NOT PaymentIntent) */
  createDepositCheckout: (data: {
    applicationId: string;
    amount: number; // must be 500
  }) =>
      postApi<{
        success: boolean;
        data?: { sessionId: string; url: string; paymentId: string };
      }>('/payments/create-deposit-checkout', data),
  /** Confirm a completed payment */
  confirm: (data: ConfirmPaymentRequest) =>
    postApi<{
      success: boolean;
      message?: string;
      data?: { payment: Payment; invoiceUrl?: string };
    }>("/payments/confirm-payment", data),

  /** Payment history for current user */
  history: () =>
    fetchApi<{ success: boolean; data: Payment[] }>("/payments/history"),
};

// ---------- system ----------

export const systemApi = {
  health: () =>
    fetchApi<{ status: string; timestamp: string; uptime: number }>("/health"),
};
