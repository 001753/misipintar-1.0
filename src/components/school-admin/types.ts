export type School = {
  id: string;
  name: string;
  slug: string;
  status: string;
  timezone: string;
};

export type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

export type SchoolClass = {
  id: string;
  name: string;
  grade: string;
  academicYear: string;
  status: string;
  studentCount: number;
};

export type SchoolStudent = {
  id: string;
  displayName: string;
  localCode: string;
  status: string;
  className: string;
  academicYear: string;
};

export type SchoolCounts = {
  members: number;
  classes: number;
  students: number;
};

export type ActionResult =
  | { success: true; data: unknown }
  | { success: false; error: string };

export type FormAction = (formData: FormData) => Promise<ActionResult>;