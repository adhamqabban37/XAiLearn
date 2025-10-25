import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

// Register a font (you can add custom fonts here)
Font.register({
  family: "Roboto",
  src: "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2",
});

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#0F1419",
    padding: 60,
    fontFamily: "Roboto",
  },
  border: {
    border: "3px solid #0066FF",
    borderRadius: 10,
    padding: 40,
    height: "100%",
    background: "linear-gradient(135deg, #0F1419 0%, #1a2332 100%)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 60,
    height: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#0066FF",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#00D4FF",
    textAlign: "center",
    marginBottom: 40,
  },
  certificateText: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 20,
  },
  userName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FF6B35",
    textAlign: "center",
    marginBottom: 20,
    textDecoration: "underline",
  },
  courseTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#00D4FF",
    textAlign: "center",
    marginBottom: 30,
    fontStyle: "italic",
  },
  completionText: {
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 40,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: "auto",
  },
  date: {
    fontSize: 12,
    color: "#FFFFFF",
  },
  signature: {
    fontSize: 12,
    color: "#FFFFFF",
    textAlign: "center",
  },
  circuitPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
});

interface CertificatePDFProps {
  userName: string;
  courseTitle: string;
  completedAt: Date;
  certificateId: string;
}

export const CertificatePDF: React.FC<CertificatePDFProps> = ({
  userName,
  courseTitle,
  completedAt,
  certificateId,
}) => {
  const formattedDate = completedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.border}>
          {/* Header with logo */}
          <View style={styles.header}>
            <View>
              <Text style={{ fontSize: 14, color: "#0066FF" }}>
                AI Course Crafter
              </Text>
              <Text style={{ fontSize: 10, color: "#FFFFFF" }}>
                Certificate of Completion
              </Text>
            </View>
            <Text style={{ fontSize: 10, color: "#FFFFFF" }}>
              ID: {certificateId.slice(0, 8)}
            </Text>
          </View>

          {/* Certificate content */}
          <Text style={styles.title}>CERTIFICATE OF COMPLETION</Text>
          <Text style={styles.subtitle}>AI Learning Platform</Text>

          <Text style={styles.certificateText}>This is to certify that</Text>

          <Text style={styles.userName}>{userName}</Text>

          <Text style={styles.certificateText}>
            has successfully completed the course
          </Text>

          <Text style={styles.courseTitle}>"{courseTitle}"</Text>

          <Text style={styles.completionText}>
            demonstrating dedication to continuous learning and mastery of
            artificial intelligence concepts.
          </Text>

          {/* Footer */}
          <View style={styles.footer}>
            <View>
              <Text style={styles.date}>Date of Completion:</Text>
              <Text style={styles.date}>{formattedDate}</Text>
            </View>
            <View style={styles.signature}>
              <Text style={{ borderTop: "1px solid #FFFFFF", paddingTop: 5 }}>
                AI Course Crafter
              </Text>
              <Text style={{ fontSize: 10, marginTop: 5 }}>
                Digital Certificate Authority
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
