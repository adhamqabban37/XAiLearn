"use server";

import { saveCourse } from "@/lib/auth";
import type { Course } from "@/lib/types";

export async function saveCourseForUser(
  uid: string,
  course: Course
): Promise<string | { error: string }> {
  try {
    const courseId = await saveCourse(uid, course);
    return courseId;
  } catch (error: any) {
    console.error("Error saving course:", error);
    return { error: error.message || "Failed to save course" };
  }
}
