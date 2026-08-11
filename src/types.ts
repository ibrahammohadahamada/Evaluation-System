export type Language = 'ar' | 'en';

export type EvaluationStatus = 'yes' | 'partial' | 'no' | 'na' | 'unanswered';

export interface NistControl {
  id: string; // e.g., 'PT-1'
  familyCode: string; // e.g., 'PT'
  familyNameAr: string;
  familyNameEn: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  questionAr: string;
  questionEn: string;
  privacyFocus: boolean;
  priority?: string;
  discussion?: string;
  relatedControls?: string;
  sourceFile?: string;
}

export interface ControlEvaluation {
  controlId: string;
  status: EvaluationStatus;
  notes: string;
  evidence: string;
  aiSuggestedStatus?: 'yes' | 'partial' | 'no';
  matchingClauseAr?: string;
  matchingClauseEn?: string;
  aiReasoningAr?: string;
  aiReasoningEn?: string;
}

export interface UploadedFileRecord {
  id: string;
  name: string;
  type: 'pdf' | 'csv' | 'json' | 'txt';
  sizeBytes: number;
  uploadedAt: string;
  uploadedBy: string;
  itemCount?: number;
  summary?: string;
  sourceModule: 'policy' | 'dataset' | 'crawler' | 'evaluation';
  extractedText?: string;
}

export interface CompanyProfile {
  companyName: string;
  auditorName: string;
  email: string;
  phoneNumber: string;
  assessmentDate: string;
  industry: string;
  websiteUrl: string;
  policyText: string;
  uploadedPdfNames: string[];
}

export interface CrawlResult {
  url: string;
  pageTitle: string;
  discoveredPolicyLinks: { title: string; url: string }[];
  extractedText: string;
  status: 'success' | 'error';
  error?: string;
}

export interface AiAuditResponse {
  overallScore: number;
  complianceLevelAr: string;
  complianceLevelEn: string;
  summaryAr: string;
  summaryEn: string;
  strengthsAr: string[];
  strengthsEn: string[];
  weaknessesAr: string[];
  weaknessesEn: string[];
  recommendationsAr: string[];
  recommendationsEn: string[];
  evaluations: {
    controlId: string;
    status: 'yes' | 'partial' | 'no';
    matchingClause: string;
    reasoningAr: string;
    reasoningEn: string;
  }[];
}

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  companyName?: string;
  email: string;
  phoneNumber?: string;
  role: 'admin' | 'user';
  department: string;
  status: 'active' | 'suspended';
  lastLogin: string;
}

export interface AuthState {
  currentUser: UserAccount | null;
  isAuthenticated: boolean;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  type: 'auth' | 'evaluation' | 'admin' | 'policy';
}
