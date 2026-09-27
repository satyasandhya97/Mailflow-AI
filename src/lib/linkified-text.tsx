const URL_RE =
  /(https?:\/\/[^\s<]+[^\s<.,;:!?'")\]}>])/g;

export function LinkifiedText({ text }: { text: string }) {
  const parts = text.split(URL_RE);

  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer">
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
