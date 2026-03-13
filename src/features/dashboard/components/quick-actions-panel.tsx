import { quickActions } from "@/features/dashboard/data/quick-actions";
import { QuickActionCard } from "@/features/dashboard/components/quick-action-card";

export function QuickActionsPanel() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">Quick actions</h2>
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-4 min-w-max">
          {quickActions.map((action) => (
            <QuickActionCard
              key={action.title}
              title={action.title}
              description={action.description}
              imageSrc={action.imageSrc}
              href={action.href}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
