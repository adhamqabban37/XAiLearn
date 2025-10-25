"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { CertificatePDF } from "./CertificatePDF";

interface CertificateDownloadButtonProps {
  userName: string;
  courseTitle: string;
  completedAt: Date;
  certificateId: string;
  variant?: "default" | "outline";
  size?: "sm" | "lg";
  className?: string;
}

function CertificateDownloadButton({
  userName,
  courseTitle,
  completedAt,
  certificateId,
  variant = "default",
  size = "lg",
  className = "",
}: CertificateDownloadButtonProps) {
  return (
    <PDFDownloadLink
      document={
        <CertificatePDF
          userName={userName}
          courseTitle={courseTitle}
          completedAt={completedAt}
          certificateId={certificateId}
        />
      }
      fileName={`certificate-${courseTitle.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`}
      className={`w-full ${className}`}
    >
      {({ loading }) => (
        <Button
          size={size}
          variant={variant}
          className={`w-full ${variant === "default" ? "bg-green-600 hover:bg-green-700 text-white" : "border-green-600 text-green-600 hover:bg-green-600 hover:text-white"} shadow-lg hover:shadow-xl transition-all touch-target gap-2`}
          disabled={loading}
        >
          <Download className={size === "lg" ? "w-5 h-5" : "w-4 h-4"} />
          {loading ? 'Preparing Certificate...' : '📜 Download Certificate'}
        </Button>
      )}
    </PDFDownloadLink>
  );
}

export default CertificateDownloadButton;
