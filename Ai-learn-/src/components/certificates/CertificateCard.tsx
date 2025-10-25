"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Award, Calendar, ExternalLink } from "lucide-react";
import type { Certificate } from "@/lib/certificates";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { CertificatePDF } from "./CertificatePDF";
import { incrementDownloadCount } from "@/lib/certificates";

interface CertificateCardProps {
  certificate: Certificate;
}

export function CertificateCard({ certificate }: CertificateCardProps) {
  const handleDownload = async () => {
    await incrementDownloadCount(certificate.id);
  };

  return (
    <Card className="circuit-bg border-accent/30 hover:glow-subtle transition-all duration-300">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-lg">{certificate.courseTitle}</CardTitle>
          </div>
          <Badge variant="secondary" className="bg-green-600 text-white">
            Completed
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 mr-2" />
          Completed on{" "}
          {certificate.completedAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>

        <div className="text-sm text-muted-foreground">
          Certificate ID: {certificate.id.slice(0, 8).toUpperCase()}
        </div>

        {certificate.downloadCount > 0 && (
          <div className="text-xs text-muted-foreground">
            Downloaded {certificate.downloadCount} time
            {certificate.downloadCount !== 1 ? "s" : ""}
          </div>
        )}

        <div className="flex gap-2">
          <PDFDownloadLink
            document={
              <CertificatePDF
                userName={certificate.userName}
                courseTitle={certificate.courseTitle}
                completedAt={certificate.completedAt}
                certificateId={certificate.id}
              />
            }
            fileName={`certificate-${certificate.courseTitle.replace(
              /[^a-zA-Z0-9]/g,
              "-"
            )}.pdf`}
            onClick={handleDownload}
          >
            {({ loading }) => (
              <Button
                className="flex-1 btn-gradient"
                size="sm"
                disabled={loading}
              >
                <Download className="h-4 w-4 mr-2" />
                {loading ? "Generating..." : "Download PDF"}
              </Button>
            )}
          </PDFDownloadLink>

          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
