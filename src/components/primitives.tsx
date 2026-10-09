import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, Icons, Tooltip, TooltipContent, TooltipTrigger, cn } from "@wealthfolio/ui";

export function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground/70 hover:text-muted-foreground inline-flex items-center align-middle"
          aria-label="More information"
        >
          <Icons.HelpCircle size={13} />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-[260px] text-xs leading-relaxed">{text}</TooltipContent>
    </Tooltip>
  );
}

interface PanelProps {
  title: string;
  tip?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function Panel({ title, tip, actions, children, className, contentClassName }: PanelProps) {
  return (
    <Card className={cn("flex flex-col overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 p-4 pb-2">
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {tip ? <InfoTip text={tip} /> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </CardHeader>
      <CardContent className={cn("flex-1 p-4 pt-2", contentClassName)}>{children}</CardContent>
    </Card>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-12 text-sm">
      <Icons.ChartBar size={22} className="opacity-40" />
      {message}
    </div>
  );
}
