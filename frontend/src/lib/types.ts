// Mirrors backend app/schemas + app/models/enums exactly.

export type FormFieldType =
  | "TEXT"
  | "NUMBER"
  | "EMAIL"
  | "DATE"
  | "DROPDOWN"
  | "CHECKBOX"
  | "RADIO"
  | "FILE"
  | "RATING";

export type ConditionalOperator =
  | "EQUALS"
  | "NOT_EQUALS"
  | "CONTAINS"
  | "GREATER_THAN"
  | "LESS_THAN"
  | "GREATER_THAN_OR_EQUAL"
  | "LESS_THAN_OR_EQUAL";

// -------- Auth --------

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface AuthUserResponse {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

// -------- Roles --------

export interface RoleResponse {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface RoleCreate {
  name: string;
}

export type RoleUpdate = RoleCreate;

// -------- Users --------

export interface UserManagementResponse {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role_id: number;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
  role_id?: number;
  is_active?: boolean;
}

// -------- Field Options --------

export interface FieldOptionBase {
  label: string;
  value: string;
  display_order: number;
}

export interface FieldOptionCreate extends FieldOptionBase {}

export interface FieldOptionUpdate {
  label?: string;
  value?: string;
  display_order?: number;
}

export interface FieldOptionResponse extends FieldOptionBase {
  id: number;
}

// -------- Form Fields --------

export interface FormFieldBase {
  client_key: string;
  label: string;
  field_type: FormFieldType;
  placeholder?: string | null;
  help_text?: string | null;
  is_required: boolean;
  display_order: number;
  min_length?: number | null;
  max_length?: number | null;
  min_value?: number | null;
  max_value?: number | null;
  is_conditional: boolean;
  conditional_field_key?: string | null;
  conditional_operator?: ConditionalOperator | null;
  conditional_value?: string | null;
}

export interface FormFieldCreate extends FormFieldBase {
  options: FieldOptionCreate[];
}

export interface FormFieldUpdate {
  label?: string;
  field_type?: FormFieldType;
  placeholder?: string | null;
  help_text?: string | null;
  is_required?: boolean;
  display_order?: number;
  min_length?: number | null;
  max_length?: number | null;
  min_value?: number | null;
  max_value?: number | null;
  is_conditional?: boolean;
  conditional_field_key?: string | null;
  conditional_operator?: ConditionalOperator | null;
  conditional_value?: string | null;
}

export interface FormFieldResponse extends FormFieldBase {
  id: number;
  options: FieldOptionResponse[];
}

// -------- Forms --------

export interface FormBase {
  title: string;
  description?: string | null;
  is_active: boolean;
  is_public: boolean;
}

export interface FormCreate extends FormBase {
  fields: FormFieldCreate[];
}

export interface FormUpdate {
  title?: string;
  description?: string | null;
  is_active?: boolean;
  is_public?: boolean;
}

export interface FormResponseDto extends FormBase {
  id: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  fields: FormFieldResponse[];
}

export interface FormListResponseDto extends FormBase {
  id: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

// -------- Responses --------

export interface ResponseValue {
  field_id: number;
  value: unknown;
}

export interface FormResponseCreate {
  values: ResponseValue[];
}

export type FormResponseUpdate = FormResponseCreate;

export interface ResponseDetailResponse {
  id: number;
  response_id: number;
  field_id: number;
  value: string | null;
}

export interface FormResponseResponseDto {
  id: number;
  form_id: number;
  user_id: number | null;
  submitted_at: string;
  updated_at: string;
  details: ResponseDetailResponse[];
}

// -------- Activity Logs --------

export interface ActivityLogResponse {
  id: number;
  user_id: number | null;
  response_id: number | null;
  action: string;
  description: string | null;
  created_at: string;
}

// -------- Dashboard --------

export interface DashboardSummaryResponse {
  total_forms: number;
  total_responses: number;
}

export interface DashboardResponseAnalytics {
  responses_today: number;
  responses_this_week: number;
  responses_this_month: number;
}

export interface FrequentlyUsedForm {
  form_id: number;
  form_title: string;
  response_count: number;
}

export interface SubmissionTrendItem {
  date: string;
  count: number;
}

export interface DashboardResponse {
  total_forms: number;
  total_responses: number;
  response_analytics: DashboardResponseAnalytics;
  most_frequently_used_forms: FrequentlyUsedForm[];
  submission_trends: SubmissionTrendItem[];
}

// -------- Reports --------

export interface ResponseStatisticsResponse {
  total_responses: number;
  responses_today: number;
  responses_this_week: number;
  responses_this_month: number;
}

export interface FormResponseStatistics {
  form_id: number;
  form_title: string;
  total_responses: number;
}

export interface FieldOptionAnalytics {
  option: string;
  count: number;
}

export interface FieldAnalytics {
  field_id: number;
  field_label: string;
  field_type: string;
  total_responses: number;
  options: FieldOptionAnalytics[];
}

export interface FormAnalyticsResponse {
  form_id: number;
  form_title: string;
  total_responses: number;
  fields: FieldAnalytics[];
}

export interface ResponseTrendItem {
  date: string;
  count: number;
}

export interface ResponseTrendResponse {
  form_id: number | null;
  from_date: string | null;
  to_date: string | null;
  data: ResponseTrendItem[];
}

export interface ReportFilterParams {
  form_id?: number;
  user_id?: number;
  from_date?: string;
  to_date?: string;
}
