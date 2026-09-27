type GmailFolderPlaceholderProps = {
  title: string;
  description: string;
};

export function GmailFolderPlaceholder({
  title,
  description,
}: GmailFolderPlaceholderProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-[var(--cream-lifted)] p-12 text-center text-sm text-muted-foreground">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-2 max-w-sm">{description}</p>
    </div>
  );
}
