import { Shell } from "@/components/Shell";
import { StudyNav } from "@/components/StudyNav";

export default async function EstudioLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Shell>
      <StudyNav studyId={id} />
      {children}
    </Shell>
  );
}
