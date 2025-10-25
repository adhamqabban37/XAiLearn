"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Download, Sparkles, PartyPopper } from "lucide-react";
import { motion } from "framer-motion";
import { awardCertificate } from "@/lib/certificates";
import { useAuth } from "@/components/auth/AuthProvider";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { CertificatePDF } from "./CertificatePDF";
import { useToast } from "@/hooks/use-toast";

interface CertificateAwardModalProps {
  courseTitle: string;
  courseId: string;
  onClose: () => void;
  visible: boolean;
  shouldAward?: boolean;
}

export function CertificateAwardModal({
  courseTitle,
  courseId,
  onClose,
  visible,
  shouldAward,
}: CertificateAwardModalProps) {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [certificateId, setCertificateId] = useState<string>("");
  const [awarding, setAwarding] = useState(false);

  // Award certificate only when explicitly triggered
  const handleAwardCertificate = async () => {
    if (!user || !userProfile) return;

    setAwarding(true);
    try {
      const newCertificateId = await awardCertificate(
        user.id,
        courseId,
        courseTitle,
        userProfile.displayName
      );
      setCertificateId(newCertificateId);

      toast({
        title: "🎉 Congratulations!",
        description: "You've earned a certificate for completing this course!",
      });
    } catch (error) {
      console.error("Error awarding certificate:", error);
      toast({
        title: "Error",
        description: "Failed to generate certificate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAwarding(false);
    }
  };

  if (!visible || !user || !userProfile) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="circuit-bg border-accent/30 glow-subtle relative overflow-hidden">
          {/* Celebration animation */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                initial={{
                  x: Math.random() * 400,
                  y: -10,
                  scale: 0,
                  rotate: 0,
                }}
                animate={{
                  y: 400,
                  scale: [0, 1, 0],
                  rotate: 360,
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  delay: Math.random() * 1,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
              />
            ))}
          </div>

          <CardHeader className="text-center relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="mx-auto mb-4"
            >
              <div className="relative">
                <Award className="h-16 w-16 text-yellow-500 mx-auto" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0"
                >
                  <Sparkles className="h-6 w-6 text-yellow-300 absolute -top-2 -right-2" />
                </motion.div>
              </div>
            </motion.div>

            <CardTitle className="text-2xl text-gradient mb-2">
              🎉 Congratulations!
            </CardTitle>
            <p className="text-muted-foreground">
              You've successfully completed
            </p>
            <p className="font-semibold text-accent">"{courseTitle}"</p>
          </CardHeader>

          <CardContent className="space-y-4 relative z-10">
            <div className="text-center">
              <Badge variant="secondary" className="bg-green-600 text-white">
                <PartyPopper className="h-4 w-4 mr-1" />
                Course Completed
              </Badge>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                A certificate has been generated for your achievement!
              </p>
              <p className="text-xs text-muted-foreground">
                You can download it now or find it later in your dashboard.
              </p>
            </div>

            <div className="flex gap-2">
              {certificateId && !awarding ? (
                <PDFDownloadLink
                  document={
                    <CertificatePDF
                      userName={userProfile.displayName}
                      courseTitle={courseTitle}
                      completedAt={new Date()}
                      certificateId={certificateId}
                    />
                  }
                  fileName={`certificate-${courseTitle.replace(
                    /[^a-zA-Z0-9]/g,
                    "-"
                  )}.pdf`}
                  className="flex-1"
                >
                  {({ loading }) => (
                    <Button className="w-full btn-gradient" disabled={loading}>
                      <Download className="h-4 w-4 mr-2" />
                      {loading ? "Generating..." : "Download Certificate"}
                    </Button>
                  )}
                </PDFDownloadLink>
              ) : (
                <Button className="flex-1 btn-gradient" disabled>
                  <Download className="h-4 w-4 mr-2" />
                  {awarding ? "Generating Certificate..." : "Preparing..."}
                </Button>
              )}
            </div>

            <Button variant="outline" onClick={onClose} className="w-full">
              Continue Learning
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
