import { format } from 'date-fns';

interface SystemEventProps {
  label: string;
  at: string;
}

export function SystemEvent({ label, at }: SystemEventProps) {
  const time = format(new Date(at), 'MMM d · h:mm a');

  return (
    <div className="flex justify-center">
      <span className="rounded-full bg-muted px-3 py-1.5 text-muted-foreground text-xs">
        {label} · {time}
      </span>
    </div>
  );
}
