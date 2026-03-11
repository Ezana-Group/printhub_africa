import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface SectionCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function SectionCard({ title, description, children }: SectionCardProps) {
  return (
    <Card className="bg-white border-[#E5E7EB]">
      <CardHeader>
        <h2 className="font-display text-base font-bold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground font-body">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}
