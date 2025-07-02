import ChangeDetectionPanel from "@/components/change-detection-panel";

export default function ChangeDetectionPage() {
  return (
    <main className="min-h-screen bg-background">
      <ChangeDetectionPanel />
    </main>
  );
}

export const metadata = {
  title: 'Change Detection Monitoring - ISRO Satellite Monitoring System',
  description: 'Monitor and detect changes in areas of interest using satellite imagery',
};
