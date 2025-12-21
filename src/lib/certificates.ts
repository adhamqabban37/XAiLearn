import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  userName: string;
  completedAt: Date;
  certificateUrl?: string;
  downloadCount: number;
}

export interface CertificateTemplate {
  backgroundColor: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  signatureUrl?: string;
  template: "modern" | "classic" | "circuit";
}

// Certificate management functions
export const awardCertificate = async (
  userId: string,
  courseId: string,
  courseTitle: string,
  userName: string
): Promise<string> => {
  const certificateData: Omit<Certificate, "id"> = {
    userId,
    courseId,
    courseTitle,
    userName,
    completedAt: new Date(),
    downloadCount: 0,
  };

  if (!db) throw new Error("Firestore is not initialized");
  const docRef = await addDoc(collection(db, "certificates"), certificateData);
  return docRef.id;
};

export const getUserCertificates = async (
  userId: string
): Promise<Certificate[]> => {
  try {
    if (!db) return [];
    const certificatesRef = collection(db, "certificates");
    const q = query(
      certificatesRef,
      where("userId", "==", userId),
      orderBy("completedAt", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => {
      const data = d.data() as any;
      const completedAt =
        typeof data?.completedAt?.toDate === "function"
          ? data.completedAt.toDate()
          : new Date(data?.completedAt ?? Date.now());

      return {
        id: d.id,
        userId: data.userId,
        courseId: data.courseId,
        courseTitle: data.courseTitle,
        userName: data.userName,
        certificateUrl: data.certificateUrl,
        downloadCount: data.downloadCount ?? 0,
        completedAt,
      } as Certificate;
    });
  } catch (err: any) {
    // Normalize error for clearer dashboard logging
    const message = err?.message || err?.code || String(err);
    console.error("[certificates] getUserCertificates failed:", message);
    return [];
  }
};

export const getCertificate = async (
  certificateId: string
): Promise<Certificate | null> => {
  if (!db) return null;
  const certificateDoc = await getDoc(doc(db, "certificates", certificateId));
  if (certificateDoc.exists()) {
    const data = certificateDoc.data();
    return {
      id: certificateDoc.id,
      ...data,
      completedAt: data.completedAt.toDate(),
    } as Certificate;
  }
  return null;
};

export const incrementDownloadCount = async (certificateId: string) => {
  if (!db) return;
  const certificateRef = doc(db, "certificates", certificateId);
  const certificateDoc = await getDoc(certificateRef);

  if (certificateDoc.exists()) {
    const data = certificateDoc.data();
    await setDoc(
      certificateRef,
      {
        ...data,
        downloadCount: (data.downloadCount || 0) + 1,
      },
      { merge: true }
    );
  }
};
