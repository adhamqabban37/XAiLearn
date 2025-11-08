"use client";

import React, { useEffect, useState } from "react";
import { getUserCertificates, type Certificate } from "@/lib/certificates";
import { CertificateCard } from "./CertificateCard";
import { Card, CardContent } from "@/components/ui/card";
import { Award } from "lucide-react";

interface CertificateGalleryProps {
  userId: string;
  certificates?: Certificate[];
}

export function CertificateGallery({ userId }: CertificateGalleryProps) {
  // If certificates are provided as a prop, use them; otherwise, fetch as before
  const [internalCertificates, setInternalCertificates] = useState<
    Certificate[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Destructure certificates from props
  // eslint-disable-next-line
  const props = arguments[0] as CertificateGalleryProps;
  const certificates = props.certificates;

  useEffect(() => {
    if (Array.isArray(certificates)) {
      setInternalCertificates(certificates);
      setLoading(false);
    } else if (userId) {
      loadCertificates();
    }
  }, [userId, certificates]);

  const loadCertificates = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const userCertificates = await getUserCertificates(userId);
      setInternalCertificates(userCertificates);
    } catch (error) {
      console.error("Error loading certificates:", error);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Your Certificates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="circuit-bg border-accent/30 animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-muted/20 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Award className="h-6 w-6 text-yellow-500" />
        <h3 className="text-xl font-semibold">Your Certificates</h3>
        <span className="text-sm text-muted-foreground">
          ({internalCertificates.length})
        </span>
      </div>

      {internalCertificates.length === 0 ? (
        <Card className="text-center p-8 circuit-bg border-accent/30">
          <CardContent>
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-semibold mb-2">No certificates yet</h4>
            <p className="text-muted-foreground">
              Complete courses to earn your first certificate!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {internalCertificates.map((certificate) => (
            <CertificateCard key={certificate.id} certificate={certificate} />
          ))}
        </div>
      )}
    </div>
  );
}
